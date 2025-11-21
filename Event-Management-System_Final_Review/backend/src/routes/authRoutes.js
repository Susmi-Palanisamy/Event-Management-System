const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateSignup, validateLogin } = require("../middleware/validation");

const router = express.Router();

// Middleware to check admin
const adminMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Only admins can create users" });
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin creates user
router.post("/create-user", adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: role || "user" });
    await user.save();

    res.json({ msg: "User created successfully!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Signup
router.post("/signup", validateSignup, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use role from frontend, default to "user" if not provided
    const userRole = role || "user";
    const user = new User({ name, email, password: hashedPassword, role: userRole });
    await user.save();

    // create token including role
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ msg: "User registered successfully!", token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // include role in token payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ msg: "Login successful!", token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get("/all-users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "name email role"); // only return necessary fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user info
router.get("/me", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id, "name email role");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Forgot Password - Generate reset token
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ msg: "If the email exists, a reset code has been sent." });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    // In production, send email with reset code
    // For testing, log it to console
    console.log(`Reset code for ${email}: ${resetCode}`);
    
    res.json({ 
      msg: "Reset code sent successfully! Please check your email."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password - Verify code and update password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    }
    if (!/(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one number" });
    }
    if (!/(?=.*[@$!%*?&#])/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one special character (@$!%*?&#)" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or reset code" });
    }

    // Check if reset code is valid and not expired
    if (user.resetCode !== resetCode) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    if (!user.resetCodeExpiry || Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ msg: "Password reset successfully! You can now login with your new password." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/update-profile", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.id } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { name, email },
      { new: true }
    ).select("-password");

    res.json({ msg: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.put("/update-preferences", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { emailNotifications, eventReminders, weeklyDigest } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        preferences: {
          emailNotifications,
          eventReminders,
          weeklyDigest
        }
      },
      { new: true }
    ).select("-password");

    res.json({ msg: "Preferences updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
