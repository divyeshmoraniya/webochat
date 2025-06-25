import { Message } from "../models/Chat.models.js";
import { User } from "../models/User.models.js"; // Import User model

export const addMember = async (req, res) => {
    try {
        const { senderemail, receiverEmail } = req.body;
        
        // Validate input
        if (!senderemail || !receiverEmail) {
            return res.status(400).json({ msg: "Sender and receiver email are required" });
        }
        const sender = await User.findOne({ Email: senderemail });

        const receiverUser = await User.findOne({ Email: receiverEmail });

        if (!receiverUser) {
            return res.status(404).json({ msg: "Receiver not found with this email" });
        }

        // 2. Prevent duplicate chats (bi-directional check)
        const existingChat = await Message.findOne({
            $or: [
                { sender: sender._id, receiver: receiverUser._id },
                { sender: receiverUser._id, receiver: sender._id }
            ]
        });

        if (existingChat) {
            return res.status(409).json({ msg: "Chat already exists with this user" });
        }

        // 3. Create the chat
        const chat = await Message.create({
            sender: sender._id,
            receiver: receiverUser._id
        });

        res.status(200).json({ msg: "Chat created successfully", chat });

    } catch (error) {
        console.error("❌ Error adding chat:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

export const getchatbyemail = async (req, res) => {
    try {
        const { email } = req.params;

        // 1. Find the user by email
        const user = await User.findOne({ Email: email });

        if (!user) {
            return res.status(404).json({ msg: "User not found with this email" });
        }

        // 2. Find all messages where the user is sender or receiver
        const chats = await Message.find({
            hiddenFrom: { $ne: user._id },
            $or: [{ sender: user._id }, { receiver: user._id }],
        })
            .populate("sender", "userName Email profileImg")
            .populate("receiver", "userName Email profileImg")
            .sort({ updatedAt: -1 });

        res.status(200).json({ msg: "Chats fetched successfully", chats });
    } catch (error) {
        console.error("❌ Error fetching chats:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};


export const hideChatForUser = async (req, res) => {
    try {
        const { userEmail, chatWithEmail } = req.body;

        if (!userEmail || !chatWithEmail) {
            return res.status(400).json({ msg: "Both userEmail and chatWithEmail are required" });
        }

        const user = await User.findOne({ Email: userEmail });
        const chatWith = await User.findOne({ Email: chatWithEmail });

        if (!user || !chatWith) {
            return res.status(404).json({ msg: "Users not found" });
        }

        const updated = await Message.updateMany(
            {
                $or: [
                    { sender: user._id, receiver: chatWith._id },
                    { sender: chatWith._id, receiver: user._id }
                ]
            },
            {
                $addToSet: { hiddenFrom: user._id }
            }
        );

        res.status(200).json({ msg: "Chat hidden for user", modifiedCount: updated.modifiedCount });

    } catch (error) {
        console.error("❌ Error hiding chat:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

export const gethiddenchat = async (req,res) => {
    try {
        const {senderId} = req.body;
        const hiddenchat = await Message.findOne({ sender: senderId }).populate("hiddenFrom","userName Email profileImg");
        if(!hiddenchat){
            return res.status(402).json({msg : "no hidden chat is here"})
        }

    return res.status(200).json({msg : "hiddenchat here" , hiddenchat});
    } catch (error) {
        console.log(error);
    }
}

export const unhidechat = async (req, res) => {
    try {
        const { userEmail, chatWithEmail } = req.body;

        if (!userEmail || !chatWithEmail) {
            return res.status(400).json({ msg: "Both userEmail and chatWithEmail are required" });
        }

        const user = await User.findOne({ Email: userEmail });
        const chatWith = await User.findOne({ Email: chatWithEmail });

        if (!user || !chatWith) {
            return res.status(404).json({ msg: "Users not found" });
        }

        const updated = await Message.updateMany(
            {
                $or: [
                    { sender: user._id, receiver: chatWith._id },
                    { sender: chatWith._id, receiver: user._id }
                ]
            },
            {
                $pull: { hiddenFrom: user._id }
            }
        );

        res.status(200).json({ msg: "Chat unhidden for user", modifiedCount: updated.modifiedCount });

    } catch (error) {
        console.error("❌ Error unhiding chat:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};
