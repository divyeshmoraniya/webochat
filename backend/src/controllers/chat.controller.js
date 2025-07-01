import { Message } from "../models/Chat.models.js";
import { User } from "../models/User.models.js";

export const addMember = async (req, res) => {
    try {
        const { senderemail, receiverEmail } = req.body;

        // Validate input
        if (!senderemail || !receiverEmail) {
            return res.status(400).json({ msg: "Sender and receiver email are required" });
        }

        const sender = await User.findOne({ Email: senderemail });
        const receiverUser = await User.findOne({ Email: receiverEmail });

        if (!sender) {
            return res.status(404).json({ msg: "Sender not found with this email" });
        }

        if (!receiverUser) {
            return res.status(404).json({ msg: "Receiver not found with this email" });
        }

        // Prevent duplicate chats (bi-directional check)
        const existingChat = await Message.findOne({
            $or: [
                { sender: sender._id, receiver: receiverUser._id },
                { sender: receiverUser._id, receiver: sender._id }
            ]
        });

        if (existingChat) {
            return res.status(409).json({ msg: "Chat already exists with this user" });
        }

        // Create the chat
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

        // Find the user by email
        const user = await User.findOne({ Email: email });

        if (!user) {
            return res.status(404).json({ msg: "User not found with this email" });
        }

        // Find all messages where the user is sender or receiver AND chat is not hidden from this user
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

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (!chatWith) {
            return res.status(404).json({ msg: "Chat user not found" });
        }

        // Hide the chat for the requesting user (add their ID to hiddenFrom)
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

        res.status(200).json({
            msg: "Chat hidden successfully",
            modifiedCount: updated.modifiedCount
        });

    } catch (error) {
        console.error("❌ Error hiding chat:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

export const gethiddenchat = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // Find the user by clerkId
        const user = await User.findOne({ clerkId: clerkId });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Find all chats where this user has hidden them
        // This includes both chats where they are sender or receiver
        const hiddenChats = await Message.find({
            hiddenFrom: user._id,
            $or: [
                { sender: user._id },
                { receiver: user._id }
            ]
        })
            .populate("sender", "userName Email profileImg")
            .populate("receiver", "userName Email profileImg")
            .populate("hiddenFrom", "userName Email profileImg")
            .sort({ updatedAt: -1 });

        // Transform the data to include the other person's info in hiddenFrom field
        const transformedChats = hiddenChats.map(chat => {
            // Determine who the "other person" is (not the current user)
            const otherPerson = chat.sender._id.toString() === user._id.toString()
                ? chat.receiver
                : chat.sender;

            return {
                ...chat.toObject(),
                hiddenFrom: [otherPerson], 
                hiddenAt: chat.updatedAt
            };
        });

        return res.status(200).json({
            msg: "Hidden chats retrieved successfully",
            hiddenchat: transformedChats
        });

    } catch (error) {
        console.error("❌ Error fetching hidden chats:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

export const unhidechat = async (req, res) => {
    try {
        const { userEmail, chatWithEmail } = req.body;

        if (!userEmail || !chatWithEmail) {
            return res.status(400).json({ msg: "Both userEmail and chatWithEmail are required" });
        }

        const user = await User.findOne({ Email: userEmail });
        const chatWith = await User.findOne({ Email: chatWithEmail });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (!chatWith) {
            return res.status(404).json({ msg: "Chat user not found" });
        }

        // Remove the user's ID from hiddenFrom array (unhide for the requesting user)
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

        if (updated.modifiedCount === 0) {
            return res.status(404).json({ msg: "No hidden chat found to unhide" });
        }

        res.status(200).json({
            msg: "Chat unhidden successfully",
            modifiedCount: updated.modifiedCount
        });

    } catch (error) {
        console.error("❌ Error unhiding chat:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};

