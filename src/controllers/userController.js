
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { refresh_token_secret_key, smtp_username } from '../constans.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import deleteCloudinaryFolder from '../utils/cloudinaryFolderDelete.js';
import { User } from './../models/userModel.js';
import { sendEmail } from '../utils/mailer.js';
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
        const getImgId = avatarUrlSqureArry[avatarUrlSqureArry.length -4]
        const getImgName = avatarUrlSqureArry[avatarUrlSqureArry.length -1]
        const getIdName = `${getImgId}/Users_image/${getFolder}/${getImgName}`;
        const avatarSqureUrl = 'https://res.cloudinary.com/dhw3jdygg/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/'+getIdName;
        
        
        const user = {
            fullname,
            avatar: avatarSqureUrl,
            coverImg: coverImg?.url || '',
            email: email.toLowerCase(),
            password,
            username: username.toLowerCase()
        };
        if(!user){
            throw new ApiError(500, 'User save faild')
        }
        req.app.locals.USER = user;
        try {
            const code = otpGenerator.generate(6, {lowerCaseAlphabets:false, upperCaseAlphabets:false,specialChars:false});
            req.app.locals.OTP = code;
            const options = {
                to: email,
                subject: "Registration mail",
                html: `<h1>Welcome ${username}</h1><br><p>Thank you for register</p><br><h1>CODE:${code}</h1>`,
              };
              await sendEmail(options);
        } catch (error) {
            res.status(401).json({success:false, message:'mail send faild'})
            return;
        }
        console.log(req.app.locals.USER)
        return res.status(201).json( new ApiResponse(200, 'User created successfully....!', req.app.locals.USER))
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const setPassword = asyncHandler( async (req, res) =>{
    const id = req.app.locals.ID;
    try {
        if(!id){
            throw new ApiError(400, 'Unauthorized request..!')
        }
        const {password} = req.body;
        if(password < 6){
            throw new ApiError(400, 'Password too short...!')
        }
        const user = await User.findOne({_id: id});
    
    
        user.password = password;
        user.save({validateBeforeSave:false})

        const updatedUser = await User.findById(req.user?._id).select('-password');
    
        return res.status(200).json(new ApiResponse(200, 'Password is updated', updatedUser));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const forgetCodeVerify = asyncHandler( async (req, res) =>{
    try {
        const username = req.app.locals.USERNAME;
        if(!username){
            throw new ApiError(400, 'Unauthorized request..!')
        }
        const saved_code = req.app.locals.OTP;
        if(!saved_code){
            throw new ApiError(400, 'Unauthorized request..!')
        }
        const {code} = req.body;
        if(!code){
            throw new ApiError(400, 'Enter code first')
        }

        if(saved_code !== code){
            throw new ApiError(400, 'Wrong OTP...!')
        }


        const user = await User.findOne({username});
        if(!user){
            throw new ApiError(400, 'User find faild...!')
        }

        req.app.locals.ID = user._id;
        req.app.locals.USERNAME = '';
        req.app.locals.OTP = null;

        return res.status(200).json(new ApiResponse(200, 'Now you can change password', user.fullname));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});

export const registerVerify = asyncHandler( async (req, res) =>{
    const code = req.body.code;
    const user = req.app.locals.USER;
    const saved_code = req.app.locals.OTP;

    if(!saved_code){
        throw new ApiError(400, 'Unauthorized request..!')
    }
    if(!code){
        throw new ApiError(400, 'Enter Code first..!')
    }

    try {
        if(saved_code !== code){
            throw new ApiError(400, 'Wrong OTP...!')
        }
        const createdUser = await User.create({
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: user.password,
            avatar: user.avatar,
            coverImg: user.coverImg || '',
        });
        req.app.locals.OTP = null;
        req.app.locals.USER = null;
        return res.status(201).json( new ApiResponse(200, 'User created successfully....!', createdUser))
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
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
            .json(new ApiResponse(200, 'User logged In successfully', {
                user: loggedUser,
                accessToken,
                refreshToken
            }));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }



});
export const passwordRecovery = asyncHandler( async (req, res) =>{
    const {email, username} = req.body;

    try {
        if(!email && !username){
            throw new ApiError(400, 'Enter email or username')
        }
    
        const userExist = await User.findOne({
            $or:[{username}, {email}]
        });
        if(!userExist){
            throw new ApiError(409, 'Username or email not registered..!')
        }

            const code = otpGenerator.generate(6, {lowerCaseAlphabets:false, upperCaseAlphabets:false,specialChars:false});
            const options = {
                to: userExist.email,
                subject: "Password recovery code",
                html: `<h1>Hi ${userExist.username}</h1><br><p>This mail for your password recovery.</p><br><h1>CODE: ${code}</h1>`,
            };
            const mailResult = await sendEmail(options);
            if(!mailResult){
                throw new ApiError(409, 'Mail sending faild..!')
            }
            req.app.locals.USERNAME = userExist.username;
            req.app.locals.OTP = code;
        return res.status(201).json( new ApiResponse(200, 'Code deliverd', req.app.locals.USERNAME))
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const logoutUser = asyncHandler(async (req, res)=>{
    const id = req.user._id;

    const loggedOutUser = await User.findOneAndUpdate(id,{$set:{refreshToken: undefined}},{new:true});
    if(!loggedOutUser){
        throw new ApiError(404, 'Logout faild')
    }

    return res.status(200)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
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
    try {
        const {oldPassword, newPassword} = req.body;
        if(oldPassword === newPassword){

            throw new ApiError(400, 'Old password and New password almost same..!')
        }
    
        const user = await User.findById(req.user?._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if(!isPasswordCorrect){
            throw new ApiError(400, 'Old password is wrong..!')
        };
    
    
        user.password = newPassword;
        user.save({validateBeforeSave:false})

        const updatedUser = await User.findById(req.user?._id).select('-password');
    
        return res.status(200).json(new ApiResponse(200, 'Password is updated', updatedUser));
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});
export const updateUserInfo = asyncHandler(async (req, res)=>{
    try {
        const {fullname, email} = req.body;
            if(!email && !fullname){
                throw new ApiError(500, 'Updated..!');
            }

            const user = await User.findOneAndUpdate({_id: req.user._id},
            {
                $set:{
                    email,
                    fullname
                }
            },{
               new:true 
            }   
    
            ).select('-password');

            return res.status(200).json(new ApiResponse(200, 'updated user...', user))
            
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
    
        return res.status(200).json(new ApiResponse(200, 'User is returned', user));
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
    
        return res.status(200).json(new ApiResponse(200, 'Cover image updated', user));
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
    

    return res.status(200).json(new ApiResponse(200, 'Channel retured', channel[0]));
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
    return res.status(200).json(new ApiResponse(200," User Watch histry", user[0].watchHistry))
});

export const deleteUser = asyncHandler( async (req, res) =>{
    const {username} = req.user;
    if(!username){
        throw new ApiError(409, 'Login again..!')
    }

    try {
        const user = await User.findOneAndDelete({username});
        if(!user){
            throw new ApiError(400, 'User not found..!')
        }
        const {email} = user;
        try {
            const options = {
                to: email,
                subject: "Your account deleted",
                html: `<h1>Hi ${username}</h1><br><p>if you any fetching problame.</p><br><h1>Send <a href="mailto:${smtp_username}">Email us</a></h1>`,
              };
              const deletedResult = deleteCloudinaryFolder(username);
              if(!deletedResult){
                throw new ApiError(400, 'User folder deleting faild')
              }
              await sendEmail(options);
        } catch (error) {
            res.status(401).clearCookie('accessToken').clearCookie('refreshToken').json({success:false, message:'mail send faild'})
            return;
        }
        return res.status(201).json( new ApiResponse(200, 'User created successfully....!', user))
    } catch (error) {
        return res.status(error.statusCode || 500).json({status: error.statusCode, success:false, message: error.message})
    }
});


