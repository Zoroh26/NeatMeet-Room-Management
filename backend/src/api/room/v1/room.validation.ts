import { body } from 'express-validator';

// Validation for creating a room
export const createRoomValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Room name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Room name must be between 2 and 100 characters'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),

  body('capacity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be a number between 1 and 1000'),

  body('status')
    .optional()
    .isIn(['available', 'occupied', 'maintenance', 'unavailable'])
    .withMessage('Status must be one of: available, occupied, maintenance, unavailable'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each amenity must be between 1 and 50 characters')
];

// Validation middleware to handle validation errors
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  
  next();
};
