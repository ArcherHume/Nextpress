const fs = require("fs");
const path = require("path");

const loadMiddlewares = async (app, dir, middlewares) => {
  const files = fs.readdirSync(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      if (isDirectory) {
        await loadMiddlewares(app, filePath, middlewares);
      } else if (file === "middlewares.js") {
        middlewares.push(filePath);
      }
    })
  );
};

module.exports = { loadMiddlewares };
