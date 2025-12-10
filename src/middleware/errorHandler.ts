import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
  method?: string;
}

class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('already in your list')) {
    statusCode = 409;
    message = err.message;
  } else if (err.message.includes('Item not found')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('required')) {
    statusCode = 400;
    message = err.message;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  res.status(statusCode).json(errorResponse);
};

export { AppError };
