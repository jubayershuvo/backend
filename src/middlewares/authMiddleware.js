import jwt from 'jsonwebtoken';
import { access_token_secret_key } from '../constans.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/userModel.js';


export const verifyJWT = asyncHandler(async (req, res, next)=>{
    try {
        const Token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer','');
        if(!Token){
            throw new ApiError(401, 'Unauthorized user...!')
        }
    
        const decoded = jwt.verify(Token, access_token_secret_key);
        const user = await User.findById(decoded._id).select('-password -refreshToken');
        if(!user){
            throw new ApiError(401, 'Invalid access token')
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, 'Invalid access token')
    }
})