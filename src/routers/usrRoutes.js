import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/userController.js";
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

export default userRouter;