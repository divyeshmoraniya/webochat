import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import  {connectToDatabase}  from "./src/db/db.js";


import { userRouter } from "./src/router/user.router.js"
import {chatRouter} from "./src/router/chat.router.js"


dotenv.config({});
const app = express();
const port = 4000 || process.env.PORT;

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

app.listen(port,()=>{
    console.log("webochat is running!!")
})

app.use("/", (req,res)=>{
    return res.json("webocaht backend running!!!")
})

connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});


