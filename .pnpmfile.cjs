// Patch @objectstack/objectql to use dist files instead of src
function readPackage(pkg, context) {
  if (pkg.name === '@objectstack/objectql') {
    pkg.main = 'dist/index.js';
    pkg.types = 'dist/index.d.ts';
    context.log(`Patched @objectstack/objectql to use dist files`);
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
