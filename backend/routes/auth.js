const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();

  res.json({ message: "Registration successful" });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    userId: user._id,
    dailyGoal: user.dailyGoal || 2000,
    profilePic: user.profilePic,
    proteinGoal: user.proteinGoal,
    carbsGoal: user.carbsGoal,
    fatGoal: user.fatGoal
  });
});

// GET USER PROFILE
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROFILE & GOALS
router.put("/user/:id", async (req, res) => {
  try {
    const {
      dailyGoal, age, gender, weight, height, activityLevel, name,
      profilePic, proteinGoal, carbsGoal, fatGoal
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        dailyGoal, age, gender, weight, height, activityLevel, name,
        profilePic, proteinGoal, carbsGoal, fatGoal
      },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
