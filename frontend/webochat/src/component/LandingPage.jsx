import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
    useUser,
} from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { MessageCircle, Users, Shield, Zap, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import GoogleTranslate from './GoogleTranslate';
const LandingPage = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    console.log("✅ isLoaded:", isLoaded);
    console.log("✅ isSignedIn:", isSignedIn);
    console.log("🔐 Full User:", user);

    useEffect(() => {
        // Only run when user is loaded and signed in
        if (!isLoaded || !isSignedIn || !user) return;

        const sendUserData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        clerkId: user.id,
                        userName: user.fullName,
                        Email: user.primaryEmailAddress?.emailAddress,
                        profileImg: user.imageUrl
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`User detail sent: ${JSON.stringify(data)}`);
                }
            } catch (error) {
                console.error("Error sending user data:", error);
            }
        };

        sendUserData();
    }, [isLoaded, isSignedIn, user]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
            
            {/* Header */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Webochat</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
                            <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">About</a>
                            <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
                        </nav>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="px-4 py-2 text-green-600 hover:text-green-700 font-medium transition-colors">
                                        Sign In
                                    </button>
                                </SignInButton>
                                <SignInButton mode="modal">
                                    <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        Get Started
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-700">
                                        Welcome, {user?.firstName}!
                                    </span>
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                avatarBox: "w-10 h-10"
                                            }
                                        }}
                                    />
                                </div>
                            </SignedIn>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md">
                            <nav className="flex flex-col space-y-4">
                                <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
                                <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">About</a>
                                <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
                                <div className="pt-4 border-t border-gray-200">
                                    <SignedOut>
                                        <div className="flex flex-col space-y-2">
                                            <SignInButton mode="modal">
                                                <button className="w-full px-4 py-2 text-green-600 hover:text-green-700 font-medium transition-colors text-left">
                                                    Sign In
                                                </button>
                                            </SignInButton>
                                            <SignInButton mode="modal">
                                                <button className="w-full px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg">
                                                    Get Started
                                                </button>
                                            </SignInButton>
                                        </div>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center space-x-3">
                                            <UserButton />
                                            <span className="text-sm text-gray-700">
                                                Welcome, {user?.firstName}!
                                            </span>
                                        </div>
                                    </SignedIn>
                                </div>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column - Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Connect with
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-600">
                                        Everyone
                                    </span>
                                    Instantly
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                    Send messages, make calls, and share moments with friends and family.
                                    Simple, reliable, and secure messaging for everyone.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-xl font-semibold text-lg">
                                            Get Started Free
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    <Link to="/chat"><button className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-xl font-semibold text-lg">
                                        Open Chat
                                    </button></Link>
                                </SignedIn>
                                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full hover:border-green-500 hover:text-green-600 transition-all duration-200 font-semibold text-lg">
                                    Learn More
                                </button>
                            </div>

                            <div className="flex items-center space-x-8 pt-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">2B+</div>
                                    <div className="text-sm text-gray-600">Active Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">180+</div>
                                    <div className="text-sm text-gray-600">Countries</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">100B+</div>
                                    <div className="text-sm text-gray-600">Messages Daily</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Hero Image */}
                        <div className="relative">
                            <div className="relative z-10">
                                {/* Chat Interface Mockup */}
                                <div className="bg-white rounded-3xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Sarah Johnson</div>
                                            <div className="text-sm text-green-500">● Online</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-end">
                                            <div className="bg-green-500 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                                                Hey! How's your day going? 😊
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs">
                                                Amazing! Just finished my presentation. Thanks for asking! 🎉
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="bg-green-500 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                                                That's awesome! Celebration time? 🎊
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Background Elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Our Platform?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Experience the future of communication with our cutting-edge features
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Messaging</h3>
                            <p className="text-gray-600">Send messages instantly with real-time delivery and read receipts</p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Group Chats</h3>
                            <p className="text-gray-600">Create groups and stay connected with friends, family, and colleagues</p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
                            <p className="text-gray-600">Your messages are secured with industry-leading encryption</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-green-500 to-green-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to Start Chatting?
                    </h2>
                    <p className="text-xl text-green-100 mb-8">
                        Join millions of users who trust our platform for their daily communication
                    </p>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-8 py-4 bg-white text-green-600 rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl font-semibold text-lg">
                                Get Started Now
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Link to="/chat">
                            <button className="px-8 py-4 bg-white text-green-600 rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl font-semibold text-lg">
                                Open Chat
                            </button>
                        </Link>
                    </SignedIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold">webochat</span>
                            </div>
                            <p className="text-gray-400 max-w-md">
                                Connecting people around the world with simple, reliable, and secure messaging.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <div className="space-y-2 text-gray-400">
                                <div>Features</div>
                                <div>Security</div>
                                <div>Download</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <div className="space-y-2 text-gray-400">
                                <div>About</div>
                                <div>Careers</div>
                                <div>Contact</div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <GoogleTranslate />
                        <p>&copy; 2025 ChatApp. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;