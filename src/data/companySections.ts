export const companySections = ['introduction', 'mission', 'story', 'products', 'values', 'production', 'community', 'discover'] as const;
export type CompanySection = typeof companySections[number];

export const companySectionAliases: Record<string, CompanySection> = {
  vision: 'mission', purpose: 'mission', 'our-story': 'story',
  quality: 'production', certifications: 'production', ingredients: 'production',
  sustainability: 'community', farmers: 'community', resources: 'community',
  'what-we-bring': 'products',
};

export function companySectionForHash(hash: string, fallback?: CompanySection): string {
  let fragment = '';
  try { fragment = decodeURIComponent(hash.replace(/^#/, '')); } catch { return fallback || ''; }
  const mapped = Object.hasOwn(companySectionAliases, fragment) ? companySectionAliases[fragment] : fragment;
  return fallback && !companySections.includes(mapped as CompanySection) ? fallback : mapped;
}
