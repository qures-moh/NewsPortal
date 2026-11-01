
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const FileType = require("file-type");

const imageDirectory = path.join(__dirname, "../uploads/images");
const videoDirectory = path.join(__dirname, "../uploads/videos");

fs.mkdirSync(imageDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });

const imageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const videoTypes = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const createUploadError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const removeFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const createStorage = (directory, allowedTypes) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, directory);
    },

    filename: (req, file, cb) => {
      const extension = allowedTypes[file.mimetype];

      if (!extension) {
        return cb(
          createUploadError("Unsupported file type")
        );
      }

      cb(null, `${crypto.randomUUID()}${extension}`);
    },
  });

const createUploader = ({
  directory,
  allowedTypes,
  maxFileSize,
  expectedType,
}) => {
  const uploader = multer({
    storage: createStorage(directory, allowedTypes),

    fileFilter: (req, file, cb) => {
      if (!allowedTypes[file.mimetype]) {
        return cb(
          createUploadError("Unsupported file format")
        );
      }

      cb(null, true);
    },

    limits: {
      fileSize: maxFileSize,
      files: 1,
      fields: 10,
      parts: 11,
    },
  });

  return {
    single: (fieldName) => {
      const uploadSingle = uploader.single(fieldName);

      return (req, res, next) => {
        uploadSingle(req, res, async (uploadError) => {
          if (uploadError) {
            if (req.file?.path) {
              await removeFile(req.file.path).catch(() => {});
            }

            if (uploadError instanceof multer.MulterError) {
              uploadError.statusCode = 400;
              uploadError.message =
                uploadError.code === "LIMIT_FILE_SIZE"
                  ? `File size exceeds the allowed limit`
                  : uploadError.message;
            }

            return next(uploadError);
          }

          if (!req.file) {
            return next(
              createUploadError("Please select a file")
            );
          }

          try {
            const detectedType = await FileType.fromFile(
              req.file.path
            );

            if (
              !detectedType ||
              !allowedTypes[detectedType.mime] ||
              detectedType.mime !== req.file.mimetype
            ) {
              await removeFile(req.file.path);

              return next(
                createUploadError(
                  `Invalid ${expectedType} file content`
                )
              );
            }

            const correctExtension = allowedTypes[detectedType.mime];

            const correctFilename = `${crypto.randomUUID()}${correctExtension}`;

            const correctPath = path.join(
              directory,
              correctFilename
            );

            await fs.promises.rename(
              req.file.path,
              correctPath
            );

            req.file.filename = correctFilename;
            req.file.path = correctPath;
            req.file.destination = directory;
            req.file.mimetype = detectedType.mime;
            req.file.size = (
              await fs.promises.stat(correctPath)
            ).size;

            next();
          } catch (error) {
            await removeFile(req.file.path).catch(() => {});

            next(
              error.statusCode
                ? error
                : createUploadError(
                    "Unable to validate uploaded file"
                  )
            );
          }
        });
      };
    },
  };
};

const uploadImage = createUploader({
  directory: imageDirectory,
  allowedTypes: imageTypes,
  maxFileSize: 5 * 1024 * 1024,
  expectedType: "image",
});

const uploadVideo = createUploader({
  directory: videoDirectory,
  allowedTypes: videoTypes,
  maxFileSize: 100 * 1024 * 1024,
  expectedType: "video",
});

module.exports = {
  uploadImage,
  uploadVideo,
};
