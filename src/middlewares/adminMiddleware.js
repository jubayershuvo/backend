import jwt from 'jsonwebtoken';

import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from './../models/userModel.js';
import { access_token_secret_key } from '../constans.js';
import { ApiError } from '../utils/apiError.js';

export const verifyAdminJWT = asyncHandler(async (req, res, next)=>{
    try {
        const Token = req.cookies?.adminAccessToken || req.header('Authorization')?.replace('Bearer','');
        if(!Token){
            throw new ApiError(401, 'Unauthorized user, please login first...!')
        }
    
        const decoded = jwt.verify(Token, access_token_secret_key);
        const admin = await User.findById(decoded._id).select('-password');
        if(!admin){
            throw new ApiError(401, 'Session expired..!')
        }
        if(!decoded.isAdmin){
            throw new ApiError(401, 'You are not an admin..!')
        }
    
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
})