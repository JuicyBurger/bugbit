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
const path = __importStar(require("path"));
const checkCheckout_1 = require("./checkCheckout");
const reviewModes_1 = require("./reviewModes");
const cursorAgent_1 = require("./cursorAgent");
async function run() {
    try {
        const cwd = process.cwd();
        (0, checkCheckout_1.assertRepoCheckedOut)(cwd);
        const apiKey = core.getInput('cursor-api-key', { required: true });
        const model = core.getInput('model') || 'composer-2.5';
        const modesInput = core.getInput('review-modes') || 'code-review';
        process.env.GITHUB_TOKEN = core.getInput('github-token', { required: true });
        const actionPath = process.env.GITHUB_ACTION_PATH ?? cwd;
        const promptsDir = path.join(actionPath, 'prompts');
        const prompt = (0, reviewModes_1.buildSkillPrompt)(modesInput, promptsDir, actionPath);
        const modes = (0, reviewModes_1.parseReviewModes)(modesInput);
        core.info(`Starting Cursor agent (model: ${model}, modes: ${modes.join(', ')})`);
        await (0, cursorAgent_1.runAgent)(apiKey, model, prompt, cwd);
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
    }
}
run();
