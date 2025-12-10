"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiRobot, PiX, PiPaperPlaneTilt, PiSpinner, PiUserPlus } from 'react-icons/pi';
import { IconStarFilled } from '@tabler/icons-react';
import LeadCaptureForm from './lead-capture-form';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AI_RESPONSES = {
  greeting: "Hi! I'm your AdsStarter AI assistant. How can I help you today?",
  services: "We offer comprehensive digital marketing services:\n\n🚀 Facebook, Instagram & TikTok Ads\n🎯 Google PPC & YouTube Ads\n🛠️ Funnel Strategy & Landing Page Creation\n📧 Email Marketing & Retargeting\n✍️ Ad Copywriting & Creative Strategy\n🤖 Creative Strategy & Email Automations\n\nWant to discuss your specific needs?",
  pricing: "We have three pricing tiers:\n\n🚀 **Starter** - £497/mo\n💼 **Growth** - £997/mo\n👑 **Empire** - £1,997/mo\n\nReady to get a custom quote?",
  booking: "Perfect! I can help you book a free strategy call. Let me get your details first so we can prepare for our call.\n\n📅 Book directly: https://calendly.com/khamareclarke/new-meeting\n📞 Or call: (519)-400-200",
  process: "Our 3-step launch method:\n\n1️⃣ **Strategize** - Analyze goals and market\n2️⃣ **Launch & Optimize** - Test and optimize campaigns\n3️⃣ **Scale Results** - Drive measurable growth\n\n325+ clients scaled! Want to discuss your specific situation?",
  guarantees: "We guarantee:\n\n⚡ Fast Delivery (1-2 weeks)\n💬 24/7 Support\n💸 Affordable Pricing\n\nEmpire plan: ROI guarantee! Ready to get started?",
  default: "I can help with:\n• Services & pricing\n• Booking calls\n• Our process\n• Guarantees\n\nWhat interests you most?"
};

const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Tell me about your pricing",
  "I want to book a call",
  "What's your process?",
  "What guarantees do you provide?"
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: AI_RESPONSES.greeting,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('service') || message.includes('offer') || message.includes('what do you do')) {
      return AI_RESPONSES.services;
    } else if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
      return AI_RESPONSES.pricing;
    } else if (message.includes('book') || message.includes('call') || message.includes('meeting') || message.includes('schedule') || message.includes('i want to book')) {
      return AI_RESPONSES.booking;
    } else if (message.includes('process') || message.includes('method') || message.includes('how do you work')) {
      return AI_RESPONSES.process;
    } else if (message.includes('guarantee') || message.includes('promise') || message.includes('support')) {
      return AI_RESPONSES.guarantees;
    } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return AI_RESPONSES.greeting;
    } else {
      return AI_RESPONSES.default;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2 }}
      >
        <PiRobot className="w-8 h-8 text-white" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">AI</span>
        </div>
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Chat Container */}
            <motion.div
              className="relative w-full max-w-sm bg-[#181C22] rounded-2xl shadow-2xl border border-[#232c3b] overflow-hidden"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <PiRobot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">AdsStarter AI</h3>
                    <p className="text-white/80 text-xs">Online now</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <PiX className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="h-48 overflow-y-auto p-3 space-y-2">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                          : 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 p-2.5 rounded-xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions - Always Visible */}
              <div className="p-3 border-t border-[#232c3b] bg-[#1a1f26]">
                <p className="text-white/60 text-xs mb-2">Quick questions:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left p-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                
                {/* Lead Capture Button */}
                <motion.button
                  onClick={() => setIsLeadFormOpen(true)}
                  className="w-full mt-3 p-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 text-white text-sm font-bold rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <PiUserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Get Free Strategy Call</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </motion.button>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#232c3b]">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-[#232c3b] text-white placeholder-white/50 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg hover:from-blue-600 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isTyping ? (
                      <PiSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <PiPaperPlaneTilt className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Capture Form */}
      <LeadCaptureForm
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        title="Get Your Free Strategy Call"
        subtitle="Fill out the form below and we'll get back to you within 24 hours"
      />
    </>
  );
}
