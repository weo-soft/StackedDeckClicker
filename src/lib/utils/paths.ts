/**
 * Utility functions for handling paths with base URL support.
 * This is necessary for GitHub Pages deployment where the site may be served from a subdirectory.
 */

/**
 * Get the base path for static assets.
 * Uses SvelteKit's BASE_URL environment variable, which is automatically set.
 * BASE_URL is always '/' for root, or '/repo-name/' for subdirectories (with trailing slash).
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
  
  // Otherwise, combine base (which has trailing slash) with path (which has leading slash)
  // Remove the leading slash from path to avoid double slashes
  const pathWithoutLeadingSlash = pathClean.slice(1);
  return `${base}${pathWithoutLeadingSlash}`;
}

