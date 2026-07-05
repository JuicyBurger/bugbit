export const id = 785;
export const ids = [785];
export const modules = {

/***/ 6785:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createClient: () => (/* binding */ createClient),
/* harmony export */   getClient: () => (/* binding */ getClient),
/* harmony export */   getRepo: () => (/* binding */ getRepo),
/* harmony export */   parseRepo: () => (/* binding */ parseRepo)
/* harmony export */ });
/* harmony import */ var _actions_github__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5137);


function createClient(token) {
  if (!token) throw new Error('GITHUB_TOKEN not set');
  return (0,_actions_github__WEBPACK_IMPORTED_MODULE_0__/* .getOctokit */ .Q)(token);
}

function parseRepo(repository) {
  if (!repository) throw new Error('GITHUB_REPOSITORY not set');
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid repository: ${repository}`);
  return { owner, repo };
}

function getClient() {
  return createClient(process.env.GITHUB_TOKEN);
}

function getRepo() {
  return parseRepo(process.env.GITHUB_REPOSITORY);
}


/***/ })

};
