const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();
const db = admin.firestore();

// get user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = { id: userDoc.id, ...userDoc.data() };

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌Get user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
