import { Request, Response, NextFunction } from 'express';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get admin token from request headers
  const adminToken = req.headers['x-admin-token'];
  
  // Check if the token matches the expected value
  // In a production environment, this would use a more secure method
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'jalwa-admin-2023';
  
  if (!adminToken || adminToken !== ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access to admin resource'
    });
  }
  
  // Authentication successful, proceed
  next();
};