const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

//firebase connection
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  return "Hello from Journalie backend!";
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(
    `✅ Firebase connected to project: ${process.env.FIREBASE_PROJECT_ID}`
  );
});
