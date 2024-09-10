

import jwt from 'jsonwebtoken';

import { User } from './../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { refresh_token_secret_key } from '../constans.js';

const genAdminAccessAndRefreshToken = async (userId)=>{
  
        const user = await User.findById(userId);
        const adminAccessToken = user.generateAccessToken()
        const adminRefreshToken = user.generateRefreshToken()

        user.adminRefreshToken = adminRefreshToken;
        await user.save({validateBeforeSave:false});

        return {adminAccessToken,adminRefreshToken}
};

export const loginAdmin = asyncHandler(async (req, res)=>{
    const {username, email, password} = req.body;
    try {
        if(!username && !email){
            throw new ApiError(400, 'Username or Email is required...!')
        }
    
        const user = await User.findOne({$or:[{username},{email}]});
    
        if(!user){
            throw new ApiError(404, 'User not found...!');
        }

        
        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401, 'Wrong password...!');
        }
        if(!user.isAdmin){
            throw new ApiError(401, 'You are not an admin...!');
        }
    
    
        const {adminAccessToken, adminRefreshToken} = await genAdminAccessAndRefreshToken(user._id);
    
        const loggedUser = await User.findById(user._id).select('-password');
    
            const options = {
                httpOnly: true,
                secure:true
            }
    
            return res.status(200)
            .cookie('adminAccessToken', adminAccessToken, options)
            .cookie('adminRefreshToken', adminRefreshToken ,options)
            .json(new ApiResponse(200, 'Admin logged In successfully', {
                Admin: loggedUser,
                adminAccessToken,
                adminRefreshToken
            }));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }



});

export const logoutAdmin = asyncHandler(async (req, res)=>{
    const _id = req.admin._id;

    const loggedOutUser = await User.findOne({_id});
    if(!loggedOutUser){
        throw new ApiError(404, 'Logout faild..!')
    }
    req.admin = {};
    return res.status(200)
    .clearCookie('adminAccessToken')
    .clearCookie('adminRefreshToken')
    .json(new ApiResponse(200, `Admin logged out successfully..!`));
});

export const refreshAdminAccessToken =  asyncHandler(async (req, res)=>{
    try {
        const savedAdminRefreshToken = req.cookies.adminRefreshToken || req.body.adminRefreshToken;

        if(!savedAdminRefreshToken){
            throw new ApiError(404, 'Login again..!')
        }

        const decoded = jwt.verify(savedAdminRefreshToken, refresh_token_secret_key);
        if(!decoded){
            throw new ApiError(404, 'Login Expired...!')
        }
        const admin = await User.findById(decoded._id);
        
        if(!admin){
            throw new ApiError(404, 'Login Expired...!')
        }
        
        if(savedAdminRefreshToken !== admin.adminRefreshToken){
            throw new ApiError(404, 'Login Expired...!')
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {adminAccessToken, adminRefreshToken} = await genAdminAccessAndRefreshToken(admin._id);
    
        return res.status(200)
        .cookie('adminAccessToken', adminAccessToken, options)
        .cookie('adminRefreshToken', adminRefreshToken, options)
        .json( new ApiResponse(200,'Token refreshed', {adminAccessToken,adminRefreshToken},))
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }

});

export const currentAdmin = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')
            
        }
    
        return res.status(200).json(new ApiResponse(200, 'User is returned', admin));
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const banUser = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')            
        }
        
        
        
        const {username} = req.params;
        if(!username){
            throw new ApiError(400, 'Provide an usernamme..!')            
        }
        const user = await User.findOne({username});
        if(!user){
            throw new ApiError(400, 'User Not found..!')
        }
        
        if(user.isAdmin){
            throw new ApiError(400, 'You can not ban an admin..!')
        }
        if(user.isBanned){
            throw new ApiError(400, 'User already banned..!')
        }

        user.isBanned = true;
        user.save({validateBeforeSave:false})

    
        return res.status(200).json(new ApiResponse(200, 'User banned...!', user));
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const unbanUser = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')            
        }
        
        
        
        const {username} = req.params;
        if(!username){
            throw new ApiError(400, 'Provide an usernamme..!')            
        }
        const user = await User.findOne({username});
        if(!user){
            throw new ApiError(400, 'User Not found..!');
        }
        
        if(!user.isBanned){
            throw new ApiError(400, 'User already unbanned..!');
        }

        user.isBanned = false;
        user.save({validateBeforeSave:false})

    
        return res.status(200).json(new ApiResponse(200, 'User unbanned...!', user));
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const allUsers = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')            
        }
        
        const users = await User.find({isAdmin:false, isOwner:false});
        if(!users){
            throw new ApiError(400, 'Users Not found..!')
        }
    
        return res.status(200).json(new ApiResponse(200, 'User banned...!', users));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const allBannedUsers = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')            
        }
        
        const users = await User.find({isAdmin:false, isBanned:true, isOwner:false});
        if(!users){
            throw new ApiError(400, 'Users Not found..!')
        }
    
        return res.status(200).json(new ApiResponse(200, 'All banned users...!', users));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message});
    }
});

export const allUnbannedUsers = asyncHandler(async (req, res)=>{

    try {
        const admin = req.admin;
        if(!admin){
            throw new ApiError(400, 'Please login first..!')            
        }
        
        const users = await User.find({isAdmin:false, isBanned:false, isOwner:false});
        if(!users){
            throw new ApiError(400, 'Users Not found..!')
        }
    
        return res.status(200).json(new ApiResponse(200, 'All the fresh users...!', users));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message});
    }
});




