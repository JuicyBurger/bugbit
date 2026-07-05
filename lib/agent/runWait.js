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
exports.AGENT_TIMEOUT_MESSAGE = exports.AGENT_TIMEOUT_MS = void 0;
exports.waitForRunWithHeartbeat = waitForRunWithHeartbeat;
exports.remainingMs = remainingMs;
exports.assertWithinDeadline = assertWithinDeadline;
const core = __importStar(require("@actions/core"));
const HEARTBEAT_MS = 30_000;
exports.AGENT_TIMEOUT_MS = 45 * 60 * 1000;
exports.AGENT_TIMEOUT_MESSAGE = `Agent timed out after ${Math.round(exports.AGENT_TIMEOUT_MS / 60_000)} minutes`;
async function waitForRunWithHeartbeat(run, timeoutMs) {
    if (timeoutMs <= 0) {
        throw new Error(exports.AGENT_TIMEOUT_MESSAGE);
    }
    core.info('Stream ended; waiting for run completion…');
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        const heartbeat = setInterval(() => {
            const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
            core.info(`[wait] run status=${run.status} elapsed=${elapsedSec}s`);
        }, HEARTBEAT_MS);
        const timer = setTimeout(() => {
            clearInterval(heartbeat);
            reject(new Error(exports.AGENT_TIMEOUT_MESSAGE));
        }, timeoutMs);
        run
            .wait()
            .then((result) => {
            clearInterval(heartbeat);
            clearTimeout(timer);
            resolve(result);
        })
            .catch((error) => {
            clearInterval(heartbeat);
            clearTimeout(timer);
            reject(error);
        });
    });
}
function remainingMs(deadlineMs) {
    return deadlineMs - Date.now();
}
function assertWithinDeadline(deadlineMs) {
    if (remainingMs(deadlineMs) <= 0) {
        throw new Error(exports.AGENT_TIMEOUT_MESSAGE);
    }
}
