const fs = require("fs");
const path = require("path");
const {getRouteMiddleware, processFilePath} = require("./utils");
const hotRequire = require("./hotRequire");

/**
 * The RoutesLoader class is responsible for loading route handlers
 * from the given directory and registering them with the Express app.
 */
class RoutesLoader {
    /**
     * Create a RoutesLoader.
     * @param {any} app - The Express app instance.
     * @param {string} dir - Directory from which routes should be loaded.
     * @param {string[]} middlewares - Array of loaded middlewares.
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
     * @returns {Promise<object>} Returns a promise that resolves with loaded routes.
     */
    async load() {
        let dirsToProcess = [this.dir];
        let currentGroup = "root"; // Default group

        while (dirsToProcess.length) {
            const currentDir = dirsToProcess.pop();
            const files = fs.readdirSync(currentDir);

            // Check if the current directory is a group
            const dirName = path.basename(currentDir);
            if (/^\(.*\)$/.test(dirName)) {
                currentGroup = dirName.replace(/^\(|\)$/g, "");
            } else {
                currentGroup = "root";
            }

            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const isDirectory = fs.statSync(filePath).isDirectory();

                if (isDirectory) {
                    dirsToProcess.push(filePath);
                    continue;
                }

                const [method] = file.split(".");
                const allowedMethods = ["get", "post", "put", "delete"];

                if (allowedMethods.includes(method.toLowerCase())) {
                    const routePath = processFilePath(filePath, this.root);
                    const routeHandler = hotRequire.require(filePath);
                    const middlewarePath = getRouteMiddleware(this.middlewares, filePath, this.root);

                    if (middlewarePath) {
                        this.app[method.toLowerCase()](
                            routePath,
                            ...hotRequire.require(middlewarePath),
                            routeHandler
                        );
                    } else {
                        this.app[method.toLowerCase()](routePath, routeHandler);
                    }

                    if (!this.routes[currentGroup]) {
                        this.routes[currentGroup] = [];
                    }
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
 * @param {any} app - The Express app instance.
 * @param {string} dir - Directory from which routes should be loaded.
 * @param {string[]} middlewares - Array of loaded middlewares.
 * @param {string} root - The root directory of the app.
 * @param {string} [group="root"] - The current route group.
 * @returns {Promise<object>} Returns a promise that resolves with loaded routes.
 */
function loadRoutes(app, dir, middlewares, root, group = "root") {
    const loader = new RoutesLoader(app, dir, middlewares, root);
    return loader.load(group);
}

module.exports = {loadRoutes};
