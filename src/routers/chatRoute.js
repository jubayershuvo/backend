import express from 'express';
const chatRouter = express.Router();
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {accessChat, addMember, createGroupChat, fetchChat, groupChatRename, removeMember} from '../controllers/chatController.js'

chatRouter.route('/').post(
    verifyJWT,
    accessChat
).get(
    verifyJWT,
    fetchChat
)
chatRouter.route('/group').post(
    verifyJWT,
    createGroupChat
)
chatRouter.route('/group-rename').put(
    verifyJWT,
    groupChatRename
)
chatRouter.route('/group-member-remove').put(
    verifyJWT,
    removeMember
)
chatRouter.route('/group-member-add').put(
    verifyJWT,
    addMember
)

export default chatRouter;