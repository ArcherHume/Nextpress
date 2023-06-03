module.exports = [
    (req, res, next) => {
        console.log('Global middleware, applies to all routes that don\'t have a middleware.js in their directory or a closer parent directory.');
        next();
    },
]
