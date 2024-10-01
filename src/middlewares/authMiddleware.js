import jwt from 'jsonwebtoken';
import { access_token_secret_key } from '../constans.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/userModel.js';


export const verifyJWT = asyncHandler(async (req, res, next)=>{
    try {
        const Token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer','').trim();
        if(!Token){
            throw new ApiError(401, 'Unauthorized user, please login first...!')
        }
    
        const decoded = jwt.verify(Token, access_token_secret_key);
        const user = await User.findById(decoded._id).select('-password');
        if(!user){
            throw new ApiError(401, 'Session expired..!')
        }
    
        if(user.isBanned){
            req.user = {};
            res.clearCookie('accessToken').clearCookie('refreshToken')
            throw new ApiError(401, 'Your account was banned..!')
        }
    
        req.user = user;
        next();
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
})

export const isBanned = asyncHandler(async (req, res, next)=>{
    try {
        const {_id} = req.user;
        if(!_id){
            throw new ApiError(401, 'Unauthorized user, please login first...!');
        }

        const user = User.findOne({_id});
        if(!user){
            throw new ApiError(401, 'User not found...!')
        }

        if(user.isBanned){
            throw new ApiError(401, 'Account banned...!')
        }
        next();

    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }

})