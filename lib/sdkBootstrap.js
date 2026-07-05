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
exports.getPlatformKey = getPlatformKey;
exports.getRgBinaryName = getRgBinaryName;
exports.isExecutable = isExecutable;
exports.findRipgrepOnPath = findRipgrepOnPath;
exports.findVendoredRipgrep = findVendoredRipgrep;
exports.bootstrapRipgrep = bootstrapRipgrep;
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const core = __importStar(require("@actions/core"));
const LINUX_RG_CANDIDATES = ['/usr/bin/rg', '/usr/local/bin/rg'];
const DARWIN_RG_CANDIDATES = ['/opt/homebrew/bin/rg', '/usr/local/bin/rg'];
const WIN32_RG_CANDIDATES = [
    'C:\\Program Files\\ripgrep\\rg.exe',
    'C:\\Program Files (x86)\\ripgrep\\rg.exe',
];
const VENDORED_PLATFORM = 'linux-x64';
function getPlatformKey() {
    return `${process.platform}-${process.arch}`;
}
function getRgBinaryName() {
    return process.platform === 'win32' ? 'rg.exe' : 'rg';
}
function isExecutable(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
function systemRipgrepCandidates() {
    switch (process.platform) {
        case 'darwin':
            return DARWIN_RG_CANDIDATES;
        case 'win32':
            return WIN32_RG_CANDIDATES;
        default:
            return LINUX_RG_CANDIDATES;
    }
}
function findRipgrepOnPath() {
    const binaryName = getRgBinaryName();
    if (process.platform === 'win32') {
        try {
            const result = (0, node_child_process_1.execFileSync)('where', [binaryName], { encoding: 'utf8' }).trim();
            const first = result.split(/\r?\n/).find((line) => line.trim().length > 0);
            if (first && isExecutable(first.trim())) {
                return first.trim();
            }
        }
        catch {
            // where exits non-zero when rg is not on PATH
        }
        return undefined;
    }
    try {
        const result = (0, node_child_process_1.execFileSync)('which', [binaryName], { encoding: 'utf8' }).trim();
        if (result && isExecutable(result)) {
            return result;
        }
    }
    catch {
        // which exits non-zero when rg is not on PATH
    }
    return undefined;
}
function findVendoredRipgrep(bundleDir) {
    if (getPlatformKey() !== VENDORED_PLATFORM) {
        return undefined;
    }
    const vendoredPath = path.join(bundleDir, 'vendor', VENDORED_PLATFORM, getRgBinaryName());
    if (isExecutable(vendoredPath)) {
        return vendoredPath;
    }
    return undefined;
}
function configureRipgrepPath(found) {
    const absolutePath = path.resolve(found);
    process.env.CURSOR_RIPGREP_PATH = absolutePath;
    core.info(`Configured CURSOR_RIPGREP_PATH=${absolutePath}`);
}
/**
 * Seed CURSOR_RIPGREP_PATH for bundled GHA runs where @cursor/sdk-linux-x64
 * is not shipped alongside dist/index.js as a node_modules package.
 */
function bootstrapRipgrep(bundleDir = __dirname) {
    const existing = process.env.CURSOR_RIPGREP_PATH;
    if (existing && path.isAbsolute(existing) && isExecutable(existing)) {
        core.info(`Using existing CURSOR_RIPGREP_PATH=${existing}`);
        return;
    }
    const found = findRipgrepOnPath() ??
        systemRipgrepCandidates().find((candidate) => isExecutable(candidate)) ??
        findVendoredRipgrep(bundleDir);
    if (found) {
        configureRipgrepPath(found);
        return;
    }
    core.warning('ripgrep (rg) not found; Cursor SDK ignore-aware file search may be degraded. ' +
        'Install ripgrep on the runner or set CURSOR_RIPGREP_PATH.');
}
