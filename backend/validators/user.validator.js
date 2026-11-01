
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  const allowedFields = ["name", "email", "password"];

  const unknownFields = Object.keys(req.body || {}).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push("Unexpected fields: " + unknownFields.join(", "));
  }

  if (typeof name !== "string" || !name.trim()) {
    errors.push("Name is required");
  } else if (name.trim().length < 2 || name.trim().length > 80) {
    errors.push("Name must contain between 2 and 80 characters");
  }

  if (typeof email !== "string" || !email.trim()) {
    errors.push("Email is required");
  } else if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    errors.push("Please provide a valid email address");
  }

  if (typeof password !== "string" || !password) {
    errors.push("Password is required");
  } else if (password.length < 8 || password.length > 128) {
    errors.push("Password must contain between 8 and 128 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.validatedData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  const allowedFields = ["email", "password"];

  const unknownFields = Object.keys(req.body || {}).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push("Unexpected fields: " + unknownFields.join(", "));
  }

  if (typeof email !== "string" || !email.trim()) {
    errors.push("Email is required");
  } else if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    errors.push("Please provide a valid email address");
  }

  if (typeof password !== "string" || !password) {
    errors.push("Password is required");
  } else if (password.length > 128) {
    errors.push("Password cannot exceed 128 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.validatedData = {
    email: email.trim().toLowerCase(),
    password,
  };

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
