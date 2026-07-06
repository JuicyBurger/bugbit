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
exports.EventResolutionError = void 0;
exports.resolveEvent = resolveEvent;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class EventResolutionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EventResolutionError';
    }
}
exports.EventResolutionError = EventResolutionError;
function getHttpStatus(error) {
    if (error && typeof error === 'object') {
        const status = error.status;
        if (typeof status === 'number') {
            return status;
        }
        const responseStatus = error.response?.status;
        if (typeof responseStatus === 'number') {
            return responseStatus;
        }
    }
    return undefined;
}
function missingPullRequestMessage() {
    const eventName = process.env.GITHUB_EVENT_NAME ?? '';
    if (eventName === 'workflow_dispatch') {
        return ('bugbit requires pull request context. Pass `pr-number` when triggering via `workflow_dispatch`, ' +
            'or use `on: pull_request`. See README: Supported workflow triggers.');
    }
    return ('bugbit requires pull request context. Use `on: pull_request`, or pass `pr-number` when triggering via `workflow_dispatch`. ' +
        'See README: Supported workflow triggers.');
}
function parseRepository(repository) {
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
        throw new EventResolutionError(`Invalid repository: ${repository}`);
    }
    return { owner, repo };
}
function parsePrNumber(prNumber) {
    const trimmed = prNumber.trim();
    if (!/^\d+$/.test(trimmed)) {
        throw new EventResolutionError(`Invalid pr-number: "${prNumber}". Must be a positive integer.`);
    }
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new EventResolutionError(`Invalid pr-number: "${prNumber}". Must be a positive integer.`);
    }
    return parsed;
}
/**
 * Resolves GITHUB_EVENT_PATH to a file containing pull_request context.
 * Returns the original path when pull_request is already present; otherwise
 * fetches the PR via API when pr-number is provided.
 */
async function resolveEvent(params) {
    const { token, repository, eventPath, prNumber } = params;
    if (!eventPath) {
        throw new EventResolutionError('GITHUB_EVENT_PATH not set');
    }
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    if (event.pull_request) {
        return eventPath;
    }
    if (!prNumber?.trim()) {
        throw new EventResolutionError(missingPullRequestMessage());
    }
    const pullNumber = parsePrNumber(prNumber);
    const { owner, repo } = parseRepository(repository);
    let pull_request;
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 404) {
                throw new EventResolutionError(`Pull request #${pullNumber} not found in ${repository}. Check pr-number and repository.`);
            }
            if (status === 401) {
                throw new EventResolutionError(`Cannot fetch pull request #${pullNumber}: GitHub token was rejected by the API.`);
            }
            if (status === 403) {
                throw new EventResolutionError(`Cannot fetch pull request #${pullNumber}: token lacks permission to read this pull request.`);
            }
            throw new EventResolutionError(`Cannot fetch pull request #${pullNumber}: GitHub API returned ${status}.`);
        }
        pull_request = await response.json();
    }
    catch (error) {
        if (error instanceof EventResolutionError) {
            throw error;
        }
        const status = getHttpStatus(error);
        if (status === 404) {
            throw new EventResolutionError(`Pull request #${pullNumber} not found in ${repository}. Check pr-number and repository.`);
        }
        if (status === 401) {
            throw new EventResolutionError(`Cannot fetch pull request #${pullNumber}: GitHub token was rejected by the API.`);
        }
        if (status === 403) {
            throw new EventResolutionError(`Cannot fetch pull request #${pullNumber}: token lacks permission to read this pull request.`);
        }
        throw error;
    }
    const mergedEvent = { ...event, pull_request };
    const runnerTemp = process.env.RUNNER_TEMP ?? os.tmpdir();
    const resolvedPath = path.join(runnerTemp, `bugbit-event-pr-${pullNumber}.json`);
    fs.writeFileSync(resolvedPath, JSON.stringify(mergedEvent));
    return resolvedPath;
}
