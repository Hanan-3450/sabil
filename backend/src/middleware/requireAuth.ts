import type { Request, Response, NextFunction } from "express"; 
import jwt from "jsonwebtoken";


export interface AuthRequest extends Request { userId?: string;}

const JWT_SECRET = process.env.JWT_SECRET || "dev_fallback_change_me";

export function signAuthToken(userId: string): string {
    return jwt.sign({ sub: userId}, JWT_SECRET, { expiresIn: "30d"});

}

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next : NextFunction
) {
    const authHeader = req.headers.authorization;
    const bearerToken = 
         authHeader && authHeader.startsWith("Bearer")
         ? authHeader.slice(7).trim()
         : null;

        const token = bearerToken || req.cookies?.sabil_token;

        if (!token) {
            res.status(401).json( {error: "Authentication required"});
            return;
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
            if (!payload.sub) {
                res.status(401).json( {error: "Invalid token"});
                return;

            }
            req.userId = payload.sub;
            next();
        } catch  {
            res.status(401).json({ error: "Session expired or invalid" });
        }
}