const {loadingAnimation, printRoutes, processFilePath} = require("./utils");
const path = require("path");
const hotRequire = require("./hotRequire");
const {loadMiddlewares} = require("./middlewares");
const {loadRoutes} = require("./routes");

/**
 * Class representing the NextPress application handler.
 * This class handles the loading of middlewares, routes and manages hot reloads.
 */
class NextPress {
    /**
     * Create a NextPress instance.
     * @param {Object} app - The Express app instance.
     * @param {Object} [config={}] - Configuration options for NextPress.
     * @param {string} [config.directory=""] - The directory where app routes are located.
     * @param {boolean} [config.verbose=false] - Display loading and route information in console.
     * @param {boolean} [config.hotReload=false] - Enable hot reload feature in development mode.
     */
    constructor(app, config = {}) {
        this.app = app;
        this.config = config;
        this.middlewares = [];
        this.routes = {};
        this.appPath = path.join(this.config.directory || process.cwd(), "app");
    }

    /**
     * Initializes the NextPress instance.
     * Loads middlewares, routes and if configured, sets up hot reloading.
     * @returns {Promise<void>}
     */

    async initialize() {
        if (this.config.verbose) {
            this.loader = loadingAnimation("Loading app routes…");
        }

        await this.loadMiddlewares();
        await this.loadRoutes();

        if (this.config.verbose) {
            clearInterval(this.loader);
            printRoutes(this.routes, this.appPath);
        } else {
            console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
        }

        if (this.config.hotReload) {
            this.handleHotReload();
        }
    }

    async loadMiddlewares() {
        this.middlewares = await loadMiddlewares(this.app, this.appPath);
    }

    async loadRoutes() {
        this.routes = await loadRoutes(this.app, this.appPath, this.middlewares, this.config.directory || process.cwd());
    }

    /**
     * Handles hot reloading of modules.
     * Listens for module update events and performs necessary reloads.
     */
    handleHotReload() {
        hotRequire.on("module:updated", ({filePath, newModule}) => {
            this.app._router.stack.forEach((layer) => {
                if (layer.route) {
                    layer.route.stack.forEach((layerHandler) => {
                        if (layerHandler.handle.__name.path === filePath) {
                            Object.entries(newModule).forEach(([key, func]) => {
                                if (layerHandler.handle.__name.name === key) {
                                    if (layerHandler.handle.toString() !== func.toString()) {
                                        layerHandler.handle = func;
                                        console.log(
                                            `\n\x1b[34mNEXTPRESS HOT RELOAD: ${processFilePath(
                                                filePath,
                                                this.config.directory || process.cwd()
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

/**
 * Initializes the NextPress framework with given configurations.
 * @param {Object} app - The Express app instance.
 * @param {Object} [config={}] - Configuration options for NextPress.
 * @returns {void}
 */
function init(app, config = {}) {
    const nextPressInstance = new NextPress(app, config);
    nextPressInstance.initialize();
}

module.exports = {init};
