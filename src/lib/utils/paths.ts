/**
 * Utility functions for handling paths with base URL support.
 * This is necessary for GitHub Pages deployment where the site may be served from a subdirectory.
 */

/**
 * Get the base path for static assets.
 * Uses SvelteKit's BASE_URL environment variable, which is automatically set.
 * BASE_URL is always '/' for root, or '/repo-name' for subdirectories (without trailing slash).
 * Note: SvelteKit's paths.base must start with '/' but NOT end with '/'.
 */
export function getBasePath(): string {
  return import.meta.env.BASE_URL;
}

/**
 * Resolve a path relative to the base path.
 * @param path - Path to resolve (should start with '/')
 * @returns Resolved path with base path prepended
 */
export function resolvePath(path: string): string {
  const base = getBasePath();
  // Ensure path starts with '/'
  const pathClean = path.startsWith('/') ? path : `/${path}`;
  
  // If base is '/', just return the path
  if (base === '/') {
    return pathClean;
  }
  
  // Normalize base: remove trailing slash if present
  const baseNormalized = base.endsWith('/') ? base.slice(0, -1) : base;
  
  // Combine base with path
  // This creates: /repo-name + /cards/cards.json = /repo-name/cards/cards.json
  return `${baseNormalized}${pathClean}`;
}

