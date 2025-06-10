import { Request, Response, NextFunction } from 'express';

const AUTH_TOKEN = 'Password123';

export function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res
			.status(401)
			.json({ error: 'No authorization header provided' });
	}

	// Check if the header is in the format "Bearer <token>"
	const [bearer, token] = authHeader.split(' ');

	if (bearer !== 'Bearer' || !token) {
		return res
			.status(401)
			.json({ error: 'Invalid authorization header format' });
	}

	if (token !== AUTH_TOKEN) {
		return res.status(403).json({ error: 'Invalid authentication token' });
	}

	next();
}
