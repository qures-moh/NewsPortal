const express = require("express");

const categoryController = require("../controllers/category.controller");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const {
  validateCategory,
  validateCategoryUpdate,
} = require("../validators/category.validator");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

const validateCategoryId = (req, res, next) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  next();
};

router.get("/", categoryController.getPublicCategories);

router.get("/admin/all", ...adminOnly, categoryController.getAdminCategories);

router.get(
  "/admin/:id",
  ...adminOnly,
  validateCategoryId,
  categoryController.getCategoryById,
);

router.post(
  "/",
  ...adminOnly,
  validateCategory,
  categoryController.createCategory,
);

router.patch(
  "/:id",
  ...adminOnly,
  validateCategoryId,
  validateCategoryUpdate,
  categoryController.updateCategory,
);

router.patch(
  "/:id/status",
  ...adminOnly,
  validateCategoryId,
  categoryController.updateCategoryStatus,
);

router.delete(
  "/:id",
  ...adminOnly,
  validateCategoryId,
  categoryController.deleteCategory,
);

module.exports = router;
