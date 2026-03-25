const fs = require('fs');
const path = require('path');

const deprecatePath = path.join(__dirname, '..', 'node_modules', 'util-deprecate');
const nodeJsPath = path.join(deprecatePath, 'node.js');

const content = [
  "/**",
  " * For Node.js, simply re-export the core `util.deprecate` function.",
  " */",
  "",
  "module.exports = require('util').deprecate;",
  ""
].join('\n');

if (!fs.existsSync(deprecatePath)) return;

const exists = fs.existsSync(nodeJsPath);
const current = exists ? fs.readFileSync(nodeJsPath, 'utf8') : '';
const needsWrite = !exists || !current.includes("require('util').deprecate");

if (needsWrite) {
  fs.writeFileSync(nodeJsPath, content, 'utf8');
  console.log('min-shop-ui: restored util-deprecate/node.js');
}
