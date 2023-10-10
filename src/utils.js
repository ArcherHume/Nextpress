/**
 * This module provides utility functions for the NextPress application.
 * @module utils
 */

/**
 * Find the most suitable middleware for a given route.
 *
 * We want to associate routes with the closest middleware in the directory tree.
 * This means a route can inherit behavior from its directory or a parent directory,
 * allowing for logical grouping and middleware reusability.
 *
 * @param {string[]} middlewares - List of available middleware file paths.
 * @param {string} routePath - Absolute file path of the route.
 * @param {string} root - Absolute path to the root directory of the application.
 * @returns {string|null} The path of the best fitting middleware or null if none is found.
 */
function getRouteMiddleware(middlewares, routePath, root) {
  // Extract route segments for detailed comparison
  const routeParts = routePath.slice(root.length).split("/app/")[1].split("/");
  let applicableMiddleware = null;
  let maxCommonDepth = 0;

  // Evaluate each middleware's appropriateness for the route
  for (const middleware of middlewares) {
    const middlewareParts = middleware.slice(root.length).split("/app/")[1].split("/");
    let commonDepth = 0;

    // Determine the deepest common directory between the middleware and the route
    while (
        commonDepth < middlewareParts.length - 1 &&
        commonDepth < routeParts.length - 1 &&
        middlewareParts[commonDepth] === routeParts[commonDepth]
        ) {
      commonDepth++;
    }

    // Prioritize middlewares designated for the route's directory or a parent directory
    if (middlewareParts[commonDepth] === "middlewares.js" && commonDepth >= maxCommonDepth) {
      maxCommonDepth = commonDepth;
      applicableMiddleware = middleware;
    }
  }

  return applicableMiddleware;
}

/**
 * Convert a file path to a route path.
 *
 * The file system layout reflects the URL structure.
 * The utility transforms file paths into URLs, making route registration straightforward.
 *
 * @param {string} filePath - Absolute file path.
 * @param {string} root - Absolute path to the root directory of the application.
 * @returns {string} The corresponding route path.
 */
function processFilePath(filePath, root) {
  return (
      filePath
          .split(root + "/app")[1]
          .replace(/\\/g, "/")               // Normalize path separators
          .replaceAll(/\([^)]*\)\//g, "")    // Remove group annotations (directories in brackets)
          .replace(/\[([^\]]*)]/g, ":$1")    // Convert parametrized segments
          .replace(filePath.split("/").pop(), "") // Remove the filename
          .replace(/\/$/, "")                // Trim trailing slashes
      || "/"
  );
}

/**
 * Display a loading animation on the console.
 *
 * A visual cue helps indicate the system's state, assuring the user that processes are ongoing.
 *
 * @param {string} [text=""] - Optional text to display after the spinner.
 * @param {string[]} [chars=["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"]] - Characters representing loader steps.
 * @param {number} [delay=100] - Time delay in milliseconds between loader steps.
 * @returns {number} An interval ID that can be used to clear the animation.
 */
function loadingAnimation(
    text = "",
    chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
    delay = 100
) {
  let x = 0;
  return setInterval(function () {
    process.stdout.write("\x1b[32m\r" + chars[x++] + " " + text);
    x %= chars.length;
  }, delay);
}

/**
 * Print grouped route details to the console.
 *
 * Visualizing the structure and hierarchy of routes aids debugging and provides a clear system overview.
 *
 * @param {Object} routes - An object containing grouped route details.
 * @param {string} [root=""] - Absolute path to the root directory of the application.
 */
function printRoutes(routes, root = "") {
  console.log("\n\x1b[34m📦 NEXTPRESS ROUTES\n\x1b[0m");

  const TREE_VERTICAL = "│";
  const TREE_CROSS = "├";
  const TREE_CORNER = "└";

  let treeData = {};

  for (const group in routes) {
    for (const route of routes[group]) {
      const routeSegments = route.route.split("/").filter(segment => segment.length > 0);
      const methodString = `${group !== "root" ? "\x1b[32m[" + group + "]" : ""} \x1b[36m${route.method.toUpperCase()}\x1b[0m ${route.route}${route.middleware ? ` \x1b[33m(Middleware: ${route.middleware.split(root)[1]})\x1b[0m` : ""}`;

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

  function printTree(treeData, printSeparator = "") {
    for (const key in treeData) {
      const isLastKey = Object.keys(treeData).indexOf(key) === Object.keys(treeData).length - 1;
      const treeBranch = isLastKey ? TREE_CORNER : TREE_CROSS;
      const treeContinuation = isLastKey ? " " : TREE_VERTICAL;

      console.log(`${printSeparator}${treeBranch}${key}`);
      if (treeData[key] !== null) {
        printTree(treeData[key], printSeparator + treeContinuation + " ");
      }
    }
  }

  printTree(treeData);
}

module.exports = {
  getRouteMiddleware,
  processFilePath,
  loadingAnimation,
  printRoutes
};
