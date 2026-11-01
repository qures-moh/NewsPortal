
const allowedFields = [
  "name",
  "bannerImage",
  "destinationUrl",
  "placement",
  "devices",
  "startAt",
  "endAt",
  "isActive",
];

const allowedPages = ["homepage", "article", "category"];
const allowedPositions = ["top", "middle", "bottom"];
const allowedDevices = ["desktop", "mobile"];

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const isValidText = (value, maxLength = 100) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= maxLength;

const isValidBoolean = (value) =>
  typeof value === "boolean";

const isValidDate = (value) =>
  !Number.isNaN(new Date(value).getTime());

const isValidImagePath = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  return (
    value.startsWith("/uploads/images/") &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#")
  );
};

const isValidDestinationUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const validatePlacement = (placement, errors) => {
  if (!isPlainObject(placement)) {
    errors.push("placement must be an object");
    return;
  }

  const allowedPlacementFields = ["page", "position"];

  Object.keys(placement).forEach((field) => {
    if (!allowedPlacementFields.includes(field)) {
      errors.push(`placement.${field} is not allowed`);
    }
  });

  if (
    placement.page !== undefined &&
    !allowedPages.includes(placement.page)
  ) {
    errors.push("Invalid advertisement page");
  }

  if (
    placement.position !== undefined &&
    !allowedPositions.includes(placement.position)
  ) {
    errors.push("Invalid advertisement position");
  }
};

const validateDevices = (devices, errors) => {
  if (!Array.isArray(devices) || devices.length === 0) {
    errors.push("Select at least one device");
    return;
  }

  if (new Set(devices).size !== devices.length) {
    errors.push("Duplicate devices are not allowed");
  }

  devices.forEach((device) => {
    if (!allowedDevices.includes(device)) {
      errors.push(`Invalid device: ${device}`);
    }
  });
};

const validateDateFields = (data, errors) => {
  ["startAt", "endAt"].forEach((field) => {
    if (
      data[field] !== undefined &&
      !isValidDate(data[field])
    ) {
      errors.push(`${field} must be a valid date`);
    }
  });

  if (
    data.startAt !== undefined &&
    data.endAt !== undefined &&
    isValidDate(data.startAt) &&
    isValidDate(data.endAt) &&
    new Date(data.endAt) <= new Date(data.startAt)
  ) {
    errors.push("End date must be after start date");
  }
};

const validateAdvertisement = (req, res, next, isUpdate) => {
  const data = req.body;
  const errors = [];

  if (!isPlainObject(data)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be an object",
    });
  }

  const unknownFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(
      `Unknown fields: ${unknownFields.join(", ")}`
    );
  }

  if (!isUpdate) {
    const requiredFields = [
      "name",
      "bannerImage",
      "destinationUrl",
      "placement",
      "devices",
      "startAt",
      "endAt",
    ];

    requiredFields.forEach((field) => {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`${field} is required`);
      }
    });
  }

  if (
    data.name !== undefined &&
    !isValidText(data.name, 100)
  ) {
    errors.push("Name must be between 1 and 100 characters");
  }

  if (
    data.bannerImage !== undefined &&
    !isValidImagePath(data.bannerImage)
  ) {
    errors.push("Invalid banner image path");
  }

  if (
    data.destinationUrl !== undefined &&
    !isValidDestinationUrl(data.destinationUrl)
  ) {
    errors.push("Destination URL must be a valid HTTP or HTTPS URL");
  }

  if (data.placement !== undefined) {
    validatePlacement(data.placement, errors);

    if (
      !isUpdate &&
      isPlainObject(data.placement)
    ) {
      if (!data.placement.page) {
        errors.push("placement.page is required");
      }

      if (!data.placement.position) {
        errors.push("placement.position is required");
      }
    }
  }

  if (data.devices !== undefined) {
    validateDevices(data.devices, errors);
  }

  if (
    data.isActive !== undefined &&
    !isValidBoolean(data.isActive)
  ) {
    errors.push("isActive must be a boolean");
  }

  validateDateFields(data, errors);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Advertisement validation failed",
      errors,
    });
  }

  req.validatedData = data;

  next();
};

const validateCreateAdvertisement = (req, res, next) =>
  validateAdvertisement(req, res, next, false);

const validateUpdateAdvertisement = (req, res, next) =>
  validateAdvertisement(req, res, next, true);

module.exports = {
  validateCreateAdvertisement,
  validateUpdateAdvertisement,
};
