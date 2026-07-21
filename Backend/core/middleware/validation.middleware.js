import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  // Support both schema passed directly or schema object like { body: schema }
  const schemaToParse = schema.body || schema;
  const dataToParse = schema.body ? req.body : req.body;

  const result = schemaToParse.safeParse(dataToParse);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return next(ApiError.badRequest("Validation failed", errors));
  }
  req.body = result.data;
  next();
};

export { validate };
export default validate;
