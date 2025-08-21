import {Request,Response,NextFunction} from 'express';
import {body,validationResult} from 'express-validator';

export const handleValidationErrors=(req:Request,res:Response,next:NextFunction)=>{
    const errors =validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            success:false,
            message:"Validation failed",
            errors:errors.array()
        })
    }
    next();
}


export const validateCreateUser=[
    body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({min:2,max:50})
    .withMessage('Name must be between 2 and 50 characters'),

    body('email')
    .isEmail()
    
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

    body('password')
    .isLength({min:6})
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
    .optional()
    .isIn(['admin','employee'])
    .withMessage('Role must be either admin or employee'),

    body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required')
    .isLength({min:2,max:100})
    .withMessage('Designation must be between 2 and 100 characters'),

    handleValidationErrors

];