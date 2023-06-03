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
async function loadRoutes(app, dir, middlewares, routes, root, group = "root") {
  // Read all files and directories in the specified directory
  const files = fs.readdirSync(dir);

  // Iterate through the files and load routes using recursion for directories
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        // If it's a directory, recurse and load routes from the sub-directory
        let newGroup = group;
        if (/^\(.*\)$/.test(file)) { // Check if the directory name is a route group (Surrounded by parentheses)
          newGroup = file.replace(/^\(|\)$/g, "");
        }
        await loadRoutes(app, filePath, middlewares, routes, root, newGroup);
      } else {
        const [method] = file.split(".");
        const allowedMethods = ["get", "post", "put", "delete"];

        // Check if the file represents an allowed HTTP method
        if (allowedMethods.includes(method.toLowerCase())) {
          // Convert the file path to a route path
          const route = processFilePath(filePath, file, root);
          const routeHandler = require(path.resolve(filePath));

          try {
            // Get the most suitable middleware for this route and apply it
            const middleware = getRouteMiddleware(middlewares, filePath, root);
            if (middleware) {
              app[method.toLowerCase()](
                route,
                ...require(middleware),
                routeHandler
              );
            } else {
              app[method.toLowerCase()](route, routeHandler);
            }
            // Store the route information in the routes object under its group
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
