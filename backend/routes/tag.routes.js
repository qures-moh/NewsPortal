
const express = require("express");

const tagController = require("../controllers/tag.controller");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const {
  validateTag,
  validateTagUpdate,
} = require("../validators/tag.validator");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

const validateTagId = (req, res, next) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tag ID",
    });
  }

  next();
};

// Public routes
router.get("/", tagController.getPublicTags);

// Admin routes
router.get(
  "/admin/all",
  ...adminOnly,
  tagController.getAdminTags
);

router.get(
  "/admin/:id",
  ...adminOnly,
  validateTagId,
  tagController.getTagById
);

router.post(
  "/",
  ...adminOnly,
  validateTag,
  tagController.createTag
);

router.patch(
  "/:id",
  ...adminOnly,
  validateTagId,
  validateTagUpdate,
  tagController.updateTag
);

router.patch(
  "/:id/status",
  ...adminOnly,
  validateTagId,
  tagController.updateTagStatus
);

router.delete(
  "/:id",
  ...adminOnly,
  validateTagId,
  tagController.deleteTag
);

module.exports = router;
