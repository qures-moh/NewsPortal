
const express = require("express");

const mediaController = require("../controllers/media.controller");

const {
  uploadImage,
  uploadVideo,
} = require("../middlewares/upload.middleware");

const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

router.get(
  "/",
  ...adminOnly,
  mediaController.getMedia
);

router.post(
  "/image",
  ...adminOnly,
  uploadImage.single("image"),
  mediaController.uploadMedia
);

router.post(
  "/video",
  ...adminOnly,
  uploadVideo.single("video"),
  mediaController.uploadMedia
);

router.delete(
  "/:type/:filename",
  ...adminOnly,
  mediaController.deleteMedia
);

module.exports = router;
