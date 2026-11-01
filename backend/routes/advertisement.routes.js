
const express = require("express");

const {
  createAdvertisement,
  getAdminAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getPublicAdvertisements,
} = require("../controllers/advertisement.controller");

const {protect} = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const {
  validateCreateAdvertisement,
  validateUpdateAdvertisement,
} = require("../validators/advertisement.validator");

const router = express.Router();

// Public route
router.get("/public", getPublicAdvertisements);

// Admin routes
router.use(protect, authorize("admin"));

router.get("/admin/all", getAdminAdvertisements);
router.get("/admin/:id", getAdvertisementById);

router.post("/", validateCreateAdvertisement, createAdvertisement);

router.patch("/:id", validateUpdateAdvertisement, updateAdvertisement);

router.delete("/:id", deleteAdvertisement);

module.exports = router;
