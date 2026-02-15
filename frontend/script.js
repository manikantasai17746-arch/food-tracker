const API = "http://localhost:5000/api";
let userId = null;
let foodLog = [];
let chartInstance = null;
let userGoal = 2000;
let currentDate = new Date().toISOString().split('T')[0];
let macroGoals = { protein: 150, carbs: 250, fat: 70 };

const MOTIVATIONAL_QUOTES = [
  "Believe you can and you're halfway there.",
  "Health is not about weight to lose, but life to gain.",
  "Your body hears everything your mind says.",
  "Don't stop when you're tired. Stop when you're done.",
  "Eat better, feel better.",
  "A healthy outside starts from the inside."
];

// ================= FOOD DATABASE =================
// Nutritional values per 100g
const FOOD_DATABASE = {
  "rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "egg": { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  "chicken": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  "beef": { calories: 250, protein: 26, carbs: 0, fat: 15 },
  "fish": { calories: 100, protein: 20, carbs: 0, fat: 1.3 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fat: 13 },
  "milk": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  "yogurt": { calories: 59, protein: 3.5, carbs: 3.2, fat: 0.4 },
  "bread": { calories: 265, protein: 9, carbs: 49, fat: 1.5 },
  "pasta": { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  "oats": { calories: 389, protein: 17, carbs: 66, fat: 7 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  "orange": { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  "carrot": { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  "spinach": { calories: 23, protein: 2.7, carbs: 3.6, fat: 0.4 },
  "potato": { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  "onion": { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  "butter": { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  "oil": { calories: 884, protein: 0, carbs: 0, fat: 100 },
  "honey": { calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  "sugar": { calories: 387, protein: 0, carbs: 100, fat: 0 },
  "cheese": { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  "meat": { calories: 250, protein: 26, carbs: 0, fat: 15 },
  "fish/salmon": { calories: 208, protein: 20, carbs: 0, fat: 13 },
  "lentils": { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  "beans": { calories: 127, protein: 8.5, carbs: 23, fat: 0.4 },
  "peanut butter": { calories: 588, protein: 25, carbs: 20, fat: 50 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fat: 50 },
  "peanuts": { calories: 567, protein: 26, carbs: 16, fat: 49 }
};


// ================= DOM =================
const form = document.getElementById("food-form");
const tableBody = document.getElementById("food-table-body");
const totalCalsEl = document.getElementById("total-cals");
const totalProteinEl = document.getElementById("total-protein");
const totalCarbsEl = document.getElementById("total-carbs");
const totalFatEl = document.getElementById("total-fat");
const goalDisplayEl = document.getElementById("goal-display");
const clearBtn = document.getElementById("clear-btn");

// ================= AUTH =================
// ================= AUTH =================
// ================= AUTH =================
async function checkAuth() {
  const storedUserId = localStorage.getItem("userId");

  if (!storedUserId) {
    window.location.href = "login.html";
    return;
  }
  userId = storedUserId;
  await fetchUserProfile(); // Fetch goal and name
  loadFoods();
}

async function fetchUserProfile() {
  try {
    const res = await fetch(API + "/user/" + userId);
    const user = await res.json();
    if (user) {
      userGoal = user.dailyGoal || 2000;
      macroGoals = {
        protein: user.proteinGoal || 150,
        carbs: user.carbsGoal || 250,
        fat: user.fatGoal || 70
      };

      updateHeader(user);
    }
  } catch (err) {
    console.error("Error fetching profile", err);
  }
}

function updateHeader(user) {
  if (user.dailyGoal) {
    userGoal = user.dailyGoal;
    const goalLabel = document.getElementById("daily-goal-label");
    if (goalLabel) goalLabel.textContent = userGoal;
  }

  // Update Profile Pic
  const picEl = document.getElementById("header-profile-pic");
  if (picEl) {
    picEl.src = getProfilePic(user);
  }
}

function displayRandomQuote() {
  const quoteBox = document.getElementById("quote-box");
  if (quoteBox) {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    quoteBox.textContent = `"${randomQuote}"`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Set Date Picker to Today
  const datePicker = document.getElementById("date-picker");
  if (datePicker) {
    datePicker.value = currentDate;
    datePicker.addEventListener("change", (e) => {
      currentDate = e.target.value;
      loadFoods();
    });
  }

  checkAuth();
  initChart();
  displayRandomQuote();
  
  // ===== INIT FOOD DATABASE =====
  populateFoodList();
  setupFoodCalculation();
});

// ================= FOOD CALCULATION =================
function populateFoodList() {
  const foodListElem = document.getElementById("food-list");
  if (!foodListElem) return;
  
  Object.keys(FOOD_DATABASE).forEach(food => {
    const option = document.createElement("option");
    option.value = food.charAt(0).toUpperCase() + food.slice(1);
    foodListElem.appendChild(option);
  });
}

// ================= MEAL SUGGESTIONS =================
function getMealTimeInfo() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) {
    return { time: "🌅 Breakfast", meal: "breakfast", timeRange: "5 AM - 9 AM" };
  } else if (hour >= 9 && hour < 12) {
    return { time: "☕ Morning Snack", meal: "snack", timeRange: "9 AM - 12 PM" };
  } else if (hour >= 12 && hour < 15) {
    return { time: "🍽️ Lunch", meal: "lunch", timeRange: "12 PM - 3 PM" };
  } else if (hour >= 15 && hour < 18) {
    return { time: "🥤 Afternoon Snack", meal: "snack", timeRange: "3 PM - 6 PM" };
  } else if (hour >= 18 && hour < 22) {
    return { time: "🌙 Dinner", meal: "dinner", timeRange: "6 PM - 10 PM" };
  } else {
    return { time: "🌃 Late Night", meal: "snack", timeRange: "10 PM - 5 AM" };
  }
}

function suggestMeals(remainingCals, remainingProtein, remainingCarbs, remainingFat) {
  // Categorize foods by macro focus
  const proteinRich = ["chicken", "fish", "beef", "eggs", "milk", "yogurt", "cheese"];
  const carbRich = ["rice", "pasta", "bread", "oats", "potato"];
  const fatRich = ["butter", "oil", "peanut butter", "almonds", "peanuts"];
  const balanced = ["salmon", "lentils", "beans"];

  let suggestions = [];

  // If protein is low, suggest protein foods
  if (remainingProtein > 30) {
    proteinRich.slice(0, 3).forEach(food => {
      if (FOOD_DATABASE[food]) {
        suggestions.push({
          name: food.charAt(0).toUpperCase() + food.slice(1),
          reason: "High Protein",
          weight: "150-200g",
          icon: "🍗"
        });
      }
    });
  }

  // If carbs are low, suggest carb foods
  if (remainingCarbs > 50) {
    carbRich.slice(0, 3).forEach(food => {
      if (FOOD_DATABASE[food]) {
        suggestions.push({
          name: food.charAt(0).toUpperCase() + food.slice(1),
          reason: "High Carbs",
          weight: "150-200g",
          icon: "🍚"
        });
      }
    });
  }

  // If nothing specific is low, suggest balanced foods
  if (suggestions.length === 0) {
    balanced.slice(0, 2).forEach(food => {
      if (FOOD_DATABASE[food]) {
        suggestions.push({
          name: food.charAt(0).toUpperCase() + food.slice(1),
          reason: "Balanced Macros",
          weight: "150g",
          icon: "🍲"
        });
      }
    });
  }

  return suggestions.slice(0, 4); // Return top 4 suggestions
}

function updateMealSuggestions(totals) {
  const mealInfo = getMealTimeInfo();
  
  // Update meal time display
  const mealTimeDisplay = document.getElementById("meal-time-display");
  if (mealTimeDisplay) {
    mealTimeDisplay.textContent = mealInfo.time + " (" + mealInfo.timeRange + ")";
  }

  const suggestedMealType = document.getElementById("suggested-meal-type");
  if (suggestedMealType) {
    suggestedMealType.textContent = mealInfo.time;
  }

  // Calculate remaining macros
  const remainingCals = Math.max(0, userGoal - totals.cals);
  const remainingProtein = Math.max(0, macroGoals.protein - totals.protein);
  const remainingCarbs = Math.max(0, macroGoals.carbs - totals.carbs);
  const remainingFat = Math.max(0, (macroGoals.fatGoal || 70) - totals.fat);

  // Update remaining summary
  const remainingSummary = document.getElementById("remaining-summary");
  if (remainingSummary) {
    remainingSummary.innerHTML = `
      <strong>🔥 ${Math.round(remainingCals)} kcal</strong><br>
      <strong>🥩 ${Math.round(remainingProtein * 10) / 10}g Protein</strong><br>
      <strong>🍝 ${Math.round(remainingCarbs * 10) / 10}g Carbs</strong><br>
      <strong>🧈 ${Math.round(remainingFat * 10) / 10}g Fat</strong>
    `;
  }

  // Get food suggestions
  const suggestions = suggestMeals(remainingCals, remainingProtein, remainingCarbs, remainingFat);
  
  // Update food suggestions
  const foodSuggestionsEl = document.getElementById("food-suggestions");
  if (foodSuggestionsEl) {
    foodSuggestionsEl.innerHTML = suggestions.map(food => `
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem;">${food.icon}</div>
        <div style="font-weight: bold;">${food.name}</div>
        <div style="font-size: 0.8rem;">Weight: ${food.weight}</div>
        <div style="font-size: 0.75rem; opacity: 0.8;">${food.reason}</div>
      </div>
    `).join('');
  }

  // Display meal schedule
  const mealSchedule = document.getElementById("meal-schedule");
  if (mealSchedule) {
    mealSchedule.innerHTML = `
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.3rem;">🌅</div>
        <strong>Breakfast</strong><br>
        <span style="font-size: 0.85rem;">5 AM - 9 AM</span>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.3rem;">☕</div>
        <strong>Snack</strong><br>
        <span style="font-size: 0.85rem;">9 AM - 12 PM</span>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.3rem;">🍽️</div>
        <strong>Lunch</strong><br>
        <span style="font-size: 0.85rem;">12 PM - 3 PM</span>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.3rem;">🥤</div>
        <strong>Snack</strong><br>
        <span style="font-size: 0.85rem;">3 PM - 6 PM</span>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.3rem;">🌙</div>
        <strong>Dinner</strong><br>
        <span style="font-size: 0.85rem;">6 PM - 10 PM</span>
      </div>
    `;
  }
}

function setupFoodCalculation() {
  const foodNameInput = document.getElementById("food-name");
  const foodWeightInput = document.getElementById("food-weight");
  
  if (foodNameInput && foodWeightInput) {
    foodNameInput.addEventListener("change", calculateFoodNutrition);
    foodWeightInput.addEventListener("input", calculateFoodNutrition);
  }
}

function calculateFoodNutrition() {
  const foodNameInput = document.getElementById("food-name");
  const foodWeightInput = document.getElementById("food-weight");
  const foodCalInput = document.getElementById("food-cal");
  const foodProteinInput = document.getElementById("food-protein");
  const foodCarbsInput = document.getElementById("food-carbs");
  const foodFatInput = document.getElementById("food-fat");
  
  const foodName = foodNameInput.value.toLowerCase().trim();
  const weight = Number(foodWeightInput.value) || 0;
  
  // Find food in database
  const food = FOOD_DATABASE[foodName];
  
  if (food && weight > 0) {
    // Calculate values based on weight
    const multiplier = weight / 100;
    foodCalInput.value = Math.round(food.calories * multiplier);
    foodProteinInput.value = Math.round(food.protein * multiplier * 10) / 10;
    foodCarbsInput.value = Math.round(food.carbs * multiplier * 10) / 10;
    foodFatInput.value = Math.round(food.fat * multiplier * 10) / 10;
  } else if (weight === 0) {
    // Clear if weight is 0
    foodCalInput.value = "";
    foodProteinInput.value = "";
    foodCarbsInput.value = "";
    foodFatInput.value = "";
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ================= INIT =================
// ================= EVENTS =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await addFood(e);
});

clearBtn.addEventListener("click", () => {
  alert("Clear not implemented for backend (intentional for safety)");
});

// ================= CORE =================
async function addFood(e) {
  e.preventDefault();

  const foodName = document.getElementById("food-name").value;
  const calories = Number(document.getElementById("food-cal").value);
  const protein = Number(document.getElementById("food-protein").value);
  const carbs = Number(document.getElementById("food-carbs").value);
  const fat = Number(document.getElementById("food-fat").value);

  const body = {
    userId,
    foodName,
    calories,
    protein,
    carbs,
    fat,
    date: currentDate // Use selected date
  };

  await fetch(API + "/addFood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  document.getElementById("food-form").reset();
  loadFoods();
}

async function deleteFood(id) {
  if (!confirm("Delete this food?")) return;

  await fetch(`${API}/food/${id}`, { method: "DELETE" });
  loadFoods(); // Reload list
}

async function loadFoods() {
  if (!userId) return;

  const res = await fetch(`${API}/foods/${userId}?date=${currentDate}`);
  foodLog = await res.json();
  updateUI();
}

// ================= UI =================
function updateUI() {
  renderTable();
  const totals = calculateTotals();
  updateStats(totals);
  updateChart(totals);
  updateMealSuggestions(totals);
}

function calculateTotals() {
  return foodLog.reduce(
    (acc, item) => {
      acc.cals += item.calories;
      acc.protein += item.protein || 0;
      acc.carbs += item.carbs || 0;
      acc.fat += item.fat || 0;
      return acc;
    },
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function updateStats(t) {
  totalCalsEl.textContent = Math.round(t.cals);

  // Update Macros with Goals
  totalProteinEl.innerHTML = `${Math.round(t.protein)}g <span style="font-size:0.8rem; opacity:0.7">/ ${macroGoals.protein}g</span>`;
  totalCarbsEl.innerHTML = `${Math.round(t.carbs)}g <span style="font-size:0.8rem; opacity:0.7">/ ${macroGoals.carbs}g</span>`;
  totalFatEl.innerHTML = `${Math.round(t.fat)}g <span style="font-size:0.8rem; opacity:0.7">/ ${macroGoals.fatGoal || 70}g</span>`;

  // ===== REMAINING VALUES =====
  const remainingCals = userGoal - t.cals;
  const remainingProtein = macroGoals.protein - t.protein;
  const remainingCarbs = macroGoals.carbs - t.carbs;
  const remainingFat = (macroGoals.fatGoal || 70) - t.fat;
  
  // Update remaining elements
  const remainingCalsEl = document.getElementById("remaining-cals");
  const remainingProteinEl = document.getElementById("remaining-protein");
  const remainingCarbsEl = document.getElementById("remaining-carbs");
  const remainingFatEl = document.getElementById("remaining-fat");
  
  if (remainingCalsEl) {
    remainingCalsEl.textContent = Math.max(0, remainingCals);
    // Change color if user exceeds goal
    remainingCalsEl.style.color = remainingCals < 0 ? "#e74c3c" : "#2ecc71";
  }
  
  if (remainingProteinEl) {
    remainingProteinEl.textContent = Math.max(0, Math.round(remainingProtein * 10) / 10) + "g";
    remainingProteinEl.style.color = remainingProtein < 0 ? "#e74c3c" : "#2ecc71";
  }
  
  if (remainingCarbsEl) {
    remainingCarbsEl.textContent = Math.max(0, Math.round(remainingCarbs * 10) / 10) + "g";
    remainingCarbsEl.style.color = remainingCarbs < 0 ? "#e74c3c" : "#2ecc71";
  }
  
  if (remainingFatEl) {
    remainingFatEl.textContent = Math.max(0, Math.round(remainingFat * 10) / 10) + "g";
    remainingFatEl.style.color = remainingFat < 0 ? "#e74c3c" : "#2ecc71";
  }

  const remaining = userGoal - t.cals;
  if (goalDisplayEl) {
    goalDisplayEl.textContent = remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} kcal left`;
  }

  // Update goal text in header if exists
  const goalLabelEl = document.getElementById("daily-goal-label");
  if (goalLabelEl) goalLabelEl.textContent = userGoal;
}

function renderTable() {
  tableBody.innerHTML = "";
  foodLog.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.foodName}</td>
      <td>${item.calories}</td>
      <td>${item.protein || 0}</td>
      <td>${item.carbs || 0}</td>
      <td>${item.fat || 0}</td>
      <td>${item.fat || 0}</td>
      <td style="text-align:center;">
          <button class="icon-btn delete-btn" onclick="deleteFood('${item._id}')" title="Delete Log">
            <i class="fa-solid fa-trash"></i>
          </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Helper to get robust profile pic
function getProfilePic(user) {
  if (user.profilePic && user.profilePic.trim() !== "" && !user.profilePic.includes("via.placeholder")) {
    return user.profilePic;
  }
  const name = user.name || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
}

// ================= PROFILE =================
async function loadProfile() {
  const storedId = localStorage.getItem("userId");
  if (!storedId) return (window.location.href = "login.html");

  const res = await fetch(API + "/user/" + storedId);
  const user = await res.json();

  document.getElementById("p-name").value = user.name || "";
  document.getElementById("p-goal").value = user.dailyGoal || 2000;
  document.getElementById("p-protein-goal").value = user.proteinGoal || 150;
  document.getElementById("p-carbs-goal").value = user.carbsGoal || 250;
  document.getElementById("p-fat-goal").value = user.fatGoal || 70;

  document.getElementById("p-age").value = user.age || "";
  document.getElementById("p-gender").value = user.gender || "male";
  document.getElementById("p-weight").value = user.weight || "";
  document.getElementById("p-height").value = user.height || "";
  document.getElementById("p-activity").value = user.activityLevel || "sedentary";

  if (user.profilePic) {
    document.getElementById("profile-preview").src = user.profilePic;
  } else {
    // If no specific pic, show the default but don't set value yet (or show default)
    document.getElementById("profile-preview").src = getProfilePic(user);
  }
  
  // ===== SETUP BMI CALCULATION =====
  calculateAndDisplayBMI();
  setupBMIListeners();
  calculateBMRAndTDEE();
}

// ================= BMI CALCULATION =================
function calculateAndDisplayBMI() {
  const weight = Number(document.getElementById("p-weight").value);
  const height = Number(document.getElementById("p-height").value);
  
  if (!weight || !height || weight <= 0 || height <= 0) {
    document.getElementById("bmi-value").textContent = "--";
    document.getElementById("bmi-category").textContent = "Enter height and weight";
    return;
  }
  
  // BMI = weight (kg) / (height (m))^2
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const bmiRounded = Math.round(bmi * 10) / 10;
  
  document.getElementById("bmi-value").textContent = bmiRounded;
  
  // Determine BMI category
  let category = "";
  let categoryColor = "";
  
  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "#3498db"; // Blue
  } else if (bmi >= 18.5 && bmi < 25) {
    category = "Normal Weight";
    categoryColor = "#2ecc71"; // Green
  } else if (bmi >= 25 && bmi < 30) {
    category = "Overweight";
    categoryColor = "#f39c12"; // Orange
  } else {
    category = "Obese";
    categoryColor = "#e74c3c"; // Red
  }
  
  const categoryEl = document.getElementById("bmi-category");
  categoryEl.textContent = category;
  
  // Update BMI section background color based on category
  const bmiSection = document.querySelector(".bmi-section");
  if (bmiSection) {
    bmiSection.style.background = `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`;
  }
}

function setupBMIListeners() {
  const weightInput = document.getElementById("p-weight");
  const heightInput = document.getElementById("p-height");
  const ageInput = document.getElementById("p-age");
  const genderSelect = document.getElementById("p-gender");
  const activitySelect = document.getElementById("p-activity");
  
  if (weightInput) {
    weightInput.addEventListener("input", () => {
      calculateAndDisplayBMI();
      calculateBMRAndTDEE();
    });
  }
  if (heightInput) {
    heightInput.addEventListener("input", () => {
      calculateAndDisplayBMI();
      calculateBMRAndTDEE();
    });
  }
  if (ageInput) {
    ageInput.addEventListener("input", calculateBMRAndTDEE);
  }
  if (genderSelect) {
    genderSelect.addEventListener("change", calculateBMRAndTDEE);
  }
  if (activitySelect) {
    activitySelect.addEventListener("change", calculateBMRAndTDEE);
  }
}

function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("profile-preview").src = e.target.result;
    }
    reader.readAsDataURL(file);
  }
}

async function saveProfile() {
  const userId = localStorage.getItem("userId");

  // Convert Image to Base64
  let profilePic = document.getElementById("profile-preview").src;

  // Use a default avatar if it's the placeholder, effectively unsetting it or ignoring it
  if (profilePic.includes("via.placeholder")) {
    // If user didn't upload a new one, we might want to keep the old one or send empty string
    // For this simple logic, let's assume if it matches via.placeholder, we send empty string
    // BUT if we loaded an existing picture, it won't be via.placeholder.
    profilePic = "";
  }

  // However, if we loaded a profile pic, the src is that base64/url.
  // If we changed it, it's base64. 
  // We can just send whatever is in the src. If it's a huge base64 string, MongoDB might complain if >16MB document size,
  // but for small avatars it's fine.Ideally we check input file.

  const fileInput = document.getElementById("p-image");
  if (fileInput.files.length === 0) {
    // No new file selected. 
    // If we want to keep existing pic, we don't need to send it again if backend handles partial updates (which mongoose findByIdAndUpdate does)
    // BUT our backend replaces fields provided. So we should send the current src if it's valid.
    // If src is placeholder, send empty.
    if (document.getElementById("profile-preview").src.includes("via.placeholder")) profilePic = "";
    else profilePic = document.getElementById("profile-preview").src;
  } else {
    // New file selected, src is already updated by previewImage
    profilePic = document.getElementById("profile-preview").src;
  }

  // If user explicitly cleared it (we need to track this, or just check if src is default avatar)
  // For simplicity: if src is the UI Avatars link or empty, we send empty string.
  if (profilePic.includes("ui-avatars.com")) profilePic = "";

  const body = {
    name: document.getElementById("p-name").value,
    dailyGoal: Number(document.getElementById("p-goal").value),
    proteinGoal: Number(document.getElementById("p-protein-goal").value),
    carbsGoal: Number(document.getElementById("p-carbs-goal").value),
    fatGoal: Number(document.getElementById("p-fat-goal").value),
    age: Number(document.getElementById("p-age").value),
    gender: document.getElementById("p-gender").value,
    weight: Number(document.getElementById("p-weight").value),
    height: Number(document.getElementById("p-height").value),
    activityLevel: document.getElementById("p-activity").value,
    profilePic: profilePic
  };

  const updatedUser = await fetch(API + "/user/" + userId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(res => res.json());

  alert("Profile updated!");
  updateHeader(updatedUser); // Update DOM immediately
  // Refresh to update header if needed, but not strictly required
}

function clearProfilePic() {
  const name = document.getElementById("p-name").value || "User";
  const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  document.getElementById("profile-preview").src = defaultPic;
  document.getElementById("p-image").value = ""; // Clear file input
}

// ================= CHART =================
function initChart() {
  const ctx = document.getElementById("macroChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
      datasets: [
        {
          label: "Macros",
          data: [0, 0, 0],
          backgroundColor: ["#0052cc", "#d35400", "#c0392b"],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#333',
            font: {
              size: 14
            }
          }
        }
      }
    }
  });
}

function updateChart(t) {
  if (chartInstance) {
    chartInstance.data.datasets[0].data = [t.protein, t.carbs, t.fat];
    chartInstance.update();
  }
}

// ================= WATER TRACKING =================
let waterGlasses = 0;

function addWater() {
  if (waterGlasses < 10) {
    waterGlasses++;
    updateWaterDisplay();
    localStorage.setItem("water-" + currentDate, waterGlasses);
  }
}

function resetWater() {
  waterGlasses = 0;
  updateWaterDisplay();
  localStorage.removeItem("water-" + currentDate);
}

function updateWaterDisplay() {
  const glassEl = document.getElementById("water-glasses");
  const progressEl = document.getElementById("water-progress");
  if (glassEl) glassEl.textContent = `${waterGlasses} / 8`;
  if (progressEl) progressEl.value = waterGlasses;
}

function loadWaterData() {
  const saved = localStorage.getItem("water-" + currentDate);
  waterGlasses = saved ? parseInt(saved) : 0;
  updateWaterDisplay();
}

// ================= WORKOUT TRACKING =================
let workoutList = [];
let caloriesBurnedToday = 0;

const EXERCISE_CALORIES = {
  "running": { light: 6, moderate: 10, intense: 15 },
  "cycling": { light: 5, moderate: 9, intense: 14 },
  "gym": { light: 4, moderate: 8, intense: 12 },
  "swimming": { light: 7, moderate: 11, intense: 16 },
  "yoga": { light: 3, moderate: 5, intense: 8 },
  "walking": { light: 3, moderate: 5, intense: 7 },
  "sports": { light: 5, moderate: 10, intense: 15 }
};

function logWorkout(event) {
  event.preventDefault();
  const exerciseType = document.getElementById("exercise-type").value;
  const duration = parseInt(document.getElementById("exercise-duration").value);
  const intensity = document.getElementById("exercise-intensity").value;

  if (!exerciseType || !duration) return;

  const caloriesPerMin = EXERCISE_CALORIES[exerciseType][intensity];
  const caloriesBurned = caloriesPerMin * duration;
  caloriesBurnedToday += caloriesBurned;

  const burnEl = document.getElementById("total-calories-burned");
  if (burnEl) {
    burnEl.innerHTML = `💪 Calories Burned: ${Math.round(caloriesBurnedToday)} kcal<br><small>${exerciseType} (${duration}min - ${intensity})</small>`;
  }

  document.getElementById("exercise-type").value = "";
  document.getElementById("exercise-duration").value = "";
  document.getElementById("exercise-intensity").value = "moderate";
}

document.getElementById("workout-form")?.addEventListener("submit", logWorkout);

// ================= WEIGHT TRACKING =================
let weightHistory = [];
let weightChartInstance = null;

function logWeight() {
  const weight = parseFloat(document.getElementById("today-weight").value);
  if (!weight) return alert("Please enter a valid weight");

  weightHistory.push({ date: currentDate, weight: weight });
  localStorage.setItem("weight-history", JSON.stringify(weightHistory));
  
  updateWeightDisplay();
  document.getElementById("today-weight").value = "";
}

function updateWeightDisplay() {
  if (weightHistory.length === 0) return;
  
  const firstWeight = weightHistory[0].weight;
  const lastWeight = weightHistory[weightHistory.length - 1].weight;
  const change = lastWeight - firstWeight;
  const changeText = change > 0 ? `+${change.toFixed(1)} kg ⬆️` : `${change.toFixed(1)} kg ⬇️`;
  
  const changeEl = document.getElementById("weight-change");
  if (changeEl) changeEl.textContent = changeText;

  drawWeightChart();
}

function drawWeightChart() {
  const canvas = document.getElementById("weightChart");
  if (!canvas || weightHistory.length === 0) return;

  const ctx = canvas.getContext("2d");
  
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: weightHistory.map(w => w.date),
      datasets: [{
        label: "Weight (kg)",
        data: weightHistory.map(w => w.weight),
        borderColor: "#e74c3c",
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
}

function loadWeightHistory() {
  const saved = localStorage.getItem("weight-history");
  weightHistory = saved ? JSON.parse(saved) : [];
  updateWeightDisplay();
}

// ================= FAVORITE MEALS =================
let favoriteMeals = [];

function saveFavoriteMeal() {
  const foodName = document.getElementById("food-name").value;
  const weight = document.getElementById("food-weight").value;
  const favName = document.getElementById("favorite-name").value;

  if (!foodName || !weight || !favName) {
    return alert("Fill in food name, weight, and favorite name");
  }

  const food = FOOD_DATABASE[foodName.toLowerCase()];
  if (!food) return alert("Food not found in database");

  const meal = {
    id: Date.now(),
    name: favName,
    foodName: foodName,
    weight: parseInt(weight),
    calories: Math.round(food.calories * weight / 100),
    protein: Math.round(food.protein * weight / 100 * 10) / 10,
    carbs: Math.round(food.carbs * weight / 100 * 10) / 10,
    fat: Math.round(food.fat * weight / 100 * 10) / 10
  };

  favoriteMeals.push(meal);
  localStorage.setItem("favorite-meals", JSON.stringify(favoriteMeals));
  displayFavoriteMeals();
  document.getElementById("favorite-name").value = "";
}

function displayFavoriteMeals() {
  const container = document.getElementById("favorite-meals");
  if (!container) return;

  container.innerHTML = favoriteMeals.map(meal => `
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; cursor: pointer;" onclick="quickAddFavorite(${meal.id})">
      <strong>${meal.name}</strong><br>
      <small>${meal.foodName} ${meal.weight}g</small><br>
      <small style="color: #667eea;">⚡${meal.calories}kcal</small>
      <button onclick="deleteFavorite(${meal.id}); event.stopPropagation();" style="float: right; background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer;">✕</button>
    </div>
  `).join('');
}

function quickAddFavorite(id) {
  const meal = favoriteMeals.find(m => m.id === id);
  if (!meal) return;

  // Add to food log directly
  fetch(API + "/addFood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      foodName: meal.foodName,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      date: currentDate
    })
  }).then(() => {
    loadFoods();
    alert(`✅ Added ${meal.name} to today's log!`);
  });
}

function deleteFavorite(id) {
  favoriteMeals = favoriteMeals.filter(m => m.id !== id);
  localStorage.setItem("favorite-meals", JSON.stringify(favoriteMeals));
  displayFavoriteMeals();
}

function loadFavoriteMeals() {
  const saved = localStorage.getItem("favorite-meals");
  favoriteMeals = saved ? JSON.parse(saved) : [];
  displayFavoriteMeals();
}

// ================= WEEKLY & MONTHLY REPORTS =================
function calculateWeeklyReport() {
  // Get last 7 days of data
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }

  let totals = { cals: 0, protein: 0, carbs: 0, fat: 0, days: 0 };

  last7Days.forEach(date => {
    // Load data for each day (simplified - you'd need backend support)
    totals.days++;
  });

  const avg = {
    cals: Math.round(totals.cals / Math.max(totals.days, 1)),
    protein: Math.round(totals.protein / Math.max(totals.days, 1) * 10) / 10,
    carbs: Math.round(totals.carbs / Math.max(totals.days, 1) * 10) / 10,
    fat: Math.round(totals.fat / Math.max(totals.days, 1) * 10) / 10
  };

  document.getElementById("weekly-avg-cal").textContent = `Avg Calories: ${avg.cals} kcal`;
  document.getElementById("weekly-avg-protein").textContent = `Avg Protein: ${avg.protein}g`;
  document.getElementById("weekly-avg-carbs").textContent = `Avg Carbs: ${avg.carbs}g`;
  document.getElementById("weekly-avg-fat").textContent = `Avg Fat: ${avg.fat}g`;
}

function calculateMonthlyReport() {
  // Similar to weekly but for 30 days
  document.getElementById("monthly-avg-cal").textContent = `Avg Calories: ${Math.round(userGoal)} kcal`;
  document.getElementById("monthly-avg-protein").textContent = `Avg Protein: ${macroGoals.protein}g`;
  document.getElementById("monthly-avg-carbs").textContent = `Avg Carbs: ${macroGoals.carbs}g`;
  document.getElementById("monthly-avg-fat").textContent = `Avg Fat: ${macroGoals.fatGoal}g`;
}

function exportReport() {
  alert("📄 Exporting weekly report as PDF...\n\nNote: PDF export requires a backend library. Use browser's Print to PDF feature (Ctrl+P) for now.");
  window.print();
}

function exportMonthlyReport() {
  alert("📄 Exporting monthly report as PDF...\n\nNote: PDF export requires a backend library. Use browser's Print to PDF feature (Ctrl+P) for now.");
  window.print();
}

// ================= RECIPES =================
let recipes = [];

function addToRecipe() {
  const food = document.getElementById("recipe-food").value;
  const qty = document.getElementById("recipe-quantity").value;
  
  if (!food || !qty) return alert("Select food and quantity");
  
  console.log(`Added ${qty}g of ${food} to recipe`);
}

function saveRecipe() {
  const name = document.getElementById("recipe-name").value;
  if (!name) return alert("Enter recipe name");

  const recipe = {
    id: Date.now(),
    name: name,
    foods: [] // In real app, would collect all added foods
  };

  recipes.push(recipe);
  localStorage.setItem("recipes", JSON.stringify(recipes));
  document.getElementById("recipe-name").value = "";
  displayRecipes();
}

function displayRecipes() {
  const container = document.getElementById("recipes-list");
  if (!container || recipes.length === 0) return;

  container.innerHTML = `<h4>Saved Recipes:</h4>` + recipes.map(recipe => `
    <div style="background: #ecf0f1; padding: 10px; margin: 5px 0; border-radius: 5px;">
      📝 ${recipe.name}
      <button onclick="deleteRecipe(${recipe.id})" style="float: right; background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer;">Delete</button>
    </div>
  `).join('');
}

function deleteRecipe(id) {
  recipes = recipes.filter(r => r.id !== id);
  localStorage.setItem("recipes", JSON.stringify(recipes));
  displayRecipes();
}

function loadRecipes() {
  const saved = localStorage.getItem("recipes");
  recipes = saved ? JSON.parse(saved) : [];
  displayRecipes();
}

// ================= DIET PLANS =================
let selectedDietPlan = null;

function selectDietPlan(plan) {
  selectedDietPlan = plan;
  const dietNames = {
    balanced: "⚖️ Balanced Diet (40C-30P-30F)",
    keto: "🥓 Keto Diet (5C-35P-60F)",
    lowcarb: "🥬 Low Carb (25C-35P-40F)",
    highprotein: "🍗 High Protein (35C-45P-20F)",
    vegan: "🌱 Vegan",
    lowfat: "🍎 Low Fat (55C-25P-20F)"
  };
  
  document.getElementById("selected-diet").textContent = `Selected Diet: ${dietNames[plan]} ✅`;
  localStorage.setItem("selected-diet", plan);
  adjustGoalsForDiet(plan);
}

function adjustGoalsForDiet(plan) {
  const calorieGoal = userGoal;
  const dietStats = {
    balanced: { carbs: calorieGoal * 0.4 / 4, protein: calorieGoal * 0.3 / 4, fat: calorieGoal * 0.3 / 9 },
    keto: { carbs: calorieGoal * 0.05 / 4, protein: calorieGoal * 0.35 / 4, fat: calorieGoal * 0.6 / 9 },
    lowcarb: { carbs: calorieGoal * 0.25 / 4, protein: calorieGoal * 0.35 / 4, fat: calorieGoal * 0.4 / 9 },
    highprotein: { carbs: calorieGoal * 0.35 / 4, protein: calorieGoal * 0.45 / 4, fat: calorieGoal * 0.2 / 9 },
    vegan: { carbs: calorieGoal * 0.5 / 4, protein: calorieGoal * 0.15 / 4, fat: calorieGoal * 0.35 / 9 },
    lowfat: { carbs: calorieGoal * 0.55 / 4, protein: calorieGoal * 0.25 / 4, fat: calorieGoal * 0.2 / 9 }
  };

  if (dietStats[plan]) {
    macroGoals = {
      carbs: Math.round(dietStats[plan].carbs),
      protein: Math.round(dietStats[plan].protein),
      fatGoal: Math.round(dietStats[plan].fat)
    };
    console.log("Diet goals updated:", macroGoals);
  }
}

function loadDietPlan() {
  const saved = localStorage.getItem("selected-diet");
  if (saved) {
    selectDietPlan(saved);
  }
}

// ================= BMR & TDEE CALCULATOR =================
function calculateBMRAndTDEE() {
  const height = parseFloat(document.getElementById("p-height")?.value) || 0;
  const weight = parseFloat(document.getElementById("p-weight")?.value) || 0;
  const age = parseInt(document.getElementById("p-age")?.value) || 30;
  const gender = document.getElementById("p-gender")?.value || "male";
  const activity = document.getElementById("p-activity")?.value || "sedentary";

  if (!height || !weight) return;

  // Mifflin-St Jeor Formula for BMR
  let bmr;
  if (gender === "male") {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // Activity factors
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };

  const tdee = bmr * (activityFactors[activity] || 1.2);

  // Update UI
  const bmrEl = document.getElementById("bmr-value");
  const tdeeEl = document.getElementById("tdee-value");
  const goalEl = document.getElementById("goal-value");
  const explainEl = document.getElementById("bmr-explanation");

  if (bmrEl) bmrEl.textContent = `${Math.round(bmr)} kcal`;
  if (tdeeEl) tdeeEl.textContent = `${Math.round(tdee)} kcal`;
  if (goalEl) goalEl.textContent = `${Math.round(tdee - 300)} kcal`;

  if (explainEl) {
    explainEl.innerHTML = `
      <strong>BMR (Basal Metabolic Rate):</strong> ${Math.round(bmr)} kcal - Calories burned at rest<br>
      <strong>TDEE (Total Daily Energy Expenditure):</strong> ${Math.round(tdee)} kcal - Total calories burned with ${activity} activity<br>
      <strong>Weight Loss Goal:</strong> ${Math.round(tdee - 300)} kcal/day (500 kcal deficit = ~0.5kg/week loss)<br>
      <strong>Weight Gain Goal:</strong> ${Math.round(tdee + 300)} kcal/day (500 kcal surplus = ~0.5kg/week gain)
    `;
  }

  return { bmr, tdee };
}

// ================= DARK MODE =================
function toggleDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  const body = document.body;

  if (toggle.checked) {
    body.style.backgroundColor = "#1a1a1a";
    body.style.color = "#ffffff";
    document.querySelectorAll(".glass-card").forEach(el => {
      el.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      el.style.color = "#ffffff";
    });
    localStorage.setItem("dark-mode", "true");
  } else {
    body.style.backgroundColor = "#ffffff";
    body.style.color = "#000000";
    document.querySelectorAll(".glass-card").forEach(el => {
      el.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      el.style.color = "#000000";
    });
    localStorage.setItem("dark-mode", "false");
  }
}

function loadDarkMode() {
  const isDark = localStorage.getItem("dark-mode") === "true";
  const toggle = document.getElementById("dark-mode-toggle");
  if (toggle) {
    toggle.checked = isDark;
    if (isDark) toggleDarkMode();
  }
}

// ================= INITIALIZE ALL FEATURES =================
document.addEventListener("DOMContentLoaded", () => {
  loadWaterData();
  loadWeightHistory();
  loadFavoriteMeals();
  loadRecipes();
  loadDietPlan();
  loadDarkMode();
  calculateWeeklyReport();
  calculateMonthlyReport();
});
