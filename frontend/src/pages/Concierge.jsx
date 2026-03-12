import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Map, Coffee, Languages } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import api from '../api';
import ReactMarkdown from 'react-markdown';

export default function Concierge() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(16).slice(2));
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setMessages([
            { role: 'model', text: "Hi! I'm your Zoomcab Travel Concierge. Where are we heading today?" }
        ]);

        const initBackend = async () => {
            try {
                await api.post('/chatbot/chat', {
                    message: 'connected',
                    sessionId,
                    initContext: 'User opened the concierge page.'
                });
            } catch (err) {
                console.warn('Backend chatbot init failed:', err);
            }
        };
        initBackend();
    }, [sessionId]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const response = await api.post('/chatbot/chat', { message: userMsg, sessionId });
            if (response.data && response.data.text) {
                setMessages(prev => [...prev, { role: 'model', text: response.data.text }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: 'Unexpected response from server.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to brain.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageLayout title="AI Concierge" subtitle="Powered by Gemini AI" noPad>
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', background: 'var(--bg)' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                        >
                            <div style={{
                                maxWidth: '80%', padding: '12px 16px', borderRadius: 16,
                                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                                color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                boxShadow: 'var(--shadow-sm)',
                                whiteSpace: 'pre-wrap',
                                fontSize: 14
                            }}>
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => <p style={{ margin: '0 0 10px 0', lineHeight: 1.5 }} {...props} />,
                                        img: ({ node, ...props }) => <img style={{ maxWidth: '100%', borderRadius: 12, marginTop: 10, display: 'block' }} {...props} />,
                                        ul: ({ node, ...props }) => <ul style={{ margin: '10px 0', paddingLeft: 20 }} {...props} />,
                                        li: ({ node, ...props }) => <li style={{ marginBottom: 6 }} {...props} />
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface2)', width: 'fit-content', fontSize: 12, color: 'var(--text-4)' }}>
                            Thinking...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: 20, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                    <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                background: 'var(--surface2)', color: 'var(--text-1)', outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            style={{
                                padding: '0 20px', borderRadius: 12, border: 'none',
                                background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </PageLayout>
    );
}
