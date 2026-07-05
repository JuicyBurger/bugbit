/**
 * Runtime dynamic import that survives ncc bundling.
 * ncc rewrites bare import() to require(), which cannot load file:// ESM modules.
 */
export function dynamicImport<T = unknown>(specifier: string): Promise<T> {
  const importFn = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<T>;
  return importFn(specifier);
}
