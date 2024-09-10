import { Router } from "express";
import { 
    loginAdmin, 
    logoutAdmin, 
    refreshAdminAccessToken
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
adminRouter.route('/refresh-token').get(
    verifyAdminJWT,
    refreshAdminAccessToken
)



export default adminRouter;