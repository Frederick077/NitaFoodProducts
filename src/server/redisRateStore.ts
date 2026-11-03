import type { RateLimitStore } from './rateLimits';

const incrementWindow = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

// One atomic Redis script per budget; no SDK, account creation or local production fallback.
export function redisRateStore(endpoint: string, token: string, namespace: string, request: typeof fetch = fetch): RateLimitStore {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      !token.trim() || /[\r\n]/.test(token) || !/^[a-zA-Z0-9_-]{1,60}$/.test(namespace)) throw new Error('Invalid shared rate-limit configuration.');
  return { shared: true, async consume(key, windowMs) {
    const response = await request(url.origin, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', incrementWindow, '1', `${namespace}:${key}`, String(windowMs)]),
      signal: AbortSignal.timeout(2500), redirect: 'error',
    });
    if (!response.ok) throw new Error('Shared rate-limit service unavailable.');
    const data = await response.json();
    const result = data?.result;
    if (data.error || !Array.isArray(result) || result.length !== 2 || !Number.isSafeInteger(result[0]) || result[0] < 1 ||
        !Number.isSafeInteger(result[1]) || result[1] < 0 || result[1] > windowMs) throw new Error('Invalid shared rate-limit response.');
    return { count: result[0], retryAfter: Math.max(1, Math.ceil(result[1] / 1000)) };
  } };
}

export function configuredRateStore(env: Record<string, string | undefined>): RateLimitStore | undefined {
  const endpoint = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!endpoint && !token) return undefined;
  if (!endpoint || !token) throw new Error('Both shared rate-limit connection settings are required.');
  const namespace = env.RATE_LIMIT_NAMESPACE || `nita-${env.VERCEL_ENV || env.NODE_ENV || 'development'}`;
  return redisRateStore(endpoint, token, namespace);
}
