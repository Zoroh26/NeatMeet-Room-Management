import {Request,Response,NextFunction} from 'express'
import { authService } from '../api/auth/v1/auth.services'

export const authenticateToken = async (req:Request , res:Response, next:NextFunction)=>{
    try{
        // Safe token extraction
        const cookieToken = req.cookies?.token;
        const headerToken = req.headers.authorization?.split(' ')[1];
        const token = cookieToken || headerToken;

        if(!token){
            return res.status(401).json({
                success:false,
                message:"Access token required"
            })
        }
        
        const payload = authService.verifyToken(token);

        (req as any).user = payload;
        next();
    }catch(error:any){
        return res.status(401).json({
            success:false,
            message:"Invalid or expired token"
        })
    }
}

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).user?.role;

        // Check if user is authenticated first
        if (!(req as any).user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden access"
            });
        }
        
        next();
    }
}
