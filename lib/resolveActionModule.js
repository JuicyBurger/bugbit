"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveActionModuleUrl = resolveActionModuleUrl;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const url_1 = require("url");
function bundledModulePath(actionPath, moduleName) {
    return path.join(actionPath, 'dist', 'scripts', moduleName, 'index.mjs');
}
/**
 * Resolve an action script module for dynamic import.
 * Bundled scripts (with @actions/github) ship under dist/scripts/{module}/.
 * Unbundled scripts/lib/*.mjs are used for local CLI and Jest mocks.
 */
function resolveActionModuleUrl(actionPath, moduleName) {
    const bundledPath = bundledModulePath(actionPath, moduleName);
    if (fs.existsSync(bundledPath)) {
        return (0, url_1.pathToFileURL)(bundledPath).href;
    }
    return (0, url_1.pathToFileURL)(path.join(actionPath, 'scripts', 'lib', `${moduleName}.mjs`)).href;
}
