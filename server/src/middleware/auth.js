import AuthService from '../services/authService.js';

const authService = new AuthService();

// Validate JWT token middleware
export const validateToken = (req, res, next) => {
    return authService.validateToken(req, res, next);
};

// Optional token validation middleware (for public endpoints that can work with or without auth)
export const optionalTokenValidation = (req, res, next) => {
    return authService.optionalTokenValidation(req, res, next);
};

// Role-based access control middleware
export const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please provide a valid access token'
                });
            }

            const User = (await import('../models/User.js')).default;
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile not found'
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    error: 'Account deactivated',
                    message: 'Your account has been deactivated'
                });
            }

            // Check if user has required role
            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'You do not have permission to access this resource'
                });
            }

            // Add user to request for use in route handlers
            req.user = user;
            next();
        } catch (error) {
            console.error('Role validation error:', error);
            return res.status(500).json({
                error: 'Role validation failed',
                message: 'Unable to validate user role'
            });
        }
    };
};

// Admin-only access middleware
export const requireAdmin = requireRole(['admin']);

// User-only access middleware
export const requireUser = requireRole(['user', 'admin']);

// Rate limiting middleware for authentication endpoints
export const authRateLimit = (req, res, next) => {
    // Simple rate limiting for auth endpoints
    // In production, use a proper rate limiting library like express-rate-limit
    
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Store rate limit data in memory (in production, use Redis)
    if (!req.app.locals.authRateLimit) {
        req.app.locals.authRateLimit = new Map();
    }
    
    const rateLimitData = req.app.locals.authRateLimit.get(clientIP) || { count: 0, resetTime: now + 60000 };
    
    // Reset counter if 1 minute has passed
    if (now > rateLimitData.resetTime) {
        rateLimitData.count = 0;
        rateLimitData.resetTime = now + 60000;
    }
    
    // Check rate limit (max 5 requests per minute for auth endpoints)
    if (rateLimitData.count >= 5) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
        });
    }
    
    // Increment counter
    rateLimitData.count++;
    req.app.locals.authRateLimit.set(clientIP, rateLimitData);
    
    next();
};

// Validate user ownership middleware (for user-specific resources)
export const validateUserOwnership = (resourceUserIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please provide a valid access token'
                });
            }

            // Check if the resource belongs to the authenticated user
            const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField] || req.query[resourceUserIdField];
            
            if (resourceUserId && resourceUserId !== req.userId.toString()) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only access your own resources'
                });
            }

            next();
        } catch (error) {
            console.error('User ownership validation error:', error);
            return res.status(500).json({
                error: 'Ownership validation failed',
                message: 'Unable to validate resource ownership'
            });
        }
    };
};

// Log authentication attempts middleware
export const logAuthAttempts = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const timestamp = new Date().toISOString();
    
    console.log(`🔐 Auth attempt - IP: ${clientIP}, Endpoint: ${req.path}, Time: ${timestamp}, User-Agent: ${userAgent}`);
    
    next();
};

// Validate password strength middleware
export const validatePasswordStrength = (req, res, next) => {
    const { password } = req.body;
    
    if (!password) {
        return next(); // No password to validate
    }
    
    // Password strength requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Password too weak',
            message: 'Password does not meet security requirements',
            details: errors
        });
    }
    
    next();
};

export default {
    validateToken,
    optionalTokenValidation,
    requireRole,
    requireAdmin,
    requireUser,
    authRateLimit,
    validateUserOwnership,
    logAuthAttempts,
    validatePasswordStrength
};
