module.exports = [
  (req, res) => {
    const { id } = req.params;
    res.send(`Updating user with ID ${id}`);
  },
];
