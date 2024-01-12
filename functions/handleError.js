exports = function(error = "internal_server_error", message = "Error inteno del servidor", statusCode = 500){
  throw new APIError(error, message, statusCode);
};

class APIError extends Error {
  constructor (error, message, statusCode) {
    super(message);
    this.error = error;
    this.statusCode = statusCode;
  }
}