
const express = require("express");

const subcategoryController = require("../controllers/subcategory.controller");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const {
  validateSubcategory,
  validateSubcategoryUpdate,
} = require("../validators/subcategory.validator");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

const validateSubcategoryId = (req, res, next) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subcategory ID",
    });
  }

  next();
};

// Public routes
router.get(
  "/category/:categoryId",
  subcategoryController.getPublicSubcategories
);

// Admin routes
router.get(
  "/admin/all",
  ...adminOnly,
  subcategoryController.getAdminSubcategories
);

router.get(
  "/admin/:id",
  ...adminOnly,
  validateSubcategoryId,
  subcategoryController.getSubcategoryById
);

router.post(
  "/",
  ...adminOnly,
  validateSubcategory,
  subcategoryController.createSubcategory
);

router.patch(
  "/:id",
  ...adminOnly,
  validateSubcategoryId,
  validateSubcategoryUpdate,
  subcategoryController.updateSubcategory
);

router.patch(
  "/:id/status",
  ...adminOnly,
  validateSubcategoryId,
  subcategoryController.updateSubcategoryStatus
);

router.delete(
  "/:id",
  ...adminOnly,
  validateSubcategoryId,
  subcategoryController.deleteSubcategory
);

module.exports = router;
