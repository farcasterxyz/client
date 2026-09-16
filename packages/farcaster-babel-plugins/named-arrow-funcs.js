// This plugin replaces anonymous arrow functions with named functions for better stack traces.
// The named functions have the format: anonymous_<file>_<line>
// It will avoid doing this on arrow functions that use lexical bindings (this, super, arguments, etc.)

module.exports = function ({ types: t }) {
  function usesLexicalThings(path) {
    let bad = false;
    path.traverse({
      ThisExpression() { bad = true; },
      Super() { bad = true; },
      Identifier(p) {
        if (p.node.name === 'arguments' && !p.scope.hasBinding('arguments')) bad = true;
      },
      MetaProperty(p) {
        if (p.node.meta.name === 'new' && p.node.property.name === 'target') bad = true;
      },
    });
    return bad;
  }

  function makeBaseName(state, node) {
    const file = (state.file.opts.filename || 'file').split(/[\\/]/).pop();
    const safeFile = file.replace(/\W+/g, '_').replace(/^(\d)/, '_$1');
    const loc = node.loc
      ? `${node.loc.start.line}_${node.loc.start.column}`
      : 'inline';
    return `anonymous_${safeFile}_${loc}`;
  }

  return {
    name: 'named-arrow-funcs',
    visitor: {
      ArrowFunctionExpression(path, state) {
        // Preserve semantics where arrow-specific lexical bindings are used
        if (usesLexicalThings(path)) return;

        const base = makeBaseName(state, path.node);
        // Ensure uniqueness in current scope, but keep a readable prefix
        const id = path.scope.generateUidIdentifier(base);

        const { params, body: origBody, async } = path.node;
        const body = t.isBlockStatement(origBody)
          ? origBody
          : t.blockStatement([t.returnStatement(origBody)]);

        const fn = t.functionExpression(id, params, body);
        fn.async = !!async;

        path.replaceWith(fn);
      },
    },
  };
};
