module.exports = [
  (req, res) => {
    const { category } = req.params;
    res.send(`Creating post in category ${category}`);
  },
];
