
const allowedFields = ["name", "slug", "description"];

const isValidText = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;

const isValidSlug = (value) =>
  typeof value === "string" &&
  value.length <= 120 &&
  /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value);

const validateLocalizedField = (
  value,
  field,
  required = true
) => {
  const errors = [];

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return required
      ? [`${field} must contain English and Hindi values`]
      : [];
  }

  const allowedLanguages = ["en", "hi"];

  const unknownLanguages = Object.keys(value).filter(
    (language) => !allowedLanguages.includes(language)
  );

  if (unknownLanguages.length) {
    errors.push(`Unsupported languages in ${field}`);
  }

  for (const language of allowedLanguages) {
    const item = value[language];

    if (item === undefined && !required) continue;

    if (field === "name" && !isValidText(item, 2, 60)) {
      errors.push(
        `${language} name must be between 2 and 60 characters`
      );
    }

    if (field === "slug" && !isValidSlug(item)) {
      errors.push(`Invalid ${language} slug`);
    }

    if (
      field === "description" &&
      item !== "" &&
      !isValidText(item, 1, 300)
    ) {
      errors.push(
        `${language} description must not exceed 300 characters`
      );
    }
  }

  return errors;
};

const validateTagData = (body, isUpdate = false) => {
  const errors = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (isUpdate && Object.keys(body).length === 0) {
    errors.push("At least one field is required");
  }

  if (!isUpdate || body.name !== undefined) {
    errors.push(
      ...validateLocalizedField(body.name, "name")
    );
  }

  if (!isUpdate || body.slug !== undefined) {
    errors.push(
      ...validateLocalizedField(body.slug, "slug")
    );
  }

  if (body.description !== undefined) {
    errors.push(
      ...validateLocalizedField(
        body.description,
        "description",
        false
      )
    );
  }

  return errors;
};

const validateTag = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateTagData(body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Tag validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

const validateTagUpdate = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  const errors = validateTagData(body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Tag update validation failed",
      errors,
    });
  }

  req.validatedData = body;
  next();
};

module.exports = {
  validateTag,
  validateTagUpdate,
};
