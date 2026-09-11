import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-Order Function to wrap async Express route handlers / controller actions.
 * Automatically catches any rejected Promises and forwards the error to error-handling middleware.
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
