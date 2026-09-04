const express = require("express");
const router = express.Router();
const {
  getAllReviews,
} = require("../controllers/review.controller");

router.get("/", getAllReviews);

module.exports = router;