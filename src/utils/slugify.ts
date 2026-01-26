/**
 * Utility functions for generating URL-friendly slugs from guest names
 * Used in the guest invitation system
 */

/**
 * Generate URL-friendly slug from guest name
 * @param name - Guest name (e.g., "Budi Santoso & Keluarga")
 * @returns Slug (e.g., "budi-santoso-dan-keluarga")
 * 
 * @example
 * generateGuestSlug("Budi Santoso & Keluarga") // "budi-santoso-dan-keluarga"
 * generateGuestSlug("Dr. Ahmad (Teman SMA)") // "dr-ahmad-teman-sma"
 */
export function generateGuestSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'dan')                // & → dan
    .replace(/[^\w\s-]/g, '')            // Remove special chars
    .replace(/\s+/g, '-')                // Spaces to hyphens
    .replace(/-+/g, '-')                 // Multiple hyphens to single
    .replace(/^-+|-+$/g, '');            // Trim hyphens
}

/**
 * Convert slug back to readable name (fallback for display)
 * @param slug - URL slug (e.g., "budi-santoso-keluarga")
 * @returns Readable name (e.g., "Budi Santoso Keluarga")
 * 
 * @example
 * slugToName("budi-santoso-keluarga") // "Budi Santoso Keluarga"
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Ensure slug uniqueness by adding number suffix if needed
 * @param baseSlug - Base slug to check
 * @param existingSlugs - Array of existing slugs in database
 * @returns Unique slug with number suffix if needed
 * 
 * @example
 * ensureUniqueSlug("budi-santoso", ["budi-santoso"]) // "budi-santoso-1"
 * ensureUniqueSlug("ahmad", ["ahmad", "ahmad-1"]) // "ahmad-2"
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  // Must not start or end with hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
