import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  if (!schema) return next();

  // Direct Zod schema (defaults to validating req.body)
  if (typeof schema.safeParse === "function") {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return next(ApiError.badRequest("Validation failed", errors));
    }
    req.body = result.data;
    return next();
  }

  // Target object containing params, query, or body Zod schemas
  for (const target of ["params", "query", "body"]) {
    if (schema[target] && typeof schema[target].safeParse === "function") {
      const result = schema[target].safeParse(req[target]);
      if (!result.success) {
        const errors = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        return next(ApiError.badRequest("Validation failed", errors));
      }
      req[target] = result.data;
    }
  }

  next();
};

export { validate };
export default validate;

