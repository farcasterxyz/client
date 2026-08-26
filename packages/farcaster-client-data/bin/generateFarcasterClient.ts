import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import upperFirst from 'lodash/upperFirst';
import { join } from 'path';

type Routes = Record<string, Record<HTTPMethod, Route>>;

type Route = {
  body?: object;
  description: string;
  disable_auth?: boolean;
  handler: string;
  query?: object;
  paginated?: boolean;
  response?: Record<number, object> | 'any';
  tags: string[];
};

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const { routes } = yaml.load(
  readFileSync(join(__dirname, 'types.yml'), { encoding: 'utf8' }),
) as { routes: Routes };

const clientMethods: string[] = [];
const endpointNames: string[] = [];
const importedTypes: string[] = [];
const packageRoot = join(__dirname, '..');
const farcasterApiClientPath = join(
  packageRoot,
  'src',
  'client',
  'FarcasterApiClient.ts',
);
const endpointNamePath = join(packageRoot, 'src', 'types', 'endpointName.ts');
const generatedFilePaths = [farcasterApiClientPath, endpointNamePath];

function hasOnlyOptionalQueryParams(
  query: Route['query'] | undefined,
  paginated: boolean | undefined,
): boolean {
  if (paginated) {
    // Paginated routes inject required `limit` (and optional `cursor`) in generated types.
    return false;
  }
  const queryKeys = Object.keys(query ?? {});
  if (queryKeys.length === 0) {
    return false;
  }
  return queryKeys.every((key) => key.endsWith('?'));
}

function getPathParamNames(path: string): string[] {
  return Array.from(path.matchAll(/:([A-Za-z0-9_]+)/g)).map(([, name]) => name);
}

function buildPathParamsType(pathParamNames: string[]): string {
  return `{ ${pathParamNames.map((name) => `${name}: string`).join('; ')} }`;
}

function buildRequestPath(path: string, pathParamNames: string[]): string {
  if (pathParamNames.length === 0) {
    return `'${path}'`;
  }

  return (
    '`' +
    path.replace(
      /:([A-Za-z0-9_]+)/g,
      (_, name) => `\${encodeURIComponent(params.${name})}`,
    ) +
    '`'
  );
}

function buildQueryParams(pathParamNames: string[], hasQueryParams: boolean) {
  if (!hasQueryParams) {
    return undefined;
  }

  if (pathParamNames.length === 0) {
    return 'params';
  }

  return `Object.fromEntries(Object.entries(params).filter(([key]) => !${JSON.stringify(
    pathParamNames,
  )}.includes(key))) as RequestParams`;
}

for (const path in routes) {
  for (const untypedMethod in routes[path]) {
    const method = untypedMethod as HTTPMethod;
    const { body, description, handler, paginated, query, response } =
      routes[path][method];

    const pathParamNames = getPathParamNames(path);
    const hasPathParams = pathParamNames.length > 0;
    const hasQueryParams = !!(query || paginated);
    const hasParams = hasQueryParams || hasPathParams;
    const hasBody = !!body;
    const isMutation = method !== 'GET';
    const hasParamsOrBody = hasParams || hasBody;
    const shouldDefaultParamsToEmptyObject =
      hasParams && !hasBody && hasOnlyOptionalQueryParams(query, paginated);

    const propsName = hasParams ? 'params' : hasBody ? 'body' : undefined;
    const propsType = hasParamsOrBody
      ? hasParams
        ? [
            hasQueryParams ? `Api${upperFirst(handler)}QueryParams` : '',
            hasPathParams ? buildPathParamsType(pathParamNames) : '',
          ]
            .filter(Boolean)
            .join(' & ')
        : `Api${upperFirst(handler)}RequestBody`
      : undefined;
    const requestPath = buildRequestPath(path, pathParamNames);
    const queryParams = buildQueryParams(pathParamNames, hasQueryParams);
    const requestDataOption = (() => {
      if (propsName === 'params' && queryParams) {
        if (queryParams === 'params') {
          return 'params';
        }

        return `params: ${queryParams}`;
      }

      if (propsName === 'body') {
        return 'body';
      }

      if (isMutation) {
        // If this is a non-GET request, the server-side framework requires
        // that the body is parsable JSON, so we send an empty object.
        return 'body: {}';
      }

      return undefined;
    })();

    const returnType =
      response && response !== 'any'
        ? `Api${upperFirst(handler)}${Object.keys(response).find((code) =>
            code.startsWith('2'),
          )}Response`
        : undefined;

    const clientMethod = (() => {
      if (method === 'GET') {
        return 'authedGet';
      }

      return method.toLowerCase();
    })();

    endpointNames.push(handler);

    if (hasQueryParams) {
      importedTypes.push(`Api${upperFirst(handler)}QueryParams`);
    } else if (hasBody) {
      importedTypes.push(`Api${upperFirst(handler)}RequestBody`);
    }

    if (returnType) {
      importedTypes.push(returnType);
    }

    clientMethods.push(
      `  /**\n${description
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `  * ${line}`)}
  */
  ${handler}(${
    hasParamsOrBody
      ? `${propsName}: ${propsType}${
          shouldDefaultParamsToEmptyObject ? ' = {}' : ''
        }, `
      : ''
  }{ headers, timeout${isMutation ? ', retryLimit' : ''} }: { headers?: RequestHeaders, timeout?: number${isMutation ? ', retryLimit?: number' : ''} } = {}) {
    return this.${clientMethod}<${returnType || 'void'}>(${requestPath}, {
      headers,
      timeout,${isMutation ? '\n      retryLimit,' : ''}
      endpointName: '${handler}',${
        requestDataOption ? `\n      ${requestDataOption},` : ''
      }
    });
  }`,
    );
  }
}

writeFileSync(
  farcasterApiClientPath,
  `import {
${importedTypes
  .sort()
  .map((importType) => `  ${importType}`)
  .join(',\n')},
  RequestHeaders,
  RequestParams,
} from '../types';
import { AbstractFarcasterApiClient } from './AbstractFarcasterApiClient';

export class FarcasterApiClient extends AbstractFarcasterApiClient {
${clientMethods.sort().join('\n\n')}
  }`,
);

writeFileSync(
  endpointNamePath,
  `export type ApiEndpointName =\n${endpointNames
    .sort()
    .map((endpointName) => `  | '${endpointName}'`)
    .join('\n')};\n\n`,
);

// Keep fixers scoped to generated outputs so syncing API types cannot rewrite
// unrelated files in farcaster-client-data.
execFileSync('pnpm', ['exec', 'eslint', '--fix', ...generatedFilePaths], {
  cwd: packageRoot,
  stdio: 'inherit',
});
execFileSync(
  'pnpm',
  [
    'exec',
    'prettier',
    '--write',
    ...generatedFilePaths,
    '--config',
    join(packageRoot, '..', '..', '.prettierrc.js'),
    '--ignore-path',
    join(packageRoot, '..', '..', '.prettierignore'),
  ],
  { cwd: packageRoot, stdio: 'inherit' },
);
