import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 2613:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("assert");

/***/ }),

/***/ 4434:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("events");

/***/ }),

/***/ 9896:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs");

/***/ }),

/***/ 8611:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("http");

/***/ }),

/***/ 5692:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("https");

/***/ }),

/***/ 9278:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("net");

/***/ }),

/***/ 4589:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:assert");

/***/ }),

/***/ 4317:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:async_hooks");

/***/ }),

/***/ 4573:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:buffer");

/***/ }),

/***/ 7540:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:console");

/***/ }),

/***/ 7598:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");

/***/ }),

/***/ 3053:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:diagnostics_channel");

/***/ }),

/***/ 610:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:dns");

/***/ }),

/***/ 8474:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:events");

/***/ }),

/***/ 7067:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:http");

/***/ }),

/***/ 2467:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:http2");

/***/ }),

/***/ 7030:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:net");

/***/ }),

/***/ 643:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:perf_hooks");

/***/ }),

/***/ 1792:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:querystring");

/***/ }),

/***/ 7075:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:stream");

/***/ }),

/***/ 1692:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:tls");

/***/ }),

/***/ 3136:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:url");

/***/ }),

/***/ 7975:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:util");

/***/ }),

/***/ 3429:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:util/types");

/***/ }),

/***/ 5919:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:worker_threads");

/***/ }),

/***/ 8522:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:zlib");

/***/ }),

/***/ 857:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("os");

/***/ }),

/***/ 3193:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("string_decoder");

/***/ }),

/***/ 4756:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("tls");

/***/ }),

