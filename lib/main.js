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
const core = __importStar(require("@actions/core"));
const artifact_1 = require("@actions/artifact");
const path = __importStar(require("path"));
const actionPath_1 = require("./actionPath");
const checkCheckout_1 = require("./checkCheckout");
const reviewModes_1 = require("./reviewModes");
const bugbitTools_1 = require("./bugbitTools");
const cursorAgent_1 = require("./cursorAgent");
const sdkBootstrap_1 = require("./sdkBootstrap");
async function run() {
    try {
        (0, sdkBootstrap_1.bootstrapRipgrep)();
        const cwd = process.cwd();
        (0, checkCheckout_1.assertRepoCheckedOut)(cwd);
        const apiKey = core.getInput('cursor-api-key', { required: true });
        const githubToken = core.getInput('github-token', { required: true });
        core.setSecret(githubToken);
        const model = core.getInput('model') || 'composer-2.5';
        const modesInput = core.getInput('review-modes') || 'code-review';
        const saveStreamLog = core.getBooleanInput('save-stream-log');
        const eventPath = process.env.GITHUB_EVENT_PATH ?? '';
        const repository = process.env.GITHUB_REPOSITORY ?? '';
        if ((0, bugbitTools_1.isForkPullRequest)(eventPath)) {
            core.setFailed('bugbit cannot post review comments on pull requests from forks: ' +
                'GITHUB_TOKEN is read-only for fork PRs. ' +
                'See bugbit documentation (DOCS-04) for workarounds.');
            return;
        }
        const actionPath = (0, actionPath_1.resolveActionPath)(cwd);
        // permissions.json is best-effort shell policy; custom tools are the trust boundary for PR ops.
        (0, bugbitTools_1.copyPermissionsToWorkspace)(actionPath, cwd);
        const promptsDir = path.join(actionPath, 'prompts');
        const toolDeps = {
            githubToken,
            eventPath,
            repository,
            actionPath,
        };
        const prefetched = await (0, bugbitTools_1.prefetchPrData)(toolDeps);
        const prompt = (0, reviewModes_1.buildSkillPrompt)(modesInput, promptsDir, actionPath, prefetched);
        const modes = (0, reviewModes_1.parseReviewModes)(modesInput);
        const customTools = (0, bugbitTools_1.createBugbitTools)(toolDeps);
        core.info(`Starting Cursor agent (model: ${model}, modes: ${modes.join(', ')})`);
        const { runId, streamLogPath } = await (0, cursorAgent_1.runAgent)(apiKey, model, prompt, cwd, customTools, { saveStreamLog });
        if (saveStreamLog && streamLogPath) {
            const artifactClient = new artifact_1.DefaultArtifactClient();
            const uploadResponse = await artifactClient.uploadArtifact(`bugbit-agent-stream-${runId}`, [path.basename(streamLogPath)], path.dirname(streamLogPath));
            core.info(`Uploaded stream log artifact (id: ${uploadResponse.id ?? 'unknown'})`);
        }
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
    }
}
run();
