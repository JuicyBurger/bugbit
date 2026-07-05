/** Minimal CJS wrapper so Jest can load ESM .mjs script modules. */
module.exports = {
  process(sourceText) {
    const exports = [];
    for (const match of sourceText.matchAll(/\bexport (?:async )?function (\w+)/g)) {
      exports.push(match[1]);
    }
    for (const match of sourceText.matchAll(/\bexport const (\w+)/g)) {
      exports.push(match[1]);
    }

    for (const match of sourceText.matchAll(/\bexport class (\w+)/g)) {
      exports.push(match[1]);
    }

    let code = sourceText
      .replace(/\bexport async function /g, 'async function ')
      .replace(/\bexport function /g, 'function ')
      .replace(/\bexport class /g, 'class ')
      .replace(/\bexport const /g, 'const ')
      .replace(
        /import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,
        (_, names, importPath) => {
          const bindings = names.split(',').map((name) => name.trim()).join(', ');
          return `const { ${bindings} } = require('${importPath}');`;
        },
      )
      .replace(
        /import (\w+) from ['"]([^'"]+)['"];?/g,
        (_, name, importPath) => `const ${name} = require('${importPath}');`,
      );

    code += `\nmodule.exports = { ${exports.join(', ')} };`;

    return { code };
  },
};
