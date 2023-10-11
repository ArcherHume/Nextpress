/**
 * This module provides utility functions for the NextPress application.
 */
import { RouteGroup } from './routes';

/**
 * Find the most suitable middleware for a given route.
 */
export function getRouteMiddleware(middlewares: string[], routePath: string, root: string): string | null {
  const routeParts = routePath.slice(root.length).split('/app/')[1].split('/');
  let applicableMiddleware = null;
  let maxCommonDepth = 0;

  for (const middleware of middlewares) {
    const middlewareParts = middleware.slice(root.length).split('/app/')[1].split('/');
    let commonDepth = 0;

    while (
      commonDepth < middlewareParts.length - 1 &&
      commonDepth < routeParts.length - 1 &&
      middlewareParts[commonDepth] === routeParts[commonDepth]
    ) {
      commonDepth++;
    }

    if (middlewareParts[commonDepth] === 'middlewares.ts' && commonDepth >= maxCommonDepth) {
      maxCommonDepth = commonDepth;
      applicableMiddleware = middleware;
    }
  }

  return applicableMiddleware;
}

/**
 * Convert a file path to a route path.
 */
export function processFilePath(filePath: string, root: string): string {
  return (
    filePath
      .split(root + '/app')[1]
      .replace(/\\/g, '/')
      .replaceAll(/\([^)]*\)\//g, '')
      .replace(/\[([^\]]*)]/g, ':$1')
      .replace(filePath.split('/').pop()!, '')
      .replace(/\/$/, '') || '/'
  );
}

/**
 * Display a loading animation on the console.
 */
export function loadingAnimation(
  text = '',
  chars = ['⠙', '⠘', '⠰', '⠴', '⠤', '⠦', '⠆', '⠃', '⠋', '⠉'],
  delay = 100,
): NodeJS.Timeout {
  let x = 0;
  return setInterval(() => {
    process.stdout.write('\x1b[32m\r' + chars[x++] + ' ' + text);
    x %= chars.length;
  }, delay);
}

type TreeData = {
  [key: string]: TreeData | null;
};

/**
 * Print grouped route details to the console.
 */
export function printRoutes(routes: RouteGroup, root = '', logger: (message: string) => void): void {
  logger('\n\x1b[34m📦 NEXTPRESS ROUTES\n\x1b[0m');

  const TREE_VERTICAL = '│';
  const TREE_CROSS = '├';
  const TREE_CORNER = '└';

  const treeData: TreeData = {};

  for (const group in routes) {
    if (!Object.prototype.hasOwnProperty.call(routes, group)) {
      continue;
    }
    for (const route of routes[group]) {
      const routeSegments = route.route.split('/').filter((segment) => segment.length > 0);
      const methodString = `${
        group !== 'root' ? '\x1b[32m[' + group + ']' : ''
      } \x1b[36m${route.method.toUpperCase()}\x1b[0m ${route.route}${
        route.middleware ? ` \x1b[33m(Middleware: ${route.middleware.split(root)[1]})\x1b[0m` : ''
      }`;

      let currentTreeLevel: TreeData | null = treeData;
      for (const segment of routeSegments) {
        if (!currentTreeLevel![segment]) {
          currentTreeLevel![segment] = {};
        }
        currentTreeLevel = currentTreeLevel![segment];
      }
      currentTreeLevel![methodString] = null;
    }
  }

  const printTree = (printableTree: TreeData, printSeparator = '') => {
    for (const key in printableTree) {
      if (!Object.prototype.hasOwnProperty.call(printableTree, key)) {
        continue;
      }
      const isLastKey = Object.keys(printableTree).indexOf(key) === Object.keys(printableTree).length - 1;
      const treeBranch = isLastKey ? TREE_CORNER : TREE_CROSS;
      const treeContinuation = isLastKey ? ' ' : TREE_VERTICAL;

      logger(`${printSeparator}${treeBranch}${key}`);
      if (printableTree[key] !== null) {
        printTree(printableTree[key]!, printSeparator + treeContinuation + ' ');
      }
    }
  };

  printTree(treeData);
}
