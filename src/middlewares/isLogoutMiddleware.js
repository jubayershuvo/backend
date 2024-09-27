import jwt from 'jsonwebtoken';
import { access_token_secret_key } from '../constans.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/apiError.js';


export const isLogouted = asyncHandler(async (req, res, next)=>{
        try {
            const Token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer','');
                if(Token){
                    const decoded = jwt.verify(Token, access_token_secret_key);
                const user = await User.findById(decoded._id).select('-password -refreshToken');
                if(user){
                    throw new ApiError(400, 'User already logged in..!')
                }
            next()
            }
            next();
        } catch (error) {
            return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
        }
});