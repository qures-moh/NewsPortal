
const validate = (schemas) => {
  return (req, res, next) => {
    const validatedData = {};
    const errors = [];

    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    for (const [key, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(requestData[key]);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors.push({
            field: `${key}.${issue.path.join(".")}`,
            message: issue.message,
          });
        });
      } else {
        validatedData[key] = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Store validated data separately.
    // Do not overwrite Express request properties.
    req.validated = validatedData;

    next();
  };
};

module.exports = validate;
