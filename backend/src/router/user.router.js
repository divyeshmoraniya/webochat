import Router from "express";
import { createuser } from "../controllers/User.contoller.js"
export const userRouter =  Router();


userRouter.route("/me").post(createuser);






