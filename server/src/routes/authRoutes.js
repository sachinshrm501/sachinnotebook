import express from 'express';
import AuthService from '../services/authService.js';
import { validateToken } from '../middleware/auth.js';

const router = express.Router();
const authService = new AuthService();

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Username, email, password, first name, and last name are required'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password too short',
                message: 'Password must be at least 8 characters long'
            });
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                error: 'Invalid username format',
                message: 'Username can only contain letters, numbers, and underscores'
            });
        }

        const userData = {
            username,
            email,
            password,
            firstName,
            lastName
        };

        const result = await authService.registerUser(userData);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: result.message,
                user: result.user,
                tokens: result.tokens
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                details: result.details || null
            });
        }
    } catch (error) {
        console.error('Registration route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Registration failed due to server error'
        });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate required fields
        if (!identifier || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Username/email and password are required'
            });
        }

        const result = await authService.authenticateUser(identifier, password);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: result.user,
                tokens: result.tokens
            });
        } else {
            res.status(401).json({
                success: false,
                error: result.error,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Login failed due to server error'
        });
    }
});

// Refresh Access Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token required',
                message: 'Please provide a refresh token'
            });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: result.accessToken,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
                error: result.error,
                message: 'Token refresh failed'
            });
        }
    } catch (error) {
        console.error('Token refresh route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Token refresh failed due to server error'
        });
    }
});

// Get Current User Profile (Protected Route)
router.get('/profile', validateToken, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        res.status(200).json({
            success: true,
            user: user.getProfile()
        });
    } catch (error) {
        console.error('Get profile route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve user profile'
        });
    }
});

// Update User Profile (Protected Route)
router.put('/profile', validateToken, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const { firstName, lastName, preferences } = req.body;

        // Validate update data
        if (!firstName && !lastName && !preferences) {
            return res.status(400).json({
                error: 'No update data provided',
                message: 'Please provide data to update'
            });
        }

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (preferences) updateData.preferences = { ...preferences };

        const user = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getProfile()
        });
    } catch (error) {
        console.error('Update profile route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to update user profile'
        });
    }
});

// Change Password (Protected Route)
router.put('/change-password', validateToken, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Missing password fields',
                message: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Password too short',
                message: 'New password must be at least 8 characters long'
            });
        }

        const user = await User.findById(req.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User profile not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid current password',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to change password'
        });
    }
});

// Logout (Client-side token removal)
router.post('/logout', (req, res) => {
    // Since we're using JWT, logout is handled client-side by removing tokens
    // This endpoint can be used for logging purposes or future server-side token blacklisting
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString()
    });
});

export default router;
