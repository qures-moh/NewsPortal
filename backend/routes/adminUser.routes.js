const express = require("express");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const adminUserController = require("../controllers/adminUser.controller");

const router = express.Router();

// All routes require an authenticated admin
router.use(protect, authorize("admin"));

// GET /api/admin/users/stats
router.get("/stats", adminUserController.getUserStats);

// GET /api/admin/users
router.get("/", adminUserController.getUsers);

// GET /api/admin/users/:id
router.get("/:id", adminUserController.getUserById);

// PATCH /api/admin/users/:id/status
router.patch("/:id/status", adminUserController.updateUserStatus);

// DELETE /api/admin/users/:id
router.delete("/:id", adminUserController.deleteUser);

module.exports = router;