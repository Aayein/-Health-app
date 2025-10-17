// backend/server.js

// 1️⃣ Import modules
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const remedies = require("./data/remedies.json");
const doctors = require("./data/doctors.json"); // ✅ new local doctors list
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2️⃣ Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);

// 3️⃣ Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// 4️⃣ Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 5️⃣ Helper function: fallback local remedies
function findLocalRemedy(symptoms) {
  const lower = symptoms.toLowerCase();
  const match = remedies.find(r => lower.includes(r.keyword.toLowerCase()));

  if (match) {
    if (match.severity === "minor") {
      return `It seems like a minor issue. Home remedy: ${match.remedy}`;
    } else {
      return `This may be a serious issue. Please consult a doctor. You can book here: ${match.bookingLink}`;
    }
  }
  return "We couldn't match your symptoms. Please consult a doctor if symptoms persist or worsen.";
}

// 6️⃣ API endpoint: check symptoms
app.post("/check", async (req, res) => {
  const { name, age, symptoms } = req.body;

  console.log("Incoming symptoms:", symptoms);

  let recommendation = "";

  try {
    const prompt = `
      You are a virtual health assistant.
      A user named ${name || "someone"} (age ${age || "unknown"}) reports: "${symptoms}".
      Provide a clear, simple analysis including:
      - Possible causes
      - Home remedies
      - When to see a doctor
      - Add a short disclaimer saying it's not professional medical advice.
    `;

    const result = await model.generateContent(prompt);
    console.log("Gemini API responded");

    recommendation = result.response.text();

    res.json({
      message: "AI-Based Health Suggestion",
      recommendation,
      source: "yogesh files"
    });
  } catch (err) {
    console.error("Gemini failed — using local remedies:", err.message);

    recommendation = findLocalRemedy(symptoms);

    res.json({
      message: "Local Remedy Suggestion",
      recommendation,
      source: "Local remedies.json"
    });
  }
});

// 7️⃣ Manual doctor suggestion (offline logic)
app.get("/doctors", (req, res) => {
  const symptom = (req.query.symptom || "").toLowerCase();
  let specialty = "General Physician";

  if (symptom.includes("headache") || symptom.includes("migraine")) specialty = "Neurologist";
  else if (symptom.includes("chest") || symptom.includes("heart")) specialty = "Cardiologist";
  else if (symptom.includes("skin") || symptom.includes("rash")) specialty = "Dermatologist";
  else if (symptom.includes("stomach") || symptom.includes("vomit") || symptom.includes("abdomen")) specialty = "Gastroenterologist";
  else if (symptom.includes("joint") || symptom.includes("bone")) specialty = "Orthopedic";
  else if (symptom.includes("ear") || symptom.includes("nose") || symptom.includes("throat")) specialty = "ENT Specialist";
  else if (symptom.includes("eye") || symptom.includes("vision")) specialty = "Ophthalmologist";
  else if (symptom.includes("child") || symptom.includes("baby")) specialty = "Pediatrician";
  else if (symptom.includes("stress") || symptom.includes("depression")) specialty = "Psychiatrist";

  const filteredDoctors = doctors.filter(d => d.specialty === specialty);
  const doctorList = filteredDoctors.length ? filteredDoctors : doctors.filter(d => d.specialty === "General Physician");

  res.json({
    message: `Nearby ${specialty}s in Mumbai`,
    doctors: doctorList
  });
});

// 8️⃣ SPA fallback for frontend routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// 9️⃣ Start server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
