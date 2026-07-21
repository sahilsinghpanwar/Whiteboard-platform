class ApiResponse {
  constructor(statusCode, param2 = "Success", param3 = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;

    if (typeof param2 === "string" && (param3 === null || typeof param3 !== "string")) {
      this.message = param2;
      this.data = param3;
    } else {
      this.data = param2;
      this.message = typeof param3 === "string" ? param3 : "Success";
    }
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

export { ApiResponse };
export default ApiResponse;