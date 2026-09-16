const pathLib = require('path');

module.exports = function modifyAnimationAndTimeoutCallbacks({ types: t }) {
  function buildConsoleLog(filename, line, functionName, isWorklet = false) {
    const logMessage = functionName
      ? `${functionName}${isWorklet ? ' (worklet)' : ' callback'} - file: ${filename}, line: ${line}`
      : `${isWorklet ? '(worklet)' : 'callback'} - file: ${filename}, line: ${line}`;

    return t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('console'), t.identifier('log')),
        [
          t.stringLiteral(logMessage),
          t.stringLiteral('elapsed:'),
          t.binaryExpression(
            '-',
            t.callExpression(t.identifier('Date.now'), []),
            t.identifier('__BUNDLER_START__'),
          ),
          t.stringLiteral('ms'),
        ],
      ),
    );
  }

  function ensureCallbackArg(args, argIndex, consoleLog) {
    while (args.length <= argIndex) {
      args.push(t.identifier('undefined'));
    }

    const existing = args[argIndex];
    if (!existing) {
      args[argIndex] = t.arrowFunctionExpression(
        [],
        t.blockStatement([consoleLog]),
      );
    } else if (
      t.isFunction(existing) ||
      t.isArrowFunctionExpression(existing)
    ) {
      if (t.isBlockStatement(existing.body)) {
        args[argIndex] = t.arrowFunctionExpression(
          existing.params,
          t.blockStatement([consoleLog, ...existing.body.body]),
          existing.async,
        );
      } else {
        args[argIndex] = t.arrowFunctionExpression(
          existing.params,
          t.blockStatement([consoleLog, t.returnStatement(existing.body)]),
          existing.async,
        );
      }
    } else {
      args[argIndex] = t.arrowFunctionExpression(
        [],
        t.blockStatement([consoleLog]),
      );
    }
  }

  return {
    name: 'modify-animation-and-timeout-callbacks',
    visitor: {
      Program(path) {
        // Always inject for each file
        path.node.body.unshift(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('__BUNDLER_START__'),
              t.callExpression(t.identifier('Date.now'), []),
            ),
          ]),
        );
      },

      // NEW: Worklet logging
      Function(path, state) {
        const body = path.get('body');
        if (!body.isBlockStatement()) {
          return;
        }

        const statements = body.get('body');
        if (!statements.length) {
          return;
        }

        const firstStmt = statements[0];
        if (
          firstStmt.isExpressionStatement() &&
          t.isStringLiteral(firstStmt.node.expression, { value: 'worklet' })
        ) {
          const filename = pathLib.relative(
            process.cwd(),
            state.file.opts.filename || 'unknown-file',
          );
          if (filename.includes('node_modules')) {
            return;
          }

          const line = firstStmt.node.loc
            ? firstStmt.node.loc.start.line
            : 'unknown-line';
          const functionName =
            path.node.id?.name ||
            path.parent?.id?.name ||
            (path.parentPath.isVariableDeclarator()
              ? path.parentPath.node.id.name
              : null);

          firstStmt.insertAfter(
            buildConsoleLog(filename, line, functionName, true),
          );
        }
      },

      CallExpression(path, state) {
        const callee = path.get('callee');
        const filename = pathLib.relative(
          process.cwd(),
          state.file.opts.filename || 'unknown-file',
        );

        if (filename.includes('node_modules')) {
          return;
        }

        const line = path.node.loc ? path.node.loc.start.line : 'unknown-line';

        let functionName = null;
        if (t.isIdentifier(callee.node)) {
          functionName = callee.node.name;
        } else if (
          t.isMemberExpression(callee.node) &&
          t.isIdentifier(callee.node.property)
        ) {
          functionName = callee.node.property.name;
        }

        const consoleLog = buildConsoleLog(filename, line, functionName);

        if (t.isIdentifier(callee.node, { name: 'withTiming' })) {
          if (path.node.arguments.length === 1) {
            path.node.arguments.push(t.identifier('undefined'));
          }
          ensureCallbackArg(path.node.arguments, 2, consoleLog);
        }

        if (t.isIdentifier(callee.node, { name: 'withRepeat' })) {
          ensureCallbackArg(path.node.arguments, 3, consoleLog);
        }

        if (t.isIdentifier(callee.node, { name: 'useAnimatedReaction' })) {
          ensureCallbackArg(path.node.arguments, 1, consoleLog);
        }

        if (t.isIdentifier(callee.node, { name: 'setTimeout' })) {
          const firstArg = path.node.arguments[0];
          const isAnonFunc =
            !firstArg ||
            t.isFunctionExpression(firstArg) ||
            t.isArrowFunctionExpression(firstArg);

          if (isAnonFunc) {
            ensureCallbackArg(path.node.arguments, 0, consoleLog);
          }
        }

        if (callee.isIdentifier({ name: 'useEffect' })) {
          const argPath = path.get('arguments')[0];
          if (!argPath.node) {
            argPath.replaceWith(
              t.arrowFunctionExpression([], t.blockStatement([consoleLog])),
            );
          } else if (
            argPath.isFunction() ||
            argPath.isArrowFunctionExpression()
          ) {
            ensureCallbackArg(path.node.arguments, 0, consoleLog);
          }
        }

        if (callee.isIdentifier({ name: 'useFocusEffect' })) {
          const useFocusEffectArgPath = path.get('arguments')[0];

          if (useFocusEffectArgPath && useFocusEffectArgPath.node) {
            if (
              useFocusEffectArgPath.isCallExpression() &&
              useFocusEffectArgPath
                .get('callee')
                .isIdentifier({ name: 'useCallback' })
            ) {
              ensureCallbackArg(
                useFocusEffectArgPath.node.arguments,
                0,
                consoleLog,
              );
            } else if (
              useFocusEffectArgPath.isFunction() ||
              useFocusEffectArgPath.isArrowFunctionExpression()
            ) {
              ensureCallbackArg(path.node.arguments, 0, consoleLog);
            }
          }
        }
      },
    },
  };
};
