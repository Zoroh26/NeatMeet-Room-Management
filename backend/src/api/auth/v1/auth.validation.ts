// Create: backend/src/api/auth/v1/auth.validation.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

// Login validation
export const validateLogin = [
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Register validation
export const validateRegister = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces')
        .trim(),

    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
        .withMessage('Password must contain at least one letter and one number'),

    body('designation')
        .notEmpty()
        .withMessage('Designation is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Designation must be between 2 and 100 characters')
        .trim(),

    body('role')
        .optional()
        .isIn(['admin', 'employee', 'manager'])
        .withMessage('Role must be either admin, employee, or manager'),

    handleValidationErrors
];