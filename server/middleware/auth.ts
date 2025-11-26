import { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    [key: string]: any;
  };
}

export const authenticateSupabase = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure Supabase is properly configured - no bypass allowed
    if (!supabaseAuth) {
      return res.status(500).json({
        error: 'Authentication service unavailable',
        message: 'Supabase authentication is not properly configured'
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add user to request object
    req.user = {
      id: user.id, // Keep as UUID string for RLS policy matching
      email: user.email!,
      ...user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
