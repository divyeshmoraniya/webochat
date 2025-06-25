import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    clerkId : {
        type : String,
        required : true
    },
    userName : {
        type : String,
        required : true
    },
    Email : {
        type : String,
        required : true,
    },
    profileImg : {
        type : String,
        required : true
    }
},{timestamps : true})

export const  User = mongoose.model("User",userSchema);