const { loadingAnimation } = require("./utils");
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
 */
exports.init = (app, config = {}) => {
  let loader;
  if (config.verbose) {
    loader = loadingAnimation("Loading app routes…");
  }
  const appPath = path.join(config.directory || "", "app");
  let middlewares = [];
  let routes = {};
  loadMiddlewares(app, appPath, middlewares)
    .then(() => loadRoutes(app, appPath, middlewares, routes))
    .then(() => {
      if (config.verbose) {
        clearInterval(loader);
        console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
        for (const group in routes) {
          console.log(
            `\n\x1b[34m===\x1b[37m ${group.toUpperCase()} \x1b[34m===`
          );
          for (const route of routes[group]) {
            console.log(
              `\x1b[34m  ${route.method.toUpperCase()} \x1b[37m${route.route}`
            );
          }
        }
      } else {
        console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
      }
    })
    .catch((err) => console.error("Failed to load routes", err));
};
