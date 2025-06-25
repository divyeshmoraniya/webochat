import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, MessageCircleOff, MessageCircle, Phone, Video, Star, Moon, Sun, Send, Paperclip, Smile, MoreVertical, ArrowLeft, Info, EyeOff, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import Swal from "sweetalert2";
import axios from "axios";
import { Link } from 'react-router-dom';

function Chat() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddChat, setShowAddChat] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const { user } = useUser();
    // Get user email
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    console.log(userEmail);

    // Function to add chat - moved outside useEffect and made useCallback
    const addChat = useCallback(async (email) => {
        if (!email || !userEmail) return;

        try {
            const response = await axios.post("http://localhost:4000/api/chat/addchat", {
                senderemail: userEmail,
                receiverEmail: email
            });

            if (response.status === 200) {
                Swal.fire({
                    title: "Chat Added",
                    text: "Chat has been successfully added!",
                    icon: "success",
                    draggable: true
                });
                // Refresh chats after adding
                fetchChats();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Email already exists or user not found",
                });
            }
        } catch (error) {
            console.log(error);
            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: error.response?.data?.msg || error.message,
            });
        }
    }, [userEmail]);

    // Function to hide chat
    const hideChat = useCallback(async (chatWithEmail) => {
        if (!chatWithEmail || !userEmail) return;

        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Hide Chat?',
                text: 'Are you sure you want to hide this chat?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, hide it!',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                const response = await axios.post("http://localhost:4000/api/chat/deletechat", {
                    userEmail: userEmail,
                    chatWithEmail: chatWithEmail
                });

                if (response.status === 200) {
                    Swal.fire({
                        title: "Chat Hidden",
                        text: "Chat has been successfully hidden!",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Remove the chat from local state
                    setContacts(contacts.filter(contact => contact.email !== chatWithEmail));

                    // If the hidden chat was selected, clear selection
                    if (selectedChat && selectedChat.email === chatWithEmail) {
                        setSelectedChat(null);
                    }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Failed to hide chat. Please try again.",
                    });
                }
            }
        } catch (error) {
            console.log(error);
            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: error.response?.data?.msg || error.message,
            });
        }
    }, [userEmail, contacts, selectedChat]);

    // Function to group messages by conversation partner
    const groupMessagesByConversation = useCallback((messages, userEmail) => {
        const conversations = {};

        messages.forEach(message => {
            // Determine the conversation partner
            const isUserSender = message.sender.Email === userEmail;
            const partner = isUserSender ? message.receiver : message.sender;
            const partnerId = partner._id;

            // Initialize conversation if it doesn't exist
            if (!conversations[partnerId]) {
                conversations[partnerId] = {
                    id: partnerId,
                    name: partner.userName || partner.Email.split('@')[0],
                    email: partner.Email,
                    avatar: partner.profileImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.userName || 'User')}&background=25D366&color=fff&size=150`,
                    online: Math.random() > 0.5, // Random online status
                    vip: false,
                    messages: []
                };
            }

            // Add message to conversation
            conversations[partnerId].messages.push({
                id: message._id,
                text: message.message,
                time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sent: isUserSender,
                timestamp: message.timestamp
            });
        });

        // Sort messages in each conversation by timestamp and set last message info
        Object.values(conversations).forEach(conversation => {
            conversation.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Set last message and time
            if (conversation.messages.length > 0) {
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                conversation.lastMessage = lastMessage.text;
                conversation.time = lastMessage.time;
                conversation.unread = 0; // You can implement unread logic based on your needs
            } else {
                conversation.lastMessage = 'No messages yet';
                conversation.time = 'Now';
                conversation.unread = 0;
            }
        });

        return Object.values(conversations);
    }, []);

    // Fetch chats from API
    const fetchChats = useCallback(async () => {
        if (!userEmail) {
            setError('User email not found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:4000/api/chat/getchat/${encodeURIComponent(userEmail)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Handle the API response structure
            let messagesArray = [];

            if (data && data.chats && Array.isArray(data.chats)) {
                messagesArray = data.chats;
            } else if (Array.isArray(data)) {
                messagesArray = data;
            } else {
                throw new Error('Invalid API response format');
            }

            // Group messages by conversation partner
            const conversations = groupMessagesByConversation(messagesArray, userEmail);

            // Sort conversations by last message time (most recent first)
            conversations.sort((a, b) => {
                const timeA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].timestamp) : new Date(0);
                const timeB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].timestamp) : new Date(0);
                return timeB - timeA;
            });

            setContacts(conversations);
            setError(null);

        } catch (err) {
            console.error('Error fetching chats:', err);
            setError(`Failed to load chats: ${err.message}`);

            // Fallback to sample data if API fails
            setContacts([
                {
                    id: 'sample-1',
                    name: 'Sample Contact',
                    email: 'sample@example.com',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                    lastMessage: 'This is sample data. API connection failed.',
                    time: 'Now',
                    unread: 0,
                    online: false,
                    vip: false,
                    messages: [
                        { id: 1, text: 'This is sample data. Please check your API connection.', time: 'Now', sent: false }
                    ]
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [userEmail, groupMessagesByConversation]);

    // Load chats on component mount
    useEffect(() => {
        if (userEmail) {
            fetchChats();
        } else {
            setLoading(false);
        }
    }, [userEmail, fetchChats]);

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddChat = async () => {
        if (newEmail.trim()) {
            await addChat(newEmail.trim());
            setNewEmail('');
            setShowAddChat(false);
        }
    };

    const handleSendMessage = async () => {
        if (messageText.trim() && selectedChat) {
            const newMessage = {
                id: Date.now(),
                text: messageText.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sent: true,
                timestamp: new Date().toISOString()
            };

            try {
                // API call to send message
                const response = await axios.post('http://localhost:4000/api/chat/send-message', {
                    senderEmail: userEmail,
                    receiverEmail: selectedChat.email,
                    message: messageText.trim()
                });

                if (response.status === 200) {
                    // Update local state immediately for better UX
                    setContacts(contacts.map(contact =>
                        contact.id === selectedChat.id
                            ? {
                                ...contact,
                                messages: [...contact.messages, newMessage],
                                lastMessage: newMessage.text,
                                time: newMessage.time
                            }
                            : contact
                    ));

                    setSelectedChat(prev => ({
                        ...prev,
                        messages: [...prev.messages, newMessage],
                        lastMessage: newMessage.text,
                        time: newMessage.time
                    }));

                    setMessageText('');
                }
            } catch (err) {
                console.error('Error sending message:', err);
                setError('Failed to send message. Please try again.');

                // Still update UI optimistically but show error
                setContacts(contacts.map(contact =>
                    contact.id === selectedChat.id
                        ? {
                            ...contact,
                            messages: [...contact.messages, newMessage],
                            lastMessage: newMessage.text,
                            time: newMessage.time
                        }
                        : contact
                ));

                setSelectedChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMessage],
                    lastMessage: newMessage.text,
                    time: newMessage.time
                }));

                setMessageText('');
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const selectChat = (contact) => {
        setSelectedChat(contact);
        // Mark messages as read - you can add API call here
        setContacts(contacts.map(c =>
            c.id === contact.id ? { ...c, unread: 0 } : c
        ));
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChat?.messages]);

    // Show loading state
    if (loading) {
        return (
            <div className={`flex h-screen items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            {/* Error Banner */}
            {error && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center z-50">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-4 text-red-200 hover:text-white"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Sidebar - Chat List */}
            <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Header */}
                <div className={`p-4 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            WhatsChat
                        </h1>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button
                                onClick={() => setShowAddChat(true)}
                                className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                                <Plus size={18} />
                            </button>
                            <Link to="/hidechat">
                                <button
                                    className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                                    title="undo chats"
                                >
                                    <MessageCircleOff size={18} />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${darkMode
                                ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-300'
                                }`}
                        />
                    </div>

                    {/* User Info */}
                    {userEmail && (
                        <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Logged in as: {userEmail}
                        </div>
                    )}
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No chats found</p>
                            <p className="text-sm mt-2">Start a new conversation</p>
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className={`flex items-center p-3 cursor-pointer border-b transition-all duration-200 relative group ${selectedChat?.id === contact.id
                                    ? darkMode ? 'bg-gray-700' : 'bg-green-50'
                                    : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                    } ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                            >
                                {/* Chat Content */}
                                <div
                                    className="flex items-center flex-1 min-w-0"
                                    onClick={() => selectChat(contact)}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <img
                                            src={contact.avatar}
                                            alt={contact.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=25D366&color=fff&size=150`;
                                            }}
                                        />
                                        {contact.online && (
                                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 ${darkMode ? 'border-gray-800' : 'border-white'}`} />
                                        )}
                                        {contact.vip && (
                                            <div className="absolute -top-1 -left-1 text-yellow-500">
                                                <Star size={12} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Info */}
                                    <div className="ml-3 flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {contact.name}
                                            </h3>
                                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {contact.time}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {contact.lastMessage}
                                        </p>
                                    </div>

                                    {/* Unread Badge */}
                                    {contact.unread > 0 && (
                                        <div className="ml-2">
                                            <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {contact.unread}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Hide Chat Button - FIXED FOR MOBILE */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        hideChat(contact.email);
                                    }}
                                    className={`ml-2 p-1.5 rounded-full transition-all duration-200 
                                        sm:opacity-100 lg:opacity-0 lg:group-hover:opacity-100
                                        ${darkMode
                                            ? 'hover:bg-red-600 text-gray-400 hover:text-white'
                                            : 'hover:bg-red-500 text-gray-500 hover:text-white'
                                        }`}
                                    title="Hide chat"
                                >
                                    <EyeOff size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className={`flex items-center p-4 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setSelectedChat(null)}
                                className={`lg:hidden p-2 rounded-full mr-2 transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                                <ArrowLeft size={20} />
                            </button>

                            <img
                                src={selectedChat.avatar}
                                alt={selectedChat.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name)}&background=25D366&color=fff&size=150`;
                                }}
                            />

                            <div className="ml-3 flex-1">
                                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedChat.name}
                                </h3>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {selectedChat.online ? 'Online' : 'Last seen recently'}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                    <Video size={20} />
                                </button>
                                <button className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                    <Phone size={20} />
                                </button>
                                <button
                                    onClick={() => setShowProfile(!showProfile)}
                                    className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                            style={{
                                backgroundImage: darkMode
                                    ? 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.1) 2px, transparent 0)'
                                    : 'radial-gradient(circle at 25px 25px, rgba(0,0,0,0.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(0,0,0,0.1) 2px, transparent 0)',
                                backgroundSize: '100px 100px'
                            }}>
                            {selectedChat.messages.length === 0 ? (
                                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No messages yet</p>
                                    <p className="text-sm mt-2">Start the conversation!</p>
                                </div>
                            ) : (
                                selectedChat.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${message.sent
                                                ? 'bg-green-500 text-white'
                                                : darkMode
                                                    ? 'bg-gray-700 text-white'
                                                    : 'bg-white text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{message.text}</p>
                                            <p className={`text-xs mt-1 ${message.sent ? 'text-green-100' : darkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                {message.time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className={`p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-700' : 'bg-white'} border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex items-end space-x-2">
                                <button className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                    <Smile size={20} />
                                </button>
                                <button className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        rows="1"
                                        className={`w-full px-4 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${darkMode
                                            ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-600'
                                            : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-300'
                                            }`}
                                        style={{ minHeight: '40px', maxHeight: '100px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Welcome Screen */
                    <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="text-center max-w-md mx-auto p-8">
                            <MessageCircle size={80} className={`mx-auto mb-6 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Welcome to WhatsChat
                            </h2>
                            <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Select a chat to start messaging</p>
                            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Send and receive messages instantly
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Sidebar */}
            {showProfile && selectedChat && (
                <div className={`w-80 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
                    <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Contact Info
                            </h3>
                            <button
                                onClick={() => setShowProfile(false)}
                                className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <img
                                src={selectedChat.avatar}
                                alt={selectedChat.name}
                                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name)}&background=25D366&color=fff&size=150`;
                                }}
                            />
                            <h4 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {selectedChat.name}
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {selectedChat.email}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                {selectedChat.online ? 'Online' : 'Last seen recently'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Messages
                                    </span>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedChat.messages.length}
                                    </span>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Status
                                    </span>
                                    <span className={`text-sm font-medium ${selectedChat.online ? 'text-green-500' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {selectedChat.online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {selectedChat.vip && (
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${darkMode ? 'border-yellow-800' : 'border-yellow-200'}`}>
                                    <div className="flex items-center">
                                        <Star size={16} className="text-yellow-500 mr-2" fill="currentColor" />
                                        <span className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                            VIP Contact
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-2">
                            <button className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                <div className="flex items-center">
                                    <Video size={18} className="mr-3" />
                                    <span>Video Call</span>
                                </div>
                            </button>

                            <button className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                <div className="flex items-center">
                                    <Phone size={18} className="mr-3" />
                                    <span>Voice Call</span>
                                </div>
                            </button>

                            <button
                                onClick={() => hideChat(selectedChat.email)}
                                className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${darkMode ? 'hover:bg-red-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                            >
                                <div className="flex items-center">
                                    <EyeOff size={18} className="mr-3" />
                                    <span>Hide Chat</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Chat Modal */}
            {showAddChat && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-md rounded-lg shadow-xl transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Add New Chat
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowAddChat(false);
                                        setNewEmail('');
                                    }}
                                    className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${darkMode
                                        ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                        : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                                        }`}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddChat();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowAddChat(false);
                                        setNewEmail('');
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${darkMode
                                        ? 'bg-gray-600 text-white hover:bg-gray-500'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddChat}
                                    disabled={!newEmail.trim()}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    Add Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;