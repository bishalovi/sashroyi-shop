const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

// 1. Get All Reviews (Public & Admin)
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

// 2. Create New Review (Admin)
exports.createReview = async (req, res) => {
  try {
    const db = await connectDB();
    const reviewsCollection = db.collection("reviews");
    const { name, image, rating, comment, isApproved } = req.body;

    if (!image || !image.trim()) {
      return res.status(400).json({
        success: false,
        message: "রিভিউয়ের ইমেজ/ছবি লিংক দেওয়া আবশ্যক",
      });
    }

    const newReview = {
      name: name?.trim() || "সন্তুষ্ট গ্রাহক",
      image: image.trim(),
      rating: Number(rating) || 5,
      comment: comment?.trim() || "",
      isApproved: typeof isApproved === "boolean" ? isApproved : true,
      createdAt: new Date(),
    };

    const result = await reviewsCollection.insertOne(newReview);

    res.status(201).json({
      success: true,
      message: "রিভিউ সফলভাবে যোগ করা হয়েছে",
      data: { ...newReview, _id: result.insertedId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "রিভিউ তৈরি করতে সমস্যা হয়েছে",
      error: error.message,
    });
  }
};

// 3. Update Review (Admin)
exports.updateReview = async (req, res) => {
  try {
    const db = await connectDB();
    const reviewsCollection = db.collection("reviews");
    const { id } = req.params;
    const { name, image, rating, comment, isApproved } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Review ID" });
    }

    const updateDoc = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateDoc.name = name.trim();
    if (image !== undefined) updateDoc.image = image.trim();
    if (rating !== undefined) updateDoc.rating = Number(rating);
    if (comment !== undefined) updateDoc.comment = comment.trim();
    if (isApproved !== undefined) updateDoc.isApproved = Boolean(isApproved);

    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "রিভিউ পাওয়া যায়নি" });
    }

    res.json({
      success: true,
      message: "রিভিউ সফলভাবে আপডেট করা হয়েছে",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "রিভিউ আপডেট করতে সমস্যা হয়েছে",
      error: error.message,
    });
  }
};

// 4. Delete Review (Admin)
exports.deleteReview = async (req, res) => {
  try {
    const db = await connectDB();
    const reviewsCollection = db.collection("reviews");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Review ID" });
    }

    const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "রিভিউ পাওয়া যায়নি" });
    }

    res.json({
      success: true,
      message: "রিভিউ সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "রিভিউ মুছে ফেলতে সমস্যা হয়েছে",
      error: error.message,
    });
  }
};