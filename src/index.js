const { loadingAnimation, printRoutes, processFilePath } = require("./utils");
const path = require("path");
const { loadMiddlewares } = require("./middlewares");
const { loadRoutes } = require("./routes");
const hotRequire = require("./hotRequire");

/**
 * Initialize NextPress and load routes and middlewares
 *
 * @param {any} app - The Express app instance
 * @param {object} [config={}] - Configuration options for NextPress
 * @param {string} [config.directory=""] - The directory where app routes are located
 * @param {boolean} [config.verbose=false] - Display loading and route information in console
 * @param {boolean} [config.hotReload=false] - Enable hot reload feature in development mode
 *
 * @example
 * const express = require('express');
 * const nextpress = require('nextpress');
 *
 * const app = express();
 *
 * // Initialize NextPress
 * nextpress.init(app, {verbose: true, hotReload: true});
 *
 * // Start the server
 * app.listen(3000, () => {
 *    console.log('Server listening on port 3000');
 * });
 *
 */
function init(app, config = {}) {
  // If verbose is set in the config, display a loading spinner
  let loader;
  if (config.verbose) {
    loader = loadingAnimation("Loading app routes…");
  }
  // Set the app path based on the provided directory (defaults to the current directory)
  const appPath = path.join(config.directory || process.cwd(), "app");
  let middlewares = [];
  let routes = {};

  // Load the middlewares and routes, and display information if verbose is set
  loadMiddlewares(app, appPath, middlewares)
    .then(() =>
      loadRoutes(
        app,
        appPath,
        middlewares,
        routes,
        config.directory || process.cwd()
      )
    )
    .then(() => {
      if (config.verbose) {
        clearInterval(loader);
        // Display information about loaded routes grouped by their route group
        printRoutes(routes, appPath);
      } else {
        console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
      }
    })
    .catch((err) => console.error("Failed to load routes", err));

  if (config.hotReload) {
    hotRequire.on("module:updated", ({ filePath, oldModule, newModule }) => {
      // Traverse the app's routes stack
      app._router.stack.forEach((layer, i, stack) => {
        // Check if the layer is the route
        if (layer.route) {
          // Traverse the layer's stack
          layer.route.stack.forEach((layerHandler) => {
            // Check if the handler belongs to the updated file
            if (layerHandler.handle.__name.path === filePath) {
              // Find and replace the handler with the updated function
              Object.entries(newModule).forEach(([key, func]) => {
                if (layerHandler.handle.__name.name === key) {
                  if (layerHandler.handle.toString() !== func.toString()) {
                    layerHandler.handle = func;
                    console.log(
                      `\n\x1b[34mNEXTPRESS HOT RELOAD: ${processFilePath(
                        filePath,
                        config.directory || process.cwd()
                      )} UPDATED ✨\x1b[0m`
                    );
                  }
                }
              });
            }
          });
        }
      });
    });
  }
}

module.exports = { init };
