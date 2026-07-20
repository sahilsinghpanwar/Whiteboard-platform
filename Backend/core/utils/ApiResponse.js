class ApiResponse {
  constructor(statusCode, message = "Success", data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }


  static ok(res, message = "Success", data = null) {
    return new ApiResponse(200, message, data).send(res);
  }

  static created(res, message = "Created successfully", data = null) {
    return new ApiResponse(201, message, data).send(res);
  }

  static noContent(res, message = "Deleted successfully") {
    return new ApiResponse(204, message, null).send(res);
  }
}

export default ApiResponse;