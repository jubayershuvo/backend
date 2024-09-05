
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
    if(password.length < 6){

        throw new ApiError(400, 'Password too short...!')
    }

    if(!avatarLocalPath){
        throw new ApiError(400, 'Avatar is required...!')
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImg = await uploadOnCloudinary(coverImgLocalPath);

    
    if(!avatar){
        throw new ApiError(400, 'Avatar upload faild...!')
    }
    const avatarUrlSqureArry = avatar.url.split('/');
    const getImgId = avatarUrlSqureArry[avatarUrlSqureArry.length -2]
    const getImgName = avatarUrlSqureArry[avatarUrlSqureArry.length -1]
    const getIdName = `${getImgId}/${getImgName}`;
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
    const {fullname, email} = req.body;

    
    if(email || fullname){
        const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                email,
                fullname
            }
        },{
           new:true 
        }   

        ).select('-password');
        if(!user){
            throw new ApiError(500, 'Update fail...')
        }
        return res.status(200).json(ApiResponse(200, user, 'updated user...'))
        }
    

    return res.status(200).json(new ApiResponse(200, 'Updating canceled'));
});

export const currentUser = asyncHandler(async (req, res)=>{

    return res.status(200).json(new ApiResponse(200, req.user, 'User is returned'));
});
export const avatarUpdate = asyncHandler(async (req, res)=>{
    const avatarPath = req.file?.path;

    // const oldUser = await User.findOne({_id: req.user._id});
    // const oldAvatarUrl = oldUser.avatar;

    if(!avatarPath){
        throw new ApiError(400, 'Avatar missing..!')
    }
    const avatar = await uploadOnCloudinary(avatarPath);
    if(!avatar){
        throw new ApiError(400, 'Avatar saving faild');
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select('-password')

    return res.status(200).json(new ApiResponse(200, user, 'Avatar updated'));
});
export const coverImgUpdate = asyncHandler(async (req, res)=>{
    const coverImgPath = req.file?.path;

    if(!coverImgPath){
        throw new ApiError(400, 'Cover Image missing..!')
    }
    const coverImg = await uploadOnCloudinary(coverImgPath);
    if(!coverImg){
        throw new ApiError(400, 'Avatar saving faild');
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImg:coverImg.url
        }
    },{new:true}).select('-password')

    return res.status(200).json(new ApiResponse(200, user, 'Cover image updated'));
});
export const avatarImgDelete = asyncHandler(async (req, res)=>{
    // const user = await User.findById(req.user._id);
    // const oldAvatarUrl = user.avatar;
        
    const deletedImg = deleteCloudinaryImg(oldAvatarUrl);
    if(!deletedImg){
        throw new ApiError(400, 'Old img delete faild')
    }

    return res.status(200).json({success:true, message:''});
});

export const channelProfile = asyncHandler(async (req, res)=>{
        const {username} = req.params;
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



