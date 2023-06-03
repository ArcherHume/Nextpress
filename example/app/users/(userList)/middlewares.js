module.exports = [
    (req, res) => {
        console.log('userList middleware, applies to all routes in this directory or children directories.');
        next();
    }
]