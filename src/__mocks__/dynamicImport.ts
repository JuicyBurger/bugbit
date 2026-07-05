export function dynamicImport<T = unknown>(specifier: string): Promise<T> {
  return import(specifier) as Promise<T>;
}
