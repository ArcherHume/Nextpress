const { loadingAnimation, printRoutes } = require("./utils");
const path = require("path");
const { loadMiddlewares } = require("./middlewares");
const { loadRoutes } = require("./routes");

/**
 * Initialize NextPress and load routes and middlewares
 *
 * @param {any} app - The Express app instance
 * @param {object} [config={}] - Configuration options for NextPress
 * @param {string} [config.directory=""] - The directory where app routes are located
 * @param {boolean} [config.verbose=false] - Display loading and route information in console
 * 
 * @example
 * const express = require('express');
 * const nextpress = require('nextpress');
 * 
 * const app = express();
 * 
 * // Initialize NextPress
 * nextpress.init(app, {directory: __dirname, verbose: true});
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
  const appPath = path.join(config.directory || "", "app");
  let middlewares = [];
  let routes = {};

  // Load the middlewares and routes, and display information if verbose is set
  loadMiddlewares(app, appPath, middlewares)
    .then(() => loadRoutes(app, appPath, middlewares, routes, config.directory))
    .then(() => {
      if (config.verbose) {
        clearInterval(loader);
        // Display information about loaded routes grouped by their route group
        printRoutes(routes);
      } else {
        console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
      }
    })
    .catch((err) => console.error("Failed to load routes", err));
};

module.exports = { init };