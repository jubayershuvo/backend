import { Router } from "express";
import { 
    avatarUpdate, 
    changePassword, 
    channelProfile, 
    coverImgUpdate, 
    currentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateUserInfo,
    userWatchHistry
 } from "../controllers/userController.js";
import { upload } from './../middlewares/multerMiddleware.js';
import { verifyJWT } from "../middlewares/authMiddleware.js";

const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount:1
        },
        {
            name: 'coverImg',
            maxCount:1
        }
    ]),
    registerUser
);
userRouter.route('/login').post(
    
    loginUser
);
userRouter.route('/logout').get(
    verifyJWT,
    logoutUser
);
userRouter.route('/refresh-token').get(
    refreshAccessToken
);
userRouter.route('/update-password').post(
    verifyJWT,
    changePassword
);
userRouter.route('/current-user').get(
    verifyJWT,
    currentUser
);
userRouter.route('/update-user').patch(
    verifyJWT,
    updateUserInfo
);
userRouter.route('/update-avatar').patch(
    verifyJWT,
    upload.single('avatar'),
    avatarUpdate
);
userRouter.route('/update-cover').patch(
    verifyJWT,
    upload.single('coverImg'),
    coverImgUpdate
);
userRouter.route('/channel/:username').get(
    verifyJWT,
    channelProfile
);
userRouter.route('/history').get(
    verifyJWT,
    userWatchHistry
);




export default userRouter;