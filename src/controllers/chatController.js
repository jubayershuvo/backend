import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Chat } from '../models/chatModel.js';
import { User } from '../models/userModel.js';

export const accessChat = asyncHandler(async (req, res) => {
    try {
        const { _id } = req.body; // Get the ID of the chat partner
        const userObjectId = req.user._id; // Get the logged-in user's ID
        const userId = userObjectId.toString().trim(); // Convert to string


        if (!_id) {
            throw new ApiError(400, 'ID not found..!');
        }

        // Find existing chat
        let isChat = await Chat.find({
            isGroupChat: false,
            users: { $all: [userId, _id] } // Check for both users in the array
        }).populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken').populate('latestMessage');

        // Populate latest message sender details
        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'fullname username email avatar'
        });

        // Check if chat exists
        if (isChat.length === 0) {
            const chatData = {
                chatName: 'sender',
                isGroupChat: false,
                users: [userId, _id]
            };

            try {
                const createdChat = await Chat.create(chatData);
                const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-password');
                return res.status(200).json(new ApiResponse(200, 'Chat opened..!', fullChat));
            } catch (error) {
                return res.status(error.statusCode || 500).json({
                    status: error.statusCode,
                    success: false,
                    message: error.message
                });
            }
        }
        return res.status(200).json(new ApiResponse(200, 'Old chat opened..!', isChat[0]));
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode,
            success: false,
            message: error.message
        });
    }
});
export const fetchChat = asyncHandler(async (req, res) => {
    try {
        const userObjectId = req.user._id; // Get the logged-in user's ID
        const userId = userObjectId.toString().trim(); // Convert to string

        const result = await Chat.find({ users: { $elemMatch: { $eq: userId } } })
            .populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('groupAdmin', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });

        const latestMessage = await User.populate(result, {
            path: 'latestMessage.sender',
            select: 'fullname username email avatar'
        });

        return res.status(200).json(new ApiResponse(200, 'Chat list..!', latestMessage));
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode || 500,
            success: false,
            message: error.message
        });
    }
});
export const createGroupChat = asyncHandler(async (req, res) => {
    try {
        const {users, name} = req.body;

        if(!users){
            throw new ApiError(400, 'Enter users...!');
        }
        if(!name){
            throw new ApiError(400, 'Enter groupname...!');
        }

        const usersJson = JSON.parse(users);
        if(usersJson < 2){
            throw new ApiError(400, 'Add more than 2 users...!');
        }

        usersJson.push(req.user);
        try {
            const groupChat = await Chat.create({
                chatName:name,
                users: usersJson,
                isGroupChat:true,
                groupAdmin:req.user
            })

            const result = await Chat.find({ _id: groupChat._id })
            .populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('groupAdmin', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });
            return res.status(200).json(new ApiResponse(200, 'Group chat..!', result));
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                status: error.statusCode || 500,
                success: false,
                message: error.message
            });
        }



    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode || 500,
            success: false,
            message: error.message
        });
    }
});
export const groupChatRename = asyncHandler(async (req, res) => {
    try {
        const {chatId, chatName} = req.body;

        if(!chatId){
            throw new ApiError(400, 'Enter chatId...!');
        }
        if(!chatName){
            throw new ApiError(400, 'Enter New-groupname...!');
        
        }

        const updatedChat = await Chat.findOneAndUpdate({_id: chatId},{chatName},{new:true});

        const result = await Chat.find({ _id: updatedChat._id })
            .populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('groupAdmin', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });
            return res.status(200).json(new ApiResponse(200, 'Group chat..!', result));



    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode || 500,
            success: false,
            message: error.message
        });
    }
});

export const addMember = asyncHandler(async (req, res) => {
    try {
        const {chatId, userId} = req.body;

        if(!chatId){
            throw new ApiError(400, 'Enter chatId...!');
        }
        if(!userId){
            throw new ApiError(400, 'Enter UserId...!');
        
        }

        const updatedChat = await Chat.findOneAndUpdate({_id: chatId},{$push:{users:userId}},{new:true});

        const result = await Chat.find({ _id: updatedChat._id })
            .populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('groupAdmin', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });
            return res.status(200).json(new ApiResponse(200, 'Group chat..!', result));



    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode || 500,
            success: false,
            message: error.message
        });
    }
});

export const removeMember = asyncHandler(async (req, res) => {
    try {
        const {chatId, userId} = req.body;

        if(!chatId){
            throw new ApiError(400, 'Enter chatId...!');
        }
        if(!userId){
            throw new ApiError(400, 'Enter UserId...!');
        
        }

        const updatedChat = await Chat.findOneAndUpdate({_id: chatId},{$pull:{users:userId}},{new:true});

        const result = await Chat.find({ _id: updatedChat._id })
            .populate('users', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('groupAdmin', '-password -refreshToken -accessToken -adminAccessToken -adminRefreshToken')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });
            return res.status(200).json(new ApiResponse(200, 'Group chat..!', result));



    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: error.statusCode || 500,
            success: false,
            message: error.message
        });
    }
});