const path = require("path");
const { loadingAnimation, printRoutes, processFilePath } = require("./utils");
const hotRequire = require("./hotRequire");
const { loadMiddlewares } = require("./middlewares");
const { loadRoutes } = require("./routes");

/**
 * Class representing the NextPress application handler.
 * This class handles the loading of middlewares, routes, and manages hot reloads.
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
    constructor(app, { directory = "", verbose = false, hotReload = false } = {}) {
        this.app = app;
        this.config = { directory, verbose, hotReload };
        this.middlewares = [];
        this.routes = {};
        this.appPath = path.join(directory || process.cwd(), "app");
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

        await this._loadMiddlewares();
        await this._loadRoutes();

        if (this.config.verbose) {
            clearInterval(this.loader);
            printRoutes(this.routes, this.appPath);
        } else {
            console.log("\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m");
        }

        if (this.config.hotReload) {
            this._handleHotReload();
        }
    }

    /**
     * Loads the middlewares for the NextPress instance.
     * @returns {Promise<void>}
     * @private
     */
    async _loadMiddlewares() {
        this.middlewares = await loadMiddlewares(this.app, this.appPath);
    }

    /**
     * Loads the routes for the NextPress instance.
     * @returns {Promise<void>}
     * @private
     */
    async _loadRoutes() {
        this.routes = await loadRoutes(this.app, this.appPath, this.middlewares, this.config.directory || process.cwd());
    }

    /**
     * Handles hot reloading of modules.
     * Listens for module update events and performs necessary reloads.
     * @private
     */
    _handleHotReload() {
        hotRequire.on("module:updated", this._updateModule.bind(this));
    }

    /**
     * Updates the modules in response to the hot reload event.
     * @param {Object} payload - Payload containing the details of the updated module.
     * @param {string} payload.filePath - Path of the updated module.
     * @param {Object} payload.newModule - Newly loaded module object.
     * @private
     */
    _updateModule({ filePath, newModule }) {
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
    }
}

/**
 * Initializes the NextPress framework with given configurations.
 * @param {Object} app - The Express app instance.
 * @param {Object} [config={}] - Configuration options for NextPress.
 * @returns {Promise<void>}
 */
async function init(app, config = {}) {
    const nextPressInstance = new NextPress(app, config);
    await nextPressInstance.initialize();
}

module.exports = { init };
