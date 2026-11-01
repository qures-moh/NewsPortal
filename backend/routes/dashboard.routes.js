
const express = require("express");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  dashboardController.getDashboard
);

module.exports = router;
