const express = require("express");
const admin = require("firebase-admin");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const db = admin.firestore();

// to handle the login verification from frontend
router.post("/google-credential", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: "No credential provided",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: "Invalid credential",
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    // check if user exists in firestore
    let userDoc = await db.collection("users").doc(googleId).get();
    let user;

    if (!userDoc.exists) {
      // if first time login, create new user
      const newUser = {
        googleId,
        email,
        name,
        avatarUrl: picture,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        loginCount: 1,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("users").doc(googleId).set(newUser);
      user = { id: googleId, ...newUser };

      console.log(`✅ New user created: ${email}`);
    } else {
      // update existing user login info
      user = { id: userDoc.id, ...userDoc.data() };

      await db
        .collection("users")
        .doc(googleId)
        .update({
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          loginCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`✅ Existing user logged in: ${email}`);
    }

    res.json({
      success: true,
      userId: googleId,
      user: {
        id: googleId,
        email,
        name,
        avatarUrl: picture,
      },
      message: userDoc.exists
        ? "Login successful"
        : "Account created successfully",
    });
  } catch (error) {
    console.error("❌Google credential verification error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid credential",
    });
  }
});

module.exports = router;
