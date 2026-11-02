const express = require("express");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const adminUserController = require("../controllers/adminUser.controller");

const router = express.Router();


router.use(protect, authorize("admin"));


router.get("/stats", adminUserController.getUserStats);


router.get("/", adminUserController.getUsers);


router.get("/:id", adminUserController.getUserById);

router.patch("/:id/status", adminUserController.updateUserStatus);

router.delete("/:id", adminUserController.deleteUser);

module.exports = router;