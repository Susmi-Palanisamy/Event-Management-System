// Validation middleware for auth routes

const validateSignup = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || !name.trim()) {
    errors.push("Name is required");
  } else if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  } else if (name.trim().length > 50) {
    errors.push("Name must not exceed 50 characters");
  } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    errors.push("Name can only contain letters and spaces");
  }

  // Email validation
  if (!email || !email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please enter a valid email address");
  }

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
  }
  if (!/(?=.*\d)/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one number' });
  }
  if (!/(?=.*[@$!%*?&#])/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one special character (@$!%*?&#)' });
  }

  // Role validation
  if (!role) {
    errors.push("Role is required");
  } else if (!["user", "admin"].includes(role)) {
    errors.push("Role must be either 'user' or 'admin'");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password, role } = req.body;
  const errors = [];

  // Email validation
  if (!email || !email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please enter a valid email address");
  }

  // Password validation
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  // Role validation
  if (!role) {
    errors.push("Role is required");
  } else if (!["user", "admin"].includes(role)) {
    errors.push("Role must be either 'user' or 'admin'");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }

  next();
};

module.exports = { validateSignup, validateLogin };
