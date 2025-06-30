import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Eye, EyeOff, MessageCircle, Clock, User, ArrowLeft, Sun, Moon } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function HideChat() {
  const [hiddenChats, setHiddenChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatingIds, setAnimatingIds] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const clerkId = user?.id;
      console.log(clerkId);
      fetchHiddenChats(clerkId);
    }
  }, [isLoaded, user ]);

  const fetchHiddenChats = async (clerkId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/gethiddenchat/${clerkId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch hidden chats');
      }

      const data = await response.json();
      // Filter out chats that don't have proper hiddenFrom data
      const validChats = Array.isArray(data.hiddenchat)
        ? data.hiddenchat.filter(chat =>
          chat.hiddenFrom &&
          Array.isArray(chat.hiddenFrom) &&
          chat.hiddenFrom.length > 0 &&
          chat.hiddenFrom[0]?.Email
        )
        : [];

      setHiddenChats(validChats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnhideChat = async (userEmail, chatWithEmail) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/unhide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          chatWithEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unhide chat');
      }

      toast.success('Chat unhidden successfully!', {
        position: "top-center",
        autoClose: 3000,
      });

      // Remove the chat visually from list
      setHiddenChats(prev =>
        prev.filter(chat => chat.hiddenFrom?.[0]?.Email !== chatWithEmail)
      );

    } catch (err) {
      toast.error('Failed to unhide chat: ' + err.message, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };


  const handleGoBack = () => {
    window.history.back();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500'
    ];
    return colors[index % colors.length];
  };

  const themeClasses = {
    container: isDarkMode
      ? 'min-h-screen bg-gray-900 text-white'
      : 'min-h-screen bg-gray-50 text-gray-900',
    card: isDarkMode
      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
      : 'bg-white border-gray-200 hover:bg-gray-50',
    button: isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-blue-500 hover:bg-blue-600',
    text: {
      primary: isDarkMode ? 'text-white' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    }
  };

  if (loading) {
    return (
      <div className={themeClasses.container}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-medium">Loading hidden chats...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={themeClasses.container}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-500 text-xl mb-2">Error</div>
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${isDarkMode
                ? 'border-gray-600 hover:bg-gray-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-3">
              <EyeOff className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">Hidden Chats</h1>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${isDarkMode
              ? 'border-gray-600 hover:bg-gray-700'
              : 'border-gray-300 hover:bg-gray-100'
              }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Content area */}
        {hiddenChats.length === 0 ? (
          <div className="text-center py-16">
            <div className={`p-8 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} max-w-md mx-auto`}>
              <EyeOff className={`w-16 h-16 mx-auto mb-4 ${themeClasses.text.muted}`} />
              <div className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>No Hidden Chats</div>
              <div className={`${themeClasses.text.secondary} leading-relaxed`}>
                You don't have any hidden conversations at the moment.
                <br />
                When you hide chats, they'll appear here.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hiddenChats.map((chat, index) => (
              <div
                key={chat._id}
                className={`${themeClasses.card} border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 ${animatingIds.has(chat._id) ? 'opacity-50 transform scale-95' : ''
                  }`}
              >
                {/* Profile section */}
                <div className="flex items-start space-x-3 mb-4">
                  {/* Profile image/avatar */}
                  <div className="flex-shrink-0">
                    {chat.hiddenFrom?.[0]?.profileImg ? (
                      <img
                        src={chat.hiddenFrom[0].profileImg}
                        alt={chat.hiddenFrom[0].userName || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full ${getRandomColor(index)} flex items-center justify-center text-white font-medium`}>
                        {getInitials(chat.hiddenFrom?.[0]?.userName)}
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg ${themeClasses.text.primary} truncate`}>
                      {chat.hiddenFrom?.[0]?.userName || 'Unknown User'}
                    </h3>
                    <p className={`text-sm ${themeClasses.text.secondary} truncate`}>
                      {chat.hiddenFrom?.[0]?.Email || 'No email'}
                    </p>
                  </div>
                </div>

                {/* Hidden date */}
                {chat.hiddenAt && (
                  <div className={`flex items-center text-xs ${themeClasses.text.muted} mb-4`}>
                    <Clock className="w-3 h-3 mr-1" />
                    Hidden on {new Date(chat.hiddenAt).toLocaleDateString()}
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() =>
                    handleUnhideChat(
                      user?.primaryEmailAddress?.emailAddress,
                      chat.hiddenFrom?.[0]?.Email
                    )
                  }
                  disabled={animatingIds.has(chat._id)}
                  className={`w-full ${themeClasses.button} text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {animatingIds.has(chat._id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Unhiding...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Unhide Chat
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HideChat;