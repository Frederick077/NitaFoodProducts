import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build as bundle } from 'esbuild';
import { build as viteBuild } from 'vite';
import { functionConfig, isPublishedFile, isSourcePublicAsset, vercelOutputConfig } from '../deployment/output-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const resolve = name => path.resolve(root, name);
const generatedNames = new Set(['dist/client', 'dist/server', '.vercel/output']);

function prepareGeneratedDirectory(name) {
  if (!generatedNames.has(name)) throw new Error('Unapproved generated directory.');
  const target = resolve(name);
  if (!target.startsWith(root) || target === path.resolve(root)) throw new Error('Generated directory is outside the workspace.');
  let current = path.resolve(root);
  for (const part of name.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Generated directories cannot traverse symlinks.');
  }
  const marker = target + '.nita-generated';
  if (fs.existsSync(target)) {
    if (!fs.existsSync(marker) && fs.readdirSync(target).length) throw new Error(`Refusing to overwrite an unowned build directory: ${name}`);
    // Only the exact allowlisted workspace directory checked above is removed.
    fs.rmSync(target, { recursive: true, force: true });
  }
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(marker, 'NITA generated output; owned by tools/build-production.mjs\n');
  return target;
}

export function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in release artifacts.');
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative) : [relative];
  });
}

function copyPrisma(destination, vercel) {
  const modules = path.join(destination, 'node_modules');
  fs.mkdirSync(path.join(modules, '@prisma'), { recursive: true });
  fs.cpSync(resolve('node_modules/@prisma/client'), path.join(modules, '@prisma/client'), {
    recursive: true, filter: source => !/\.map$|^\.env(?:\.|$)/.test(path.basename(source)),
  });
  fs.cpSync(resolve('node_modules/.prisma/client'), path.join(modules, '.prisma/client'), {
    recursive: true,
    filter: source => {
      const name = path.basename(source);
      if (/engine.*\.(?:node|wasm)$/.test(name)) {
        return name === 'libquery_engine-rhel-openssl-3.0.x.so.node' || (!vercel && name === 'query_engine-windows.dll.node');
      }
      return !name.startsWith('.env');
    },
  });
  const engine = path.join(modules, '.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node');
  if (!fs.existsSync(engine)) throw new Error('Required Vercel Prisma engine is missing.');
}

async function main() {
  if (process.versions.node.split('.')[0] !== '24') throw new Error('Production builds require the pinned Node.js 24 runtime.');
  for (const packageName of ['prisma', '@prisma/client']) {
    if (JSON.parse(fs.readFileSync(resolve(`node_modules/${packageName}/package.json`), 'utf8')).version !== '6.19.3') throw new Error('Install the pinned Prisma 6.19.3 dependencies before building.');
  }
  console.log('[Build] Generating Prisma Client; no database commands are run.');
  const generated = spawnSync(process.execPath, ['--use-system-ca', resolve('node_modules/prisma/build/index.js'), 'generate', '--schema', resolve('prisma/schema.prisma')], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: 'true', PRISMA_GENERATE_NO_HINTS: 'true' },
  });
  if (generated.status !== 0) {
    const output = ((generated.stdout || '') + (generated.stderr || '')).replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s"')]+/gi, '[URL withheld]');
    throw new Error('Prisma generation failed. ' + output.slice(-2000));
  }
  const client = prepareGeneratedDirectory('dist/client');
  const backend = prepareGeneratedDirectory('dist/server');
  const output = prepareGeneratedDirectory('.vercel/output');

  await viteBuild({ root });
  // Vite does not copy public/ wholesale. Only reviewed browser/media types enter the CDN output.
  const skipped = [];
  for (const name of listFiles(resolve('public'))) {
    if (!isSourcePublicAsset(name)) { skipped.push(name); continue; }
    const target = path.join(client, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(resolve('public'), name), target);
  }
  const publicFiles = listFiles(client);
  const forbidden = publicFiles.filter(name => !isPublishedFile(name));
  if (forbidden.length) throw new Error('Unexpected nonpublic files in the frontend build.');

  await bundle({
    absWorkingDir: root, entryPoints: ['api/index.ts'], outfile: path.join(backend, 'app.cjs'),
    bundle: true, platform: 'node', target: 'node24', format: 'cjs', sourcemap: 'external',
    external: ['@prisma/client', '@prisma/client/*'],
    define: { 'process.env.NODE_ENV': '"production"' },
    footer: { js: 'module.exports = module.exports.default;' }, metafile: true,
  }).then(result => fs.writeFileSync(path.join(backend, 'bundle-meta.json'), JSON.stringify(result.metafile, null, 2)));
  copyPrisma(backend, false);

  const staticRoot = path.join(output, 'static');
  fs.cpSync(client, staticRoot, { recursive: true });
  const functionRoot = path.join(output, 'functions/api.func');
  fs.mkdirSync(functionRoot, { recursive: true });
  fs.copyFileSync(path.join(backend, 'app.cjs'), path.join(functionRoot, 'index.cjs'));
  copyPrisma(functionRoot, true);
  fs.writeFileSync(path.join(functionRoot, '.vc-config.json'), JSON.stringify(functionConfig, null, 2));
  fs.writeFileSync(path.join(output, 'config.json'), JSON.stringify(vercelOutputConfig, null, 2));
  const functionFiles = listFiles(functionRoot);
  if (functionFiles.some(name => /(?:^|\/)\.env(?:\.|$)|\.map$/.test(name))) throw new Error('Sensitive file or source map found in the function package.');
  const functionBytes = functionFiles.reduce((sum, name) => sum + fs.statSync(path.join(functionRoot, name)).size, 0);
  if (functionBytes >= 250 * 1024 * 1024) throw new Error('Function exceeds the standard Vercel uncompressed size limit.');
  fs.writeFileSync(path.join(backend, 'release-manifest.json'), JSON.stringify({
    node: '24.x', prisma: '6.19.3', functionBytes, skippedSourcePublicFiles: skipped,
    publicFiles: publicFiles.map(name => ({ name, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(client, name))).digest('hex') })),
    functionFiles,
  }, null, 2));
  console.log(`[Build] ${publicFiles.length} public files; private function ${(functionBytes / 1024 / 1024).toFixed(1)} MiB; Node 24; Prisma 6.19.3.`);
  console.log('[Build] Vercel Build Output API v3 prepared locally. Nothing was deployed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error('[Build] ' + error.message); process.exitCode = 1; });
}
