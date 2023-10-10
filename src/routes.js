const fs = require("fs");
const path = require("path");
const { getRouteMiddleware, processFilePath } = require("./utils");
const hotRequire = require("./hotRequire");

/**
 * The RoutesLoader class is responsible for loading route handlers
 * from the given directory and registering them with the Express app.
 */
class RoutesLoader {
    /**
     * Create a RoutesLoader.
     * @param {Object} app - The Express app instance.
     * @param {string} dir - Directory from which routes should be loaded.
     * @param {Array} middlewares - Array of loaded middlewares.
     * @param {string} root - The root directory of the app.
     */
    constructor(app, dir, middlewares, root) {
        this.app = app;
        this.dir = dir;
        this.middlewares = middlewares;
        this.root = root;
        this.routes = {};
    }

    /**
     * Load routes from the directory.
     * @returns {Object} Returns an object containing loaded routes.
     */
    async load() {
        const dirsToProcess = [this.dir];
        const ALLOWED_METHODS = ["get", "post", "put", "delete"];

        // This loop allows for recursive scanning of directories for route files.
        // By using a loop rather than recursion, we avoid potential call stack limits.
        while (dirsToProcess.length) {
            const currentDir = dirsToProcess.pop();
            const files = fs.readdirSync(currentDir);

            // Determine the current route group, groups are represented by directory names enclosed in brackets.
            // This allows for organizing related routes together in the same directory.
            const dirName = path.basename(currentDir);
            const currentGroup = /^\(.*\)$/.test(dirName) ? dirName.replace(/^\(|\)$/g, "") : "root";

            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const isDirectory = fs.statSync(filePath).isDirectory();

                // Directories are added to the list for further processing, ensuring all levels are scanned.
                if (isDirectory) {
                    dirsToProcess.push(filePath);
                    continue;
                }

                // Before processing a file, check if it matches one of the allowed HTTP methods.
                // This prevents non-route files (e.g., utilities or READMEs) from being processed as routes.
                const [method] = file.split(".");
                if (ALLOWED_METHODS.includes(method.toLowerCase())) {
                    const routePath = processFilePath(filePath, this.root);
                    const routeHandler = hotRequire.require(filePath);

                    // Middlewares can be associated with routes based on their path.
                    // This utility helps to load any such middleware for the current route.
                    const middlewarePath = getRouteMiddleware(this.middlewares, filePath, this.root);

                    // Attach middleware(s) if they exist, followed by the route handler.
                    // By dynamically spreading handlers, we avoid conditionals and keep the code DRY.
                    const handlers = middlewarePath ? [...hotRequire.require(middlewarePath), routeHandler] : [routeHandler];
                    this.app[method.toLowerCase()](routePath, ...handlers);

                    this.routes[currentGroup] = this.routes[currentGroup] || [];
                    this.routes[currentGroup].push({ method, route: routePath, middleware: middlewarePath });
                }
            }
        }

        return this.routes;
    }
}

/**
 * Load routes from a specified directory.
 *
 * @param {Object} app - The Express app instance.
 * @param {string} dir - Directory from which routes should be loaded.
 * @param {Array} middlewares - Array of loaded middlewares.
 * @param {string} root - The root directory of the app.
 * @returns {Object} Returns an object containing loaded routes.
 */
function loadRoutes(app, dir, middlewares, root) {
    const loader = new RoutesLoader(app, dir, middlewares, root);
    return loader.load();
}

module.exports = { loadRoutes };
