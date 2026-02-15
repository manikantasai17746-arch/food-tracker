const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const FoodLog = require("./models/FoodLog");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB Connection
mongoose.connect("mongodb+srv://fooduser01:1492513815@foodtrackercluster.crrbqid.mongodb.net/?appName=FoodTrackerCluster")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Routes
app.use("/api", require("./routes/auth"));

// Add Food Log
app.post("/api/addFood", async (req, res) => {
  try {
    const log = new FoodLog(req.body);
    await log.save();
    res.json({ message: "Food logged successfully" });
  } catch (err) {
    console.error("Add Food Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Food Log
app.delete("/api/food/:id", async (req, res) => {
  try {
    await FoodLog.findByIdAndDelete(req.params.id);
    res.json({ message: "Food deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Food Logs
app.get("/api/foods/:userId", async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.params.userId };
    if (date) {
      query.date = date;
    }
    const foods = await FoodLog.find(query);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
