const fs = require("fs");
const path = require("path");
const { getRouteMiddleware, processFilePath } = require("./utils");

/**
 * Load routes from a specified directory
 *
 * @param {any} app - The Express app instance
 * @param {string} dir - The directory to load routes from
 * @param {string[]} middlewares - The array of loaded middlewares
 * @param {object} routes - An object to store the loaded routes
 * @param {string} [group="root"] - The current route group
 */
async function loadRoutes(app, dir, middlewares, routes, group = "root") {
  const files = fs.readdirSync(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      if (isDirectory) {
        let newGroup = group;
        if (/^\(.*\)$/.test(file)) {
          newGroup = file.replace(/^\(|\)$/g, "");
        }
        await loadRoutes(app, filePath, middlewares, routes, newGroup);
      } else {
        const [method] = file.split(".");
        const allowedMethods = ["get", "post", "put", "delete"];
        if (allowedMethods.includes(method.toLowerCase())) {
          const route = processFilePath(filePath, file);
          const routeHandler = require(path.resolve(filePath));
          try {
            const middleware = getRouteMiddleware(middlewares, filePath);
            if (middleware) {
              app[method.toLowerCase()](
                route,
                ...require(middleware),
                routeHandler
              );
            } else {
              app[method.toLowerCase()](route, routeHandler);
            }
            if (!routes[group]) {
              routes[group] = [];
            }
            routes[group].push({ method, route, middleware });
          } catch (err) {
            throw new Error(
              `Failed to load route ${method.toUpperCase()} ${route}`,
              err
            );
          }
        }
      }
    })
  );
}

module.exports = { loadRoutes };
