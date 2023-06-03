module.exports = [
  (req, res) => {
    const { category, postId } = req.params;
    res.send(`Getting post with ID ${postId} from category ${category}`);
  },
];
