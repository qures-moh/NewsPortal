
const express = require("express");

const settingsController = require("../controllers/settings.controller");
const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const { validateSettings } = require("../validators/settings.validator");

const router = express.Router();

const adminOnly = [
  protect,
  authorize("admin"),
];

router.get(
  "/public",
  settingsController.getPublicSettings
);

router.get(
  "/admin",
  ...adminOnly,
  settingsController.getAdminSettings
);

router.patch(
  "/admin",
  ...adminOnly,
  validateSettings,
  settingsController.updateSettings
);

module.exports = router;
