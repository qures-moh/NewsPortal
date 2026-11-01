
const fs = require("fs");
const path = require("path");

const imageDirectory = path.join(__dirname, "../uploads/images");
const videoDirectory = path.join(__dirname, "../uploads/videos");

const mediaDirectories = {
  image: {
    directory: imageDirectory,
    urlPrefix: "/uploads/images",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
  },
  video: {
    directory: videoDirectory,
    urlPrefix: "/uploads/videos",
    extensions: [".mp4", ".webm", ".mov"],
  },
};

const getMimeType = (extension) => {
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

const uploadMedia = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a file to upload",
    });
  }

  const { fieldname, filename, size, mimetype } = req.file;

  if (!["image", "video"].includes(fieldname)) {
    return res.status(400).json({
      success: false,
      message: "Invalid media type",
    });
  }

  const mediaPath = `/uploads/${fieldname === "video" ? "videos" : "images"}/${filename}`;

  return res.status(201).json({
    success: true,
    message: `${fieldname === "video" ? "Video" : "Image"} uploaded successfully`,
    data: {
      type: fieldname,
      filename,
      path: mediaPath,
      url: mediaPath,
      size,
      mimeType: mimetype,
    },
  });
};

const getMedia = async (req, res, next) => {
  try {
    const mediaTypes = ["image", "video"];

    const mediaResults = await Promise.all(
      mediaTypes.map(async (type) => {
        const config = mediaDirectories[type];

        await fs.promises.mkdir(config.directory, {
          recursive: true,
        });

        const filenames = await fs.promises.readdir(config.directory);

        const files = await Promise.all(
          filenames.map(async (filename) => {
            const extension = path.extname(filename).toLowerCase();

            if (!config.extensions.includes(extension)) {
              return null;
            }

            const filePath = path.join(config.directory, filename);
            const stats = await fs.promises.stat(filePath);

            if (!stats.isFile()) {
              return null;
            }

            return {
              type,
              filename,
              url: `${config.urlPrefix}/${encodeURIComponent(filename)}`,
              size: stats.size,
              mimeType: getMimeType(extension),
              createdAt: stats.mtime,
            };
          })
        );

        return files.filter(Boolean);
      })
    );

    const media = mediaResults
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    return res.status(200).json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const { type, filename } = req.params;

    const config = mediaDirectories[type];

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Invalid media type",
      });
    }

    if (
      !filename ||
      path.basename(filename) !== filename ||
      !config.extensions.includes(path.extname(filename).toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.resolve(config.directory, filename);
    const expectedDirectory = path.resolve(config.directory);

    if (path.dirname(filePath) !== expectedDirectory) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    await fs.promises.unlink(filePath);

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully",
      data: {
        type,
        filename,
      },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    next(error);
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  deleteMedia,
};
