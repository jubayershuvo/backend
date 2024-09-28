import { Router } from "express";
import { 
    allBannedUsers,
    allUnbannedUsers,
    allUsers,
    banUser,
    currentAdmin,
    deleteUserByAdmin,
    getUserByUsername,
    loginAdmin, 
    logoutAdmin, 
    refreshAdminAccessToken,
    unbanUser
 } from "../controllers/adminController.js";
import { verifyAdminJWT } from "../middlewares/adminMiddleware.js";


const adminRouter = Router();

adminRouter.route('/login').post(
    loginAdmin
)
adminRouter.route('/logout').get(
    verifyAdminJWT,
    logoutAdmin
)
adminRouter.route('/refresh-token').post(
    refreshAdminAccessToken
)
adminRouter.route('/current-admin').get(
    verifyAdminJWT,
    currentAdmin
)
adminRouter.route('/ban-user/:username').get(
    verifyAdminJWT,
    banUser
)
adminRouter.route('/unban-user/:username').get(
    verifyAdminJWT,
    unbanUser
)
adminRouter.route('/all-users').get(
    verifyAdminJWT,
    allUsers
)
adminRouter.route('/user').get(
    verifyAdminJWT,
    getUserByUsername
)
adminRouter.route('/banned-users').get(
    verifyAdminJWT,
    allBannedUsers
)
adminRouter.route('/fresh-users').get(
    verifyAdminJWT,
    allUnbannedUsers
)
adminRouter.route('/delete-user/:username').get(
    verifyAdminJWT,
    deleteUserByAdmin
)




export default adminRouter;