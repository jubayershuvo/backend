import jwt from 'jsonwebtoken';
import { access_token_secret_key } from '../constans.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/userModel.js';


export const verifyJWT = asyncHandler(async (req, res, next)=>{
    try {
        const Token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer','');
        if(!Token){
            throw new ApiError(401, 'Unauthorized user, please login first...!')
        }
    
        const decoded = jwt.verify(Token, access_token_secret_key);
        const user = await User.findById(decoded._id).select('-password -refreshToken');
        if(!user){
            throw new ApiError(401, 'Session expired..!')
        }
    
        req.user = user;
        next();
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
})