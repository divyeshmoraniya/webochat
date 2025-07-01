// models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: [{ type: String, default : "HI" }],
    timestamp: { type: Date, default: Date.now },
    hiddenFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

export const Message = mongoose.model("Message", messageSchema);
