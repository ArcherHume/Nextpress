module.exports = [
  (req, res) => {
    const { id } = req.params;
    res.send(`Getting user with ID ${id}`);
  },
];
