import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Phone, Image as ImageIcon, Smile } from 'lucide-react';
import { socket } from '../api';

const InAppChat = ({ recipientName = 'Driver', onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "I'll be there in 5 minutes!", sender: 'them', timestamp: '10:30 AM' },
        { id: 2, text: "Okay, I'm waiting near the gate.", sender: 'me', timestamp: '10:31 AM' },
        { id: 3, text: 'I can see you!', sender: 'them', timestamp: '10:32 AM' },
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleReply = (data) => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: data.text,
                sender: data.sender || 'them',
                timestamp: data.timestamp
            }]);
        };

        socket.on('chatReply', handleReply);
        return () => socket.off('chatReply', handleReply);
    }, []);

    const handleSend = () => {
        if (inputText.trim()) {
            const newMessage = {
                id: Date.now(),
                text: inputText.trim(),
                sender: 'me',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, newMessage]);
            setInputText('');

            // Emit to the backend AI chatbot
            socket.emit('chatMessage', newMessage);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[24px] sm:bottom-[32px] right-[24px] sm:right-[32px] md:right-[80px] z-[9999] w-[340px] sm:w-[380px] h-[580px] flex flex-col rounded-3xl overflow-hidden"
            style={{
                background: 'rgba(26, 29, 46, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(91,79,232,0.3)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 8px 32px rgba(91, 79, 232, 0.2)'
            }}
        >
            <div className="flex items-center justify-between p-4 border-b bg-[rgba(255,255,255,0.03)] border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #5B4FE8, #7C6EF5)', boxShadow: '0 4px 12px rgba(91,79,232,0.3)' }}>
                        {recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-white font-bold">{recipientName}</div>
                        <div className="text-xs text-[#22c55e] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 rounded-full transition-colors flex items-center justify-center" style={{ background: 'rgba(91,79,232,0.15)' }}>
                        <Phone size={20} style={{ color: '#7C6EF5' }} />
                    </button>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center">
                        <X size={20} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[75%] ${message.sender === 'me' ? 'order-1' : 'order-2'}`}>
                            <div
                                className={`px-4 py-3 rounded-2xl shadow-lg border ${message.sender === 'me'
                                    ? 'text-white rounded-br-sm'
                                    : 'bg-white/10 text-white rounded-bl-sm backdrop-blur-xl border-white/5'
                                    }`}
                                style={message.sender === 'me' ? { background: '#5B4FE8', borderColor: '#7C6EF5' } : {}}
                            >
                                <div className="text-sm">{message.text}</div>
                            </div>
                            <div
                                className={`text-xs text-gray-500 mt-1 px-2 ${message.sender === 'me' ? 'text-right' : 'text-left'
                                    }`}
                            >
                                {message.timestamp}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-6 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
                {["I'm here!", "Almost there.", "Running late...", "Thanks!"].map((reply, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setInputText(reply);
                            setTimeout(handleSend, 100);
                        }}
                        className="px-4 py-2 hover:bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap transition-all backdrop-blur-xl border border-white/10 shadow-sm"
                        style={{ background: 'rgba(91,79,232,0.1)' }}
                    >
                        {reply}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="px-6 pt-4 pb-6 border-t border-white/10 bg-[rgba(0,0,0,0.2)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex shrink-0">
                        <ImageIcon size={20} className="text-gray-400" />
                    </button>
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex shrink-0">
                        <Smile size={20} className="text-gray-400" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 w-full min-w-0 px-4 py-3 bg-white/5 border border-white/10 shadow-inner rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] backdrop-blur-xl transition-all"
                    />
                    <button
                        onClick={handleSend}
                        className="p-3.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0 justify-center shadow-lg"
                        style={{ background: inputText.trim() ? '#5B4FE8' : 'rgba(255,255,255,0.1)' }}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} className="text-white" style={{ transform: 'translateX(-1px) translateY(1px)' }} />
                    </button>
                </div>
            </div>
        </motion.div >
    );
};

export default InAppChat;
