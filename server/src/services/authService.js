import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'; // 7 days
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; // 30 days
    }

    // Generate JWT token
    generateToken(userId, type = 'access') {
        const payload = {
            userId,
            type,
            iat: Math.floor(Date.now() / 1000)
        };

        const expiresIn = type === 'access' ? this.jwtExpiresIn : this.refreshTokenExpiresIn;
        
        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    // Generate both access and refresh tokens
    generateTokens(userId) {
        return {
            accessToken: this.generateToken(userId, 'access'),
            refreshToken: this.generateToken(userId, 'refresh')
        };
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Authenticate user with email/username and password
    async authenticateUser(identifier, password) {
        try {
            // Find user by email or username
            const user = await User.findOne({
                $or: [
                    { email: identifier.toLowerCase() },
                    { username: identifier }
                ]
            }).select('+password'); // Include password for comparison

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }

            // Check if user is active
            if (!user.isActive) {
                return {
                    success: false,
                    error: 'Account is deactivated'
                };
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }

            // Update last login
            await user.updateLastLogin();

            // Generate tokens
            const tokens = this.generateTokens(user._id);

            return {
                success: true,
                user: user.getProfile(),
                tokens
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed'
            };
        }
    }

    // Register new user
    async registerUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email: userData.email.toLowerCase() },
                    { username: userData.username }
                ]
            });

            if (existingUser) {
                if (existingUser.email === userData.email.toLowerCase()) {
                    return {
                        success: false,
                        error: 'Email already registered'
                    };
                }
                if (existingUser.username === userData.username) {
                    return {
                        success: false,
                        error: 'Username already taken'
                    };
                }
            }

            // Create new user
            const newUser = new User(userData);
            await newUser.save();

            // Generate tokens
            const tokens = this.generateTokens(newUser._id);

            return {
                success: true,
                user: newUser.getProfile(),
                tokens,
                message: 'User registered successfully'
            };
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validationErrors
                };
            }

            return {
                success: false,
                error: 'Registration failed'
            };
        }
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            const { valid, decoded } = this.verifyToken(refreshToken);
            
            if (!valid || decoded.type !== 'refresh') {
                return {
                    success: false,
                    error: 'Invalid refresh token'
                };
            }

            // Check if user still exists
            const user = await User.findById(decoded.userId);
            if (!user || !user.isActive) {
                return {
                    success: false,
                    error: 'User not found or inactive'
                };
            }

            // Generate new access token
            const newAccessToken = this.generateToken(user._id, 'access');

            return {
                success: true,
                accessToken: newAccessToken,
                user: user.getProfile()
            };
        } catch (error) {
            console.error('Token refresh error:', error);
            return {
                success: false,
                error: 'Token refresh failed'
            };
        }
    }

    // Get user from token
    async getUserFromToken(token) {
        try {
            const { valid, decoded } = this.verifyToken(token);
            
            if (!valid || decoded.type !== 'access') {
                return null;
            }

            const user = await User.findById(decoded.userId);
            return user && user.isActive ? user : null;
        } catch (error) {
            console.error('Get user from token error:', error);
            return null;
        }
    }

    // Validate token middleware
    validateToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Access token required',
                    message: 'Please provide a valid access token'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const { valid, decoded } = this.verifyToken(token);

            if (!valid || decoded.type !== 'access') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'Access token is invalid or expired'
                });
            }

            // Add user ID to request
            req.userId = decoded.userId;
            next();
        } catch (error) {
            console.error('Token validation error:', error);
            return res.status(401).json({
                error: 'Token validation failed',
                message: 'Unable to validate access token'
            });
        }
    }

    // Optional token validation (for public endpoints that can work with or without auth)
    optionalTokenValidation(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const { valid, decoded } = this.verifyToken(token);

                if (valid && decoded.type === 'access') {
                    req.userId = decoded.userId;
                }
            }

            next();
        } catch (error) {
            // Continue without authentication
            next();
        }
    }
}

export default AuthService;
