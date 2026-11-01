
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Authentication required. Please log in.");
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    const error = new Error("Invalid authorization header");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(decoded.sub);

    if (!user) {
      const error = new Error("User account no longer exists");
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error("Your account is inactive");
      error.statusCode = 403;
      return next(error);
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
