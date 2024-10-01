import { Router } from "express";
import { 
    avatarUpdate, 
    changePassword, 
    channelProfile, 
    coverImgUpdate, 
    currentUser, 
    deleteUser, 
    forgetCodeVerify,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    registerVerify, 
    updateUserInfo,
    userWatchHistry,
    setPassword,
    passwordRecovery,
    findUserByUsername,
    findUsersBySearch,
 } from "../controllers/userController.js";
import { upload } from '../middlewares/multerMiddleware.js';
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
userRouter.route('/activate-user').post(
    registerVerify
);
userRouter.route('/verify-code').post(
    forgetCodeVerify
);
userRouter.route('/forget-password').post(
    passwordRecovery
);
userRouter.route('/set-password').post(
    setPassword
);
userRouter.route('/recover-password').post(
    registerVerify
);
userRouter.route('/login').post(
    loginUser
);
userRouter.route('/logout').get(
    verifyJWT,
    logoutUser
);
userRouter.route('/refresh-token').post(
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
userRouter.route('/user/:username').get(
    verifyJWT,
    findUserByUsername
);
userRouter.route('/search-users').get(
    verifyJWT,
    findUsersBySearch
);
userRouter.route('/watch_history').get(
    verifyJWT,
    userWatchHistry
);
userRouter.route('/delete-user').post(
    verifyJWT,
    deleteUser
);


export default userRouter;