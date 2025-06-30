import { Router } from "express";
import { addMember, getchatbyemail, hideChatForUser, gethiddenchat, unhidechat } from "../controllers/chat.controller.js";
export const chatRouter = Router();

chatRouter.route("/addchat").post(addMember);
chatRouter.route("/getchat/:email").get(getchatbyemail);
chatRouter.route("/deletechat").delete(hideChatForUser);
chatRouter.route("/gethiddenchat/:clerkId").get(gethiddenchat);
chatRouter.route("/unhide").post(unhidechat)