const fs = require('fs');
const path = require('path');

/**
 * This class is responsible for loading middleware files from a given directory.
 * It reads through the directory structure and looks for files named "middlewares.js",
 * and then keeps track of their paths for use in setting up middleware in Express routes.
 */
class MiddlewareLoader {
    /**
     * Creates an instance of MiddlewareLoader.
     *
     * @param {any} app - The Express app instance.
     * @param {string} dir - The directory to load middlewares from.
     */
    constructor(app, dir) {
        /**
         * @type {any}
         * @private
         */
        this.app = app;
        /**
         * @type {string}
         * @private
         */
        this.dir = dir;
        /**
         * @type {string[]}
         * @private
         */
        this.middlewares = [];
    }

    /**
     * Load middlewares from the directory and subdirectories.
     * Iteratively reads through directories looking for "middlewares.js" files.
     *
     * @returns {Promise<string[]>} A promise that resolves to an array of middleware file paths.
     */
    async load() {
        const directories = [this.dir];

        while (directories.length) {
            const currentDir = directories.pop();
            const files = fs.readdirSync(currentDir);

            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const isDirectory = fs.statSync(filePath).isDirectory();

                if (isDirectory) {
                    directories.push(filePath);
                } else if (file === "middlewares.js") {
                    // If a middleware file is found, add its path to the middlewares list.
                    this.middlewares.push(filePath);
                }
            }
        }

        return this.middlewares;
    }
}

/**
 * A convenience function that initializes a MiddlewareLoader and starts the middleware loading process.
 *
 * @param {any} app - The Express app instance.
 * @param {string} dir - The directory to load middlewares from.
 * @returns {Promise<string[]>} A promise that resolves to an array of middleware file paths.
 */
function loadMiddlewares(app, dir) {
    const loader = new MiddlewareLoader(app, dir);
    return loader.load();
}

module.exports = { loadMiddlewares };
