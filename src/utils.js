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

  for (const middleware of middlewares) {
    const middlewareParts = middleware.split("/app")[1].split("/");
    let commonDepth = 0;

    while (
      commonDepth < middlewareParts.length - 1 &&
      commonDepth < routeParts.length - 1 &&
      middlewareParts[commonDepth] === routeParts[commonDepth]
    ) {
      commonDepth++;
    }

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
function processFilePath(filePath, file) {
  return (
    filePath
      .split("/app")[1]
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

module.exports = { getRouteMiddleware, processFilePath, loadingAnimation };
