export function variantLabel(variant: { name?: string | null; size?: string | null }): string {
  return [...new Set([variant.name, variant.size].map(value => value?.trim()).filter(Boolean))].join(' / ') || 'Standard';
}
