"use client";
import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import { Bot, X, Menu, Send, House } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast, Toaster } from "react-hot-toast";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageItem } from "@/components/chat/message-item";
import { getChatCompletion } from "@/lib/openrouter";
import type { Message, Conversation } from "@/types";
import Swal from "sweetalert2";
import Link from "next/link";

const LOCAL_STORAGE_KEY = "conversations";

export default function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: uuidv4(),
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 768);

  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations).map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt)
        }));
        
        setConversations(parsed);
        
        if (parsed.length > 0) {
          setCurrentConversation(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved conversations:", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation.messages]);
  useEffect(() => {
    if (inputRef.current && !isAiResponding) {
      inputRef.current.focus();
    }
  }, [currentConversation.id, isAiResponding]);
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, []);

  const updateCurrentConversation = useCallback((updates: Partial<Conversation>) => {
    setCurrentConversation(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date()
    }));
  }, []);

  const saveCurrentConversation = useCallback(() => {
    if (currentConversation.messages.length === 0) return;

    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.id === currentConversation.id);
      const updatedConversation = {
        ...currentConversation,
        updatedAt: new Date()
      };
      
      if (existingIndex >= 0) {
        return prev.map((conv, i) => i === existingIndex ? updatedConversation : conv);
      } else {
        return [updatedConversation, ...prev];
      }
    });
    
    toast.success("Conversation saved!");
  }, [currentConversation]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Message',
        text: 'Please enter a message before sending.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
    
    const userMessage: Message = {
      id: uuidv4(),
      content: newMessage.trim(),
      role: "user",
      timestamp: new Date()
    };
    
    const updatedMessages = [...currentConversation.messages, userMessage];
    
    if (currentConversation.messages.length === 0) {
      const newTitle = userMessage.content.length > 30 
        ? `${userMessage.content.substring(0, 30)}...` 
        : userMessage.content;
        
      updateCurrentConversation({
        title: newTitle,
        messages: updatedMessages
      });
    } else {
      updateCurrentConversation({
        messages: updatedMessages
      });
    }
    
    setNewMessage("");
    setIsAiResponding(true);
    setError(null);
    
    try {
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const aiResponse = await getChatCompletion(apiMessages);
      
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('Received an empty response from AI');
      }
      
      const aiMessage: Message = {
        id: uuidv4(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      
      updateCurrentConversation({
        messages: finalMessages
      });
      
      const isFirstResponse = updatedMessages.filter(msg => msg.role === "assistant").length === 0;
      
      if (isFirstResponse) {
        saveCurrentConversation();
        toast.success("Conversation started and saved!");
      } else {
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.id === currentConversation.id);
          const updatedConversation = {
            ...currentConversation,
            messages: finalMessages,
            updatedAt: new Date()
          };
          
          if (existingIndex >= 0) {
            return prev.map((conv, i) => i === existingIndex ? updatedConversation : conv);
          } else {
            return [updatedConversation, ...prev];
          }
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Chat Error',
        text: err.message || 'An unexpected error occurred during the chat.',
        confirmButtonText: 'Try Again',
      });
      
      console.error("Error in chat:", err);
      
      updateCurrentConversation({
        messages: currentConversation.messages
      });
    } finally {
      setIsAiResponding(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleNewChat = useCallback(() => {
    if (currentConversation.messages.length > 0) {
      saveCurrentConversation();
    }
    
    setCurrentConversation({
      id: uuidv4(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }, [currentConversation.messages.length, saveCurrentConversation]);
  const selectConversation = useCallback((conversation: Conversation) => {
    if (currentConversation.messages.length > 0) {
      saveCurrentConversation();
    }
    setCurrentConversation(conversation);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [currentConversation.messages.length, saveCurrentConversation]);

  const deleteConversation = useCallback((id: string) => {
    Swal.fire({
      title: 'Delete Conversation',
      text: 'Are you sure you want to delete this conversation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        const remaining = conversations.filter(c => c.id !== id);
        setConversations(remaining);
        
        if (id === currentConversation.id) {
          if (remaining.length > 0) {
            setCurrentConversation(remaining[0]);
          } else {
            handleNewChat();
          }
        }
        
        toast.success("Conversation deleted");
      }
    });
  }, [conversations, currentConversation.id, handleNewChat]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && newMessage.trim() && !isAiResponding) {
        handleSendMessage(e as any);
      }
      if (e.key === 'Escape' && window.innerWidth < 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newMessage, isAiResponding, isSidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Toaster position="top-center" />
      <header className="md:hidden bg-black fixed top-0 left-0 right-0 z-40">
        <div className="flex justify-between items-center p-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-xl font-bold">AI Chat</h1>
          <div className="w-6" />
        </div>
      </header>
      <div className="flex flex-1 pt-16 md:pt-0">
        <div className={`
          fixed inset-0 z-30 md:static md:block
          ${isSidebarOpen ? 'block' : 'hidden'}
          md:w-64 lg:w-80 
          bg-black border-r border-gray-800
        `}>
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelect={selectConversation}
            onDelete={deleteConversation}
            onNew={handleNewChat}
            onSave={saveCurrentConversation}
            formatDate={formatDate}
          />
        </div>
        <div className="flex flex-col flex-1 bg-black">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" passHref>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <House className="h-8 w-8 text-white" />
                </div>
              </Link>
              <h2 className="text-lg font-semibold">Home</h2>
            </div>
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-white" />
              <h2 className="text-lg font-semibold">{currentConversation.title}</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentConversation.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-gray-400">
                <div>
                  <Bot className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-light mb-2">Welcome to AI Chat</h3>
                  <p>Start a conversation by typing a message below</p>
                </div>
              </div>
            ) : (
              currentConversation.messages.map(message => (
                <MessageItem
                  key={message.id}
                  message={message}
                  formatTime={formatTime}
                />
              ))
            )}
            
            {isAiResponding && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-lg p-3 animate-pulse flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  <span className="ml-2">AI is thinking...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/60 text-white p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          <form 
            onSubmit={handleSendMessage} 
            className="p-4 border-t border-gray-800 bg-black"
          >
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message... (Ctrl+Enter to send)"
                className="flex-1 p-3 bg-white text-black border border-white hover:bg-black hover:text-white rounded-xl focus:ring-2 focus:ring-white transition-all duration-300"
                disabled={isAiResponding}
              />
              <button
                type="submit"
                className={`
                  p-3 rounded-xl transition-all duration-300 flex items-center justify-center
                  ${newMessage.trim() && !isAiResponding 
                    ? 'bg-black hover:bg-white hover:text-black text-white border-2 border-white' 
                    : 'bg-white text-black border-2 border-white cursor-not-allowed opacity-50'}
                `}
                disabled={!newMessage.trim() || isAiResponding}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}