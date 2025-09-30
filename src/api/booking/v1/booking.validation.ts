import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateCreateBooking = [
  body('room_id')
    .notEmpty()
    .withMessage('Room ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid room ID format');
      }
      return true;
    }),

  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),

  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Purpose must be between 1 and 200 characters'),

  handleValidationErrors
];

export const validateUpdateBooking = [
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),

  body('purpose')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Purpose must be between 1 and 200 characters'),

  body('status')
    .optional()
    .isIn(['scheduled', 'cancelled'])
    .withMessage('Status must be either scheduled or cancelled'),

  // Ensure at least one field is being updated
  body()
    .custom((value, { req }) => {
      const allowedFields = ['start_time', 'end_time', 'purpose', 'status'];
      const hasValidField = allowedFields.some(field => req.body[field] !== undefined);
      
      if (!hasValidField) {
        throw new Error('At least one field must be provided for update');
      }
      
      return true;
    }),

  handleValidationErrors
];
