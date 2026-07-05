"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicImport = dynamicImport;
/**
 * Runtime dynamic import that survives ncc bundling.
 * ncc rewrites bare import() to require(), which cannot load file:// ESM modules.
 */
function dynamicImport(specifier) {
    const importFn = new Function('specifier', 'return import(specifier)');
    return importFn(specifier);
}
