
const authService = require("../services/auth.service");

const register = async (req, res) => {
  const user = await authService.registerUser(req.validatedData);

  res.status(201).json({
    success: true,
    message: "Account registered successfully",
    user,
  });
};

const login = async (req, res) => {
  const result = await authService.loginUser(req.validatedData);

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken: result.accessToken,
    user: result.user,
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};
