const getRoot = (req, res) => {
  res.send("Barakah server running successfully");
};

const getTest = (req, res) => {
  res.json({
    success: true,
    message: "Backend working",
  });
};

module.exports = {
  getRoot,
  getTest,
};