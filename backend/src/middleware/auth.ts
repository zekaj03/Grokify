/**
 * Auth Middleware
 *
 * Verifies JWT tokens issued after Shopify OAuth.
 * Every protected API route goes through this.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import db, { shopQueries, type ShopRow } from '../db/index.js';

export interface AuthenticatedRequest extends Request {
  shop: ShopRow;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { shopDomain: string };
    const shop = shopQueries.findByDomain.get(payload.shopDomain);

    if (!shop || !shop.is_active) {
      res.status(401).json({ error: 'Shop not found or inactive' });
      return;
    }

    (req as AuthenticatedRequest).shop = shop;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function issueToken(shopDomain: string): string {
  return jwt.sign({ shopDomain }, config.jwtSecret, { expiresIn: '30d' });
}
