
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const authController = require("../controllers/auth.controller");

const {
  validateRegister,
  validateLogin,
} = require("../validators/user.validator");

const { protect } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

authRouter.post(
  "/register",
  validateRegister,
  authController.register
);

authRouter.post(
  "/login",
  loginLimiter,
  validateLogin,
  authController.login
);

authRouter.get(
  "/me",
  protect,
  authController.getMe
);

module.exports = authRouter;
