const connectDB = require("../config/db");

exports.getAllReviews = async (req, res) => {
  try {
    const db = await connectDB();
    const reviewsCollection = db.collection("reviews");

    const reviews = await reviewsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};