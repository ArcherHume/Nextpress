module.exports = [
    (req, res, next) => {
        console.log('userList middleware, applies to all routes in this directory or children directories.');
        next();
    }
]