/***/ 9023:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("util");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/******/ // expose the modules object (__webpack_modules__)
/******/ __nccwpck_require__.m = __webpack_modules__;
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/ensure chunk */
/******/ (() => {
/******/ 	__nccwpck_require__.f = {};
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__nccwpck_require__.e = (chunkId) => {
/******/ 		return Promise.all(Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
/******/ 			__nccwpck_require__.f[key](chunkId, promises);
/******/ 			return promises;
/******/ 		}, []));
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/get javascript chunk filename */
/******/ (() => {
/******/ 	// This function allow to reference async chunks
/******/ 	__nccwpck_require__.u = (chunkId) => {
/******/ 		// return url for filenames based on template
/******/ 		return "" + chunkId + ".index.mjs";
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nccwpck_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/******/ /* webpack/runtime/import chunk loading */
/******/ (() => {
/******/ 	// no baseURI
/******/ 	
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// [resolve, Promise] = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		792: 0
/******/ 	};
/******/ 	
/******/ 	var installChunk = (data) => {
/******/ 		var {ids, modules, runtime} = data;
/******/ 		// add "modules" to the modules object,
/******/ 		// then flag all "ids" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0;
/******/ 		for(moduleId in modules) {
/******/ 			if(__nccwpck_require__.o(modules, moduleId)) {
/******/ 				__nccwpck_require__.m[moduleId] = modules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(runtime) runtime(__nccwpck_require__);
/******/ 		for(;i < ids.length; i++) {
/******/ 			chunkId = ids[i];
/******/ 			if(__nccwpck_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				installedChunks[chunkId][0]();
/******/ 			}
/******/ 			installedChunks[ids[i]] = 0;
/******/ 		}
/******/ 	
/******/ 	}
/******/ 	
/******/ 	__nccwpck_require__.f.j = (chunkId, promises) => {
/******/ 			// import() chunk loading for javascript
/******/ 			var installedChunkData = __nccwpck_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 			if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 	
/******/ 				// a Promise means "currently loading".
/******/ 				if(installedChunkData) {
/******/ 					promises.push(installedChunkData[1]);
/******/ 				} else {
/******/ 					if(true) { // all chunks have JS
/******/ 						// setup Promise in chunk cache
/******/ 						var promise = import("./" + __nccwpck_require__.u(chunkId)).then(installChunk, (e) => {
/******/ 							if(installedChunks[chunkId] !== 0) installedChunks[chunkId] = undefined;
/******/ 							throw e;
/******/ 						});
/******/ 						var promise = Promise.race([promise, new Promise((resolve) => (installedChunkData = installedChunks[chunkId] = [resolve]))])
/******/ 						promises.push(installedChunkData[1] = promise);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 	};
/******/ 	
/******/ 	// no prefetching
/******/ 	
/******/ 	// no preloaded
/******/ 	
/******/ 	// no external install chunk
/******/ 	
/******/ 	// no on chunks loaded
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  i_: () => (/* binding */ PermissionError),
  $V: () => (/* binding */ assertReviewPermissions),
  Wu: () => (/* binding */ formatPermissionErrorMessage)
});

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: ./scripts/lib/event.mjs


function loadEvent(eventPath = process.env.GITHUB_EVENT_PATH) {
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH not set');
  return JSON.parse((0,external_node_fs_namespaceObject.readFileSync)(eventPath, 'utf8'));
}

function requirePullRequest(eventPath = process.env.GITHUB_EVENT_PATH) {
  const event = loadEvent(eventPath);
  const pr = event.pull_request ?? null;
  if (!pr) {
    throw new Error('Workflow is not running on a pull_request event');
  }
  return pr;
}

function getPullRequestFromEvent() {
  const event = loadEvent();
  return event.pull_request ?? null;
}

;// CONCATENATED MODULE: ./scripts/lib/preflight.mjs


/**
 * @param {string} repository
 */
function parseRepo(repository) {
  if (!repository) throw new Error('GITHUB_REPOSITORY not set');
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid repository: ${repository}`);
  return { owner, repo };
}

const PermissionError = class extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'PermissionError';
    this.code = code;
  }
};

const WORKFLOW_PERMISSIONS_HINT = `Required workflow permissions:
permissions:
  contents: read
  pull-requests: write`;

/**
 * @param {unknown} error
 * @returns {string}
 */
function formatPermissionErrorMessage(error) {
  if (error instanceof PermissionError) {
    return `${error.message}\n\n${WORKFLOW_PERMISSIONS_HINT}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {unknown} error
 * @returns {number | undefined}
 */
function getStatus(error) {
  if (error && typeof error === 'object') {
    const status = /** @type {{ status?: number; response?: { status?: number } }} */ (error).status;
    if (typeof status === 'number') {
      return status;
    }
    const responseStatus = /** @type {{ response?: { status?: number } }} */ (error).response?.status;
    if (typeof responseStatus === 'number') {
      return responseStatus;
    }
  }
  return undefined;
}

/**
 * @param {number | undefined} status
 * @param {'read' | 'write'} phase
 * @returns {PermissionError | undefined}
 */
function mapHttpError(status, phase) {
  if (status === 401) {
    return new PermissionError(
      'TOKEN_REJECTED',
      'GitHub token was rejected by the API. Check that github-token is valid.',
    );
  }
  if (status === 404) {
    return new PermissionError(
      'PR_NOT_FOUND',
      'Pull request or repository not found, or token cannot access this repo.',
    );
  }
  if (status === 403) {
    if (phase === 'read') {
      return new PermissionError(
        'PR_READ_DENIED',
        'Token cannot read this pull request. Ensure workflow permissions include contents: read and pull-requests: read or write.',
      );
    }
    return new PermissionError(
      'PR_WRITE_DENIED',
      'Token cannot post pull request reviews. Ensure workflow permissions include pull-requests: write.',
    );
  }
  return undefined;
}

/**
 * @typedef {{ token: string, eventPath: string, repository: string }} PreflightDeps
 */

/**
 * @param {PreflightDeps} deps
 * @param {import('@octokit/rest').Octokit} [octokit]
 */
async function assertReviewPermissions(deps, octokit = undefined) {
  const client =
    octokit ?? (await Promise.all(/* import() */[__nccwpck_require__.e(137), __nccwpck_require__.e(785)]).then(__nccwpck_require__.bind(__nccwpck_require__, 6785))).createClient(deps.token);
  const pr = requirePullRequest(deps.eventPath);
  const { owner, repo } = parseRepo(deps.repository);

  try {
    await client.rest.pulls.get({
      owner,
      repo,
      pull_number: pr.number,
    });
  } catch (error) {
    const mapped = mapHttpError(getStatus(error), 'read');
    if (mapped) {
      throw mapped;
    }
    throw error;
  }

  try {
    const { data: pending } = await client.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      body: '',
    });
    await client.rest.pulls.deletePendingReview({
      owner,
      repo,
      pull_number: pr.number,
      review_id: pending.id,
    });
  } catch (error) {
    const mapped = mapHttpError(getStatus(error), 'write');
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

var __webpack_exports__PermissionError = __webpack_exports__.i_;
var __webpack_exports__assertReviewPermissions = __webpack_exports__.$V;
var __webpack_exports__formatPermissionErrorMessage = __webpack_exports__.Wu;
export { __webpack_exports__PermissionError as PermissionError, __webpack_exports__assertReviewPermissions as assertReviewPermissions, __webpack_exports__formatPermissionErrorMessage as formatPermissionErrorMessage };
