export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized authentication failed', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden: insufficient permissions', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict: operation cannot be completed', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', errorCode: string = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
  }
}
