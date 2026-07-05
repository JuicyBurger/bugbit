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
exports.artifactUploadErrorMessage = artifactUploadErrorMessage;
exports.streamLogArtifactName = streamLogArtifactName;
exports.uploadStreamLogArtifact = uploadStreamLogArtifact;
const artifact_1 = require("@actions/artifact");
const path = __importStar(require("path"));
function artifactUploadErrorMessage(error) {
    const status = error?.status;
    if (status === 403) {
        return ('Failed to upload stream log artifact: workflow job needs actions: write permission.\n\n' +
            'Required when save-stream-log is true:\n' +
            'permissions:\n' +
            '  actions: write');
    }
    if (error instanceof Error) {
        return `Failed to upload stream log artifact: ${error.message}`;
    }
    return `Failed to upload stream log artifact: ${String(error)}`;
}
function formatArtifactTimestamp(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return (`${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-` +
        `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`);
}
function streamLogArtifactName(options) {
    const githubRunId = options.githubRunId ?? process.env.GITHUB_RUN_ID ?? 'local';
    const timestamp = formatArtifactTimestamp(options.timestamp ?? new Date());
    return `bugbit-agent-stream-${options.agentRunId}-gh${githubRunId}-${timestamp}`;
}
async function uploadStreamLogArtifact(artifactName, streamLogPath) {
    const absolutePath = path.resolve(streamLogPath);
    const rootDirectory = path.dirname(absolutePath);
    const artifactClient = new artifact_1.DefaultArtifactClient();
    return artifactClient.uploadArtifact(artifactName, [absolutePath], rootDirectory);
}
