// basic error handling middleware for payments feature
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
