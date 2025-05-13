import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { accountVerificationResponseSchema } from "@shared/schema";
import { adminAuthMiddleware } from "./middleware/adminAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate Jalwa User ID endpoint
  app.post('/api/verify-account', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        jalwaUserId: z.string().min(1).max(50),
      });
      
      const { jalwaUserId } = schema.parse(req.body);
      
      // Check if the user ID is verified
      const result = await storage.verifyJalwaAccount(jalwaUserId);
      
      // Log verification request (removed Telegram notification)
      if (result.success && result.status === 'pending') {
        console.log('🔔 New verification request received for User ID:', jalwaUserId);
      } else {
        console.log('ℹ️ Verification request with status:', result.status);
      }
      
      // Return the verification result
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      // Handle zod validation errors
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: validationError.message,
          isVerified: false
        });
      }
      
      // Handle other errors
      console.error('Account verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during account verification',
        isVerified: false
      });
    }
  });
  
  // Get Jalwa registration link
  app.get('/api/registration-link', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: 'Use this link to register a new Jalwa account',
      data: {
        registrationUrl: 'https://www.jalwa.vip/#/register?invitationCode=327361287589',
        telegramSupport: '@Bongjayanta2'
      }
    });
  });
  
  // Get all account verifications (admin only)
  app.get('/api/admin/account-verifications', adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const verifications = await storage.getAllAccountVerifications();
      return res.status(200).json({
        success: true,
        data: verifications
      });
    } catch (error) {
      console.error('Failed to get account verifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get account verifications'
      });
    }
  });
  
  // Get account verifications by status (admin only)
  app.get('/api/admin/account-verifications/status/:status', adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, approved, rejected'
        });
      }
      
      const verifications = await storage.getAccountVerificationsByStatus(status);
      return res.status(200).json({
        success: true,
        data: verifications
      });
    } catch (error) {
      console.error(`Failed to get ${req.params.status} account verifications:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to get ${req.params.status} account verifications`
      });
    }
  });
  
  // Handler for verification updates
  const handleVerificationUpdate = async (req: Request, res: Response) => {
    try {
      // Regular API call - validate request body
      const schema = z.object({
        status: z.enum(['pending', 'approved', 'rejected']),
        notes: z.string().optional()
      });
      
      const validatedData = schema.parse(req.body);
      const status = validatedData.status;
      const notes = validatedData.notes;
      
      const { id } = req.params;
      
      const updated = await storage.updateAccountVerificationStatus(
        parseInt(id, 10),
        status,
        notes
      );
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Account verification not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Account verification ${status}`,
        data: updated
      });
    } catch (error) {
      // Handle zod validation errors
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          message: validationError.message
        });
      }
      
      console.error('Failed to update account verification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update account verification'
      });
    }
  };
  
  // Register the handler for verification updates
  app.post('/api/admin/account-verifications/:id', handleVerificationUpdate);

  const httpServer = createServer(app);

  return httpServer;
}