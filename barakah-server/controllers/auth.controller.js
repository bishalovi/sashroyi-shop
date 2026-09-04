const connectDB = require("../config/db");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

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
    const assignedRole = req.body.role || (totalUsers === 0 ? "barakahAdmin1234" : "customer");

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
      updatedAt: new Date(),
    };

    await usersCollection.updateOne(
      { email: normalizedEmail },
      { $set: userDoc },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Admin user for ${normalizedEmail} successfully created/updated!`,
      email: normalizedEmail,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/users - Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/staff - Create new admin or moderator
exports.createStaffUser = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const { userName, email, phone, password, role } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await usersCollection.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "এই ইমেইলে ইতিমধ্যে একটি একাউন্ট রয়েছে",
      });
    }

    const assignedRole = role === "barakahAdmin1234" ? "barakahAdmin1234" : "barakahModerator0102";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = {
      userName: userName.trim(),
      email: normalizedEmail,
      phone: (phone || "").trim(),
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newStaff);
    res.status(201).json({
      success: true,
      message: "নতুন স্টাফ মেম্বার সফলভাবে যোগ করা হয়েছে",
      insertedId: result.insertedId,
      user: {
        _id: result.insertedId,
        userName: newStaff.userName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        createdAt: newStaff.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/role - Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "User ID and role are required",
      });
    }

    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { email: String(userId).toLowerCase() };
    }

    const validRoles = ["barakahAdmin1234", "barakahModerator0102", "customer", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রোল নির্বাচন করা হয়েছে",
      });
    }

    const targetUser = await usersCollection.findOne(query);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });
    }

    if (targetUser.email === "bishalovi4874@gmail.com" && role !== "barakahAdmin1234") {
      return res.status(403).json({
        success: false,
        message: "মূল অ্যাডমিন রোল পরিবর্তন করা যাবে না",
      });
    }

    const result = await usersCollection.updateOne(query, {
      $set: { role, updatedAt: new Date() },
    });

    res.json({
      success: true,
      message: "ইউজারের রোল সফলভাবে পরিবর্তন করা হয়েছে",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/auth/users/:id - Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { email: String(id).toLowerCase() };
    }

    const userToDelete = await usersCollection.findOne(query);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });
    }

    if (userToDelete.email === "bishalovi4874@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "মূল অ্যাডমিন একাউন্ট ডিলিট করা যাবে না",
      });
    }

    const result = await usersCollection.deleteOne(query);
    res.json({
      success: true,
      message: "ইউজার সফলভাবে মুছে ফেলা হয়েছে",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
