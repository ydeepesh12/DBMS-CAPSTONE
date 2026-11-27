const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Zod Validation Error -> 400
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Input validation failed',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  // MySQL SIGNAL SQLSTATE '45000' (Custom business logic failure from Stored Procedures/Triggers)
  if (err.sqlState === '45000' || err.errno === 1644) {
    const msg = err.sqlMessage || err.message;
    // Map specific business conflicts to 409, validations to 422
    const status = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('conflict') ? 409 : 422;
    return res.status(status).json({
      success: false,
      error: msg
    });
  }

  // MySQL Duplicate Key Error (errno 1062) -> 409 Conflict
  if (err.errno === 1062) {
    return res.status(409).json({
      success: false,
      error: 'A duplicate record already exists: ' + (err.sqlMessage || err.message)
    });
  }

  // MySQL Foreign Key Constraint Violation (errno 1452) -> 400
  if (err.errno === 1452) {
    return res.status(400).json({
      success: false,
      error: 'Referenced entity not found in master records.'
    });
  }

  // Generic or unexpected error
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
}

module.exports = {
  errorHandler
};
