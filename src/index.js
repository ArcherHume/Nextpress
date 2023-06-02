const fs = require("fs");
const path = require("path");
const { loadingAnimation } = require("./logger");

let routes = {};
let middlewares = [];

const loadMiddlewares = async (app, dir) => {
  // Read the directory, find all files
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    // If it's a directory, we'll load the routes from it
    if (isDirectory) {
      await loadMiddlewares(app, filePath);
    } else if (file === "middlewares.js") {
      middlewares.push(filePath);
    }
  }
};

const getRouteMiddleware = (middlewares, routePath) => {
  const routeParts = routePath.split("/app")[1].split("/");

  let applicableMiddleware = null;
  let maxCommonDepth = 0;

  for (const middleware of middlewares) {
    const middlewareParts = middleware.split("/app")[1].split("/");
    let commonDepth = 0;

    // Count the common parent path depth
    while (
      commonDepth < middlewareParts.length - 1 &&
      commonDepth < routeParts.length - 1 &&
      middlewareParts[commonDepth] === routeParts[commonDepth]
    ) {
      commonDepth++;
    }

    // Check if the middleware file is a 'middlewares.js' in a common parent or sibling directory
    if (
      middlewareParts[commonDepth] === "middlewares.js" &&
      commonDepth >= maxCommonDepth
    ) {
      maxCommonDepth = commonDepth;
      applicableMiddleware = middleware;
    }
  }

  return applicableMiddleware;
};

const loadRoutes = async (app, dir, group = "root") => {
  // Read the directory, find all files
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    // If it's a directory, we'll load the routes from it
    if (isDirectory) {
      if (group !== "root") {
        let newGroup = group;
        if (/^\(.*\)$/.test(file)) {
          newGroup = file.replace(/^\(|\)$/g, "");
        }
        await loadRoutes(app, filePath, newGroup);
      } else {
        let newGroup = group;
        if (/^\(.*\)$/.test(file)) {
          newGroup = file.replace(/^\(|\)$/g, "");
        }
        await loadRoutes(app, filePath, newGroup);
      }
    } else {
      // We only import files that have proper HTTP methods as their filenames
      const [method] = file.split(".");
      const allowedMethods = ["get", "post", "put", "delete"];
      if (allowedMethods.includes(method.toLowerCase())) {
        // Deduce the route from the folder structure
        const route =
          filePath
            .split("/app")[1]
            .replace(/\\/g, "/")
            .replaceAll(/\([^)]*\)\//g, "")
            .replace(/\[([^\]]*)\]/g, ":$1")
            .replace(file, "")
            .replace(/\/$/, "") || "/";
        const routeHandler = require(path.resolve(filePath));
        // Attach the route handler
        try {
          const middleware = getRouteMiddleware(middlewares, filePath);
          if (middleware) {
            app[method](route, ...require(middleware), routeHandler);
          } else {
            app[method](route, routeHandler);
          }
          if (!routes[group]) {
            routes[group] = [];
          }
          routes[group].push({ method, route, middleware });
        } catch (err) {
          console.error(
            `Failed to load route ${method.toUpperCase()} ${route}`,
            err
          );
        }
      }
    }
  }
};

exports.init = (app, config = {}) => {
  let loader;
  if (config.verbose) {
    loader = loadingAnimation("Loading app routes…");
  }
  const appPath = path.join(config.directory, "app");
  loadMiddlewares(app, appPath);
  loadRoutes(app, appPath)
    .then(() => {
      if (config.verbose) {
        setTimeout(() => {
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
        }, 1000);
      } else {

          console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
      }
    })
    .catch((err) => console.error("Failed to load routes", err));
};
