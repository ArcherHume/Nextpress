/**
 * Get the applicable middleware for a route
 *
 * @param {string[]} middlewares - The array of middleware paths
 * @param {string} routePath - The path of the route
 * @returns {string} The path of the applicable middleware or null if not found
 */
function getRouteMiddleware(middlewares, routePath) {
  const routeParts = routePath.split("/app")[1].split("/");

  let applicableMiddleware = null;
  let maxCommonDepth = 0;

  // Iterate through the middlewares and find the most suitable one for the given route path
  for (const middleware of middlewares) {
    const middlewareParts = middleware.split("/app")[1].split("/");
    let commonDepth = 0;

    // Compare the directory parts to find the deepest common directory
    while (
      commonDepth < middlewareParts.length - 1 &&
      commonDepth < routeParts.length - 1 &&
      middlewareParts[commonDepth] === routeParts[commonDepth]
    ) {
      commonDepth++;
    }

    // Check if the current middleware is the most suitable one
    const isMiddlewareFile = middlewareParts[commonDepth] === "middlewares.js";
    if (isMiddlewareFile && commonDepth >= maxCommonDepth) {
      maxCommonDepth = commonDepth;
      applicableMiddleware = middleware;
    }
  }

  return applicableMiddleware;
}

/**
 * Process the file path and convert it to a route path
 *
 * @param {string} filePath - The file path to process
 * @param {string} file - The filename to remove from the path
 * @returns {string} The converted route path
 */
function processFilePath(filePath, file, root) {
  return (
    filePath
      .split(root + "/app")[1]
      .replace(/\\/g, "/")
      .replaceAll(/\([^)]*\)\//g, "")
      .replace(/\[([^\]]*)\]/g, ":$1")
      .replace(file, "")
      .replace(/\/$/, "") || "/"
  );
}

// Adapted from https://stackoverflow.com/questions/34848505/how-to-make-a-loading-animation-in-console-application-written-in-javascript-or
// https://gist.github.com/umcconnell/f5af0e6be7e1bf3466fba08cd265a9c0
/**
 * Create and display a loader in the console.
 *
 * @param {string} [text=""] - Text to display after loader
 * @param {string[]} [chars=["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"]] - Array of characters representing loader steps
 * @param {number} [delay=100] - Delay in ms between loader steps
 * @returns {number} An interval that can be cleared to stop the animation
 * @example
 * let loader = loadingAnimation("Loading…");
 *
 * // Stop loader after 1 second
 * setTimeout(() => clearInterval(loader), 1000);
 */
function loadingAnimation(
  text = "",
  chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
  delay = 100
) {
  let x = 0;

  return setInterval(function () {
    process.stdout.write("\x1b[32m\r" + chars[x++] + " " + text);
    x = x % chars.length;
  }, delay);
}

/**
 *
 * @typedef {Object.<string, {method: string, route: string, middleware: string}>} Routes
 * @property {string} method - The HTTP method of the route
 * @property {string} route - The route path
 * @property {string} middleware - The path of the applicable middleware
 *
 * @param {Routes} routes - The routes object to print
 * @example
 * printRoutes({
 *  "pages": [
 *    {
 *     "method": "GET",
 *     "route": "/",
 *    "middleware": "/app/pages/index.js"
 *    },
 *   ]
 *  });
 *
 */
function printRoutes(routes) {
  console.log("\n\x1b[34m📦 NEXTPRESS ROUTES\n\x1b[0m");

  // ASCII tree components
  const TREE_VERTICAL = "│";
  const TREE_CROSS = "├";
  const TREE_CORNER = "└";

  let treeData = {};

  for (const group in routes) {
    for (const route of routes[group]) {
      const routeSegments = route.route
        .split("/")
        .filter((segment) => segment.length > 0);
      const methodString = `${
        group !== "root" ? "\x1b[32m[" + group + "]" : ""
      } \x1b[36m${route.method.toUpperCase()}\x1b[0m ${route.route}${
        route.middleware
          ? ` \x1b[33m(Middleware: ${route.middleware.split("/app")[1]})\x1b[0m`
          : ""
      }`;

      let currentTreeLevel = treeData;

      for (const segment of routeSegments) {
        if (!currentTreeLevel[segment]) {
          currentTreeLevel[segment] = {};
        }

        currentTreeLevel = currentTreeLevel[segment];
      }

      currentTreeLevel[methodString] = null;
    }
  }

  function printTree(treeData, printSeparator) {
    for (const key in treeData) {
      const isLastKey =
        Object.keys(treeData).indexOf(key) === Object.keys(treeData).length - 1;
      const treeBranch = isLastKey ? TREE_CORNER : TREE_CROSS;
      const treeContinuation = isLastKey ? " " : TREE_VERTICAL;
      const nextSeparator = printSeparator + treeContinuation + " ";

      console.log(`${printSeparator}${treeBranch}${key}`);

      if (treeData[key] !== null) {
        printTree(treeData[key], nextSeparator);
      }
    }
  }

  printTree(treeData, "");
}

module.exports = { getRouteMiddleware, processFilePath, loadingAnimation, printRoutes };
