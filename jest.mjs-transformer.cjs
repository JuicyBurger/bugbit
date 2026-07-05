/** Minimal CJS wrapper so Jest can load ESM .mjs script modules. */
module.exports = {
  process(sourceText) {
    const code = `${sourceText
      .replace(/\bexport const /g, 'const ')
      .replace(/\bexport function /g, 'function ')}

module.exports = { DIFF_SIZE_LIMIT, parseUnifiedPatch, buildLineMap, mapGitHubStatus };
`;

    return { code };
  },
};
