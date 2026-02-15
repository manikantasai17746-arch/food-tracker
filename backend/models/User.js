const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  dailyGoal: { type: Number, default: 2000 },
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  activityLevel: String,
  profilePic: String,
  proteinGoal: { type: Number, default: 150 },
  carbsGoal: { type: Number, default: 250 },
  fatGoal: { type: Number, default: 70 }
});

module.exports = mongoose.model("User", UserSchema);
