const mongoose = require("mongoose");

const FoodLogSchema = new mongoose.Schema({
  userId: String,
  foodName: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  date: String
});

module.exports = mongoose.model("FoodLog", FoodLogSchema);
