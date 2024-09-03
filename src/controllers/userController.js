
import { refresh_token_secret_key } from '../constans.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from './../models/userModel.js';
import jwt from 'jsonwebtoken';

const genAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, 'Somthing went wrong..!');
    }
};

export const registerUser = asyncHandler( async (req, res) =>{
    const {fullname, email, username, password} = req.body;

    if([fullname, email, username, password].some((field) => field?.trim() === '')){
        throw new ApiError(400, 'All field is required...!')
    }

    const userExist = await User.findOne({
        $or:[{username}, {email}]
    });
    if(userExist){
        throw new ApiError(409, 'Username or email already exists..!')
    }

    const avatarLocalPath  = req.files?.avatar[0]?.path;
    let coverImgLocalPath;
    if(req.files && Array.isArray(req.files.coverImg)){
        coverImgLocalPath = req.files.coverImg[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, 'Avatar is required...!')
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImg = await uploadOnCloudinary(coverImgLocalPath);

    
    if(!avatar){
        throw new ApiError(400, 'Avatar upload faild...!')
    }
    
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImg: coverImg?.url || '',
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase()
    });
    const createdUser = await User.findById(user._id).select("-password -watchHistry -refreshToken");
    if(!createdUser){
        throw new ApiError(500, 'Register faild...!')
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User created successfully....!')
    )
});

export const loginUser = asyncHandler(async (req, res)=>{
    const {username, email, password} = req.body;
    if(!username && !email){
        throw new ApiError(400, 'Username or Email is required...!')
    }

    const user = await User.findOne({$or:[{username},{email}]});

    if(!user){
        throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, 'Wrong password...!');
    }


    const {accessToken, refreshToken} = await genAccessAndRefreshToken(user._id);

    const loggedUser = await User.findById(user._id).select('-password -refreshToken');

        const options = {
            httpOnly: true,
            secure:true
        }

        return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken ,options)
        .json(new ApiResponse(200, {
            user: loggedUser,
            accessToken,
            refreshToken
        }, 'User logged In successfully'));



});

export const logoutUser = asyncHandler(async (req, res)=>{
    const id = req.user._id;

    const loggedOutUser = await User.findOneAndUpdate(id,{$set:{refreshToken: undefined}},{new:true});
    if(!loggedOutUser){
        throw new ApiError(404, 'Logout faild')
    }

    const options = {
        httpOnly: true,
        secure:true
    }

    return res.status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, `User logged out successfully..!`));
});

export const refreshAccessToken =  asyncHandler(async (req, res)=>{
    const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!userRefreshToken){
        throw new ApiError(404, 'Login again..!')
    }

    try {
        const decoded = jwt.verify(userRefreshToken, refresh_token_secret_key);
        if(!decoded){
            throw new ApiError(404, 'Login Expired...!')
        }
        const user = await User.findById(decoded._id);
        
        if(!user){
            throw new ApiError(404, 'Login Expired...!')
        }
        
        if(userRefreshToken !== user.refreshToken){
            throw new ApiError(404, 'Login Expired...!')
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {accessToken, refreshToken} = await genAccessAndRefreshToken(user._id);
    
        return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(ApiResponse(200,{accessToken,refreshToken},'Token refreshed'))
    } catch (error) {
        throw new ApiError(500, 'Server error')
    }

})