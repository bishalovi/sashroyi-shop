const connectDB = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerUser = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");

    const { userName, phone, email, password, confirmPassword } = req.body;

    if (!userName || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters and include uppercase and lowercase letters",
      });
    }

    const totalUsers = await usersCollection.countDocuments();
    const assignedRole = req.body.role || (totalUsers === 0 ? "barakahAdmin1234" : "barakahAdmin1234");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      userName: userName.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const { email } = req.body;
    const filter = email ? { email: email.trim().toLowerCase() } : {};
    const result = await usersCollection.updateMany(filter, {
      $set: { role: "barakahAdmin1234" },
    });
    res.json({
      success: true,
      message: "User(s) promoted to admin successfully",
      modifiedCount: result.modifiedCount,
    });
exports.forceSetAdmin = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const { email, password, userName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const userDoc = {
      userName: (userName || "Admin").trim(),
      phone: (phone || "01910037935").trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "barakahAdmin1234",
      updatedAt: new Date()
    };

    await usersCollection.updateOne(
      { email: normalizedEmail },
      { $set: userDoc },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Admin user for ${normalizedEmail} successfully created/updated!`,
      email: normalizedEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

