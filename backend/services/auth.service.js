
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
      algorithm: "HS256",
    }
  );
};

const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "user",
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account is inactive");
    error.statusCode = 403;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};
