import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import  {connectToDatabase}  from "./src/db/db.js";
import { userRouter } from "./src/router/user.router.js"
import {chatRouter} from "./src/router/chat.router.js"
import { Message } from "./src/models/Chat.models.js";
import { User } from "./src/models/User.models.js";
// socket connection import codes
import http from "http";
import { createServer } from "http";
import { Server } from "socket.io";



dotenv.config({});
const app = express();
const port = process.env.PORT || 4000 ;

const httpServer = createServer(app);

// socket codes

const io = new Server(httpServer,{
    cors : {
        origin : "*",
        methods: ["GET", "POST"]
    }
})



const corsOptions = {
    origin: "*",
    credentials: true,
    methods: 'GET, POST, DELETE, PATCH, HEAD, PUT, OPTIONS',
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Access-Control-Allow-Credentials',
        'cache-control',
        'svix-id',
        'svix-timestamp',
        'svix-signature',
    ],
    exposedHeaders: ['Authorization'],
};
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('/tmp', { index: false }));


app.use("/api/user", userRouter);
app.use("/api/chat" , chatRouter)


app.use("/", (req,res)=>{
    return res.json("webocaht backend running!!!")
})

// io connection for send messege

io.on("connection",(socket) => {
    console.log(`user connected ${socket.id}`);

   
    //get msg from client
    socket.on("get-message", async ({ senderId, receiverId, content }) => {
        try {
            const senderUser = await User.findOne({ clerkId: senderId }).select("_id");
            if (!senderUser) return;

            const senderObjectId = senderUser._id;

            // Try to find an existing chat between these two users
            let existingChat = await Message.findOne({
                $or: [
                    { sender: senderObjectId, receiver: receiverId },
                    { sender: receiverId, receiver: senderObjectId }
                ]
            });

            if (existingChat) {
                // Append new message to the message array
                existingChat.message.push(content);
                await existingChat.save();
                io.emit("send-message", existingChat);
            } else {
                // No chat found — create new one
                const newMessage = new Message({
                    sender: senderObjectId,
                    receiver: receiverId,
                    message: [content],
                    hiddenFrom: []
                });
                await newMessage.save();
                io.emit("send-message", newMessage);
            }
        } catch (err) {
            console.error("Socket message error:", err);
        }
    });
})

connectToDatabase().then(() => {
    httpServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});


