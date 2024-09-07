
import mongoose from 'mongoose';
import { refresh_token_secret_key } from '../constans.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import deleteCloudinaryImg from '../utils/cloudinaryImgDelete.js';
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
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
};

export const registerUser = asyncHandler( async (req, res) =>{
    const {fullname, email, username, password} = req.body;

    try {
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
        if(password.length < 6){
    
            throw new ApiError(400, 'Password too short...!')
        }
    
        if(!avatarLocalPath){
            throw new ApiError(400, 'Avatar is required...!')
        }
        
        const avatar = await uploadOnCloudinary(avatarLocalPath, `Users_images/${username}`, "avatar");
        const coverImg = await uploadOnCloudinary(coverImgLocalPath, `Users_images/${username}`, "coverImg");
    
        
        if(!avatar){
            throw new ApiError(400, 'Avatar upload faild...!')
        }
        const avatarUrlSqureArry = avatar.url.split('/');
        const getFolder = avatarUrlSqureArry[avatarUrlSqureArry.length -2]
        const getImgId = avatarUrlSqureArry[avatarUrlSqureArry.length -3]
        const getImgName = avatarUrlSqureArry[avatarUrlSqureArry.length -1]
        const getIdName = `${getImgId}/${getFolder}/${getImgName}`;
        const avatarSqureUrl = 'https://res.cloudinary.com/dhw3jdygg/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/'+getIdName;
        
        const user = await User.create({
            fullname,
            avatar: avatarSqureUrl,
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
            new ApiResponse(200, 'User created successfully....!', createdUser)
        )
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const loginUser = asyncHandler(async (req, res)=>{
    const {username, email, password} = req.body;
    try {
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
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }



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
        .json( new ApiResponse(200,'Token refreshed', {accessToken,refreshToken},))
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }

});

export const changePassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, 'Old password is wrong..!')
    };


    user.password = newPassword;
    user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200, 'Password is updated'));
});
export const updateUserInfo = asyncHandler(async (req, res)=>{
    try {
        const {fullname, email, username} = req.body;
            if(!email && !fullname && !username){
                throw new ApiError(500, 'Updated..!');
            }

            const user = await User.findOneAndUpdate({_id: req.user._id},
            {
                $set:{
                    email,
                    fullname,
                    username
                }
            },{
               new:true 
            }   
    
            ).select('-password');

            return res.status(200).json(new ApiResponse(200, user, 'updated user...'))
            
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const currentUser = asyncHandler(async (req, res)=>{

    try {
        const user = req.user;
        if(!user){
            throw new ApiError(400, 'Please login first..!')
            
        }
    
        return res.status(200).json(new ApiResponse(200, user, 'User is returned'));
    } catch (error) {
        return res.status(error.statusCode).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const avatarUpdate = asyncHandler(async (req, res)=>{
    try {
        const avatarPath = req.file?.path;
    
        if(!avatarPath){
            throw new ApiError(400, 'Avatar missing..!')
        }
        const avatarImg = await uploadOnCloudinary(avatarPath, `Users_images/${req.user.username}`, "avatar");
        if(!avatarImg){
            throw new ApiError(400, 'Avatar saving faild');
        }
        const avatarUrlSqureArry = avatarImg.url.split('/');
        const getFolder = avatarUrlSqureArry[avatarUrlSqureArry.length -2]
        const getImgId = avatarUrlSqureArry[avatarUrlSqureArry.length -3]
        const getImgName = avatarUrlSqureArry[avatarUrlSqureArry.length -1]
        const getIdName = `${getImgId}/${getFolder}/${getImgName}`;
        const avatarSqureUrl = 'https://res.cloudinary.com/dhw3jdygg/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/'+getIdName;
        const user = await User.findByIdAndUpdate(req.user?._id,{
            $set:{
                avatar:avatarSqureUrl
            }
        },{new:true}).select('-password -refreshToken -watchHistry')

        return res.status(200).json(new ApiResponse(200, 'Avatar updated', user));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const coverImgUpdate = asyncHandler(async (req, res)=>{

    try {
        const coverImgPath = req.file?.path;
    
        if(!coverImgPath){
            throw new ApiError(400, 'Cover Image missing..!')
        }
        const coverImg = await uploadOnCloudinary(coverImgPath, `Users_images/${req.user.username}`, "coverImg");
        if(!coverImg){
            throw new ApiError(400, 'Avatar saving faild');
        }
    
        const user = await User.findByIdAndUpdate(req.user?._id,{
            $set:{
                coverImg:coverImg.url
            }
        },{new:true}).select('-password -refreshToken -watchHistry');
    
        return res.status(200).json(new ApiResponse(200, user, 'Cover image updated'));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const channelProfile = asyncHandler(async (req, res)=>{
        const username = req.params.username;
        if(!username?.trim()){
            throw new ApiError(400, 'Username is missing')
        }

        const channel = await User.aggregate([
            {
                $match:{
                    username: username?.toLowerCase()
                }
            },{
                $lookup:{
                   from: 'subscriptions',
                   localField: '_id',
                   foreignField: 'channel' ,
                   as: 'subscribers'
                }
            },
            {
                $lookup:{
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'subscriber' ,
                    as: 'subscribedTo'
                 }
            },{
                $addFields:{
                    subscriberCount:{
                        $size:'$subscribers'
                    },
                    subscribedToCount:{
                       $size: '$subscribedTo'
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in: [req.user?._id, '$subscribers.subscriber']},
                            then:true,
                            else:false
                        }
                    }

                }
            },{
                $project:{
                    fullname:1,
                    username:1,
                    subscriberCount:1,
                    subscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImg:1,
                    email:1

                }
            }
        ]);

        if(!channel?.length){
            throw new ApiError(400, 'Channel dose not exist')
        }
    

    return res.status(200).json(new ApiResponse(200, channel[0], 'Channel retured'));
});
export const userWatchHistry = asyncHandler(async (req, res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: 'videos',
                localField: 'watchHistry',
                foreignField:'_id',
                as:'watchHistry',
                pipeline:[
                    {
                        $lookup:{
                            from: 'users',
                            localField: 'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        function:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first: '$owner'
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0].watchHistry," User Watch histry"))
});

export const imgDelete = asyncHandler(async (req, res)=>{
    const url= "https://res.cloudinary.com/dhw3jdygg/image/upload/v1725693338/Avatar/blh68j7frvipkqockcch.jpg"

    deleteCloudinaryImg(url)
    
    return res.status(200).json({message:" User Watch histry"})
});


