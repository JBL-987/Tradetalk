"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { Send, UserPlus, Search, User, Bot, Trash2, ChartCandlestick, Newspaper, Settings, LogOut } from "lucide-react";
import {
  getUserChats,
  addContact,
  createChat,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  deleteMessage,
  Contact,
  ChatMessage,
} from "@/services/user";
import Swal from "sweetalert2";
import Image from "next/image";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [newContactForm, setNewContactForm] = useState({ username: "" });
  const [isAddingContact, setIsAddingContact] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadContacts = async () => {
      try {
        setLoading(true);
        const userChats = await getUserChats(currentUser.uid);
        setContacts(userChats);
      } catch (err: any) {
        console.error("Error loading chats:", err);
        setError(err.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [currentUser]);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    let unsubscribe: () => void;

    try {
      unsubscribe = getChatMessages(chatId, (newMessages) => {
        setMessages(newMessages.map(msg => ({
          ...msg,
          isMine: msg.sender === currentUser.uid,
          timestamp: msg.timestamp?.toDate ? 
            new Date(msg.timestamp.toDate()).toLocaleTimeString() : 
            msg.timestamp
        })));
      });
      markMessagesAsRead(chatId, currentUser.uid);
    } catch (err: any) {
      console.error("Error setting up message listener:", err);
      setError(err.message || "Failed to load messages");
    }

    return () => unsubscribe && unsubscribe();
  }, [chatId, currentUser]);

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newContactForm.username.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const newContact = await addContact(currentUser.uid, newContactForm.username);
      if (newContact) {
        const newChatId = await createChat(currentUser.uid, newContact.id);
        const userChats = await getUserChats(currentUser.uid);
        setContacts(userChats);
        setNewContactForm({ username: "" });
        setIsAddingContact(false);
      }
    } catch (err: any) {
      console.error("Error adding contact:", err);
      setError(err.message || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = async (contact: Contact) => {
    if (!currentUser) return;

    try {
      let activeChatId = contact.id;
      if (!activeChatId && contact.contactId) {
        activeChatId = await createChat(currentUser.uid, contact.contactId);
      }
      if (activeChatId) {
        setChatId(activeChatId);
        setActiveContact(contact);
        markMessagesAsRead(activeChatId, currentUser.uid);
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
      } else {
        throw new Error("Could not establish chat session");
      }
    } catch (err: any) {
      console.error("Error selecting contact:", err);
      setError(err.message || "Failed to open chat");
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    try {
      await sendMessage(chatId, currentUser.uid, newMessage);
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;

    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this message?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteMessage(messageId, currentUser.uid);
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        Swal.fire('Deleted!', 'Your message has been deleted.', 'success');
      }
    } catch (err: any) {
      console.error("Error deleting message:", err);
      Swal.fire('Error', err.message || 'Failed to delete message. Please try again.', 'error');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-black text-white">
        <header className="bg-black text-white p-4 md:p-8 shadow-md border-b border-gray-800">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Image
                src="/logo.png"
                alt="TradeTalk Logo"
                width={100}
                height={100}
                className="h-4 md:h-10 w-auto"
              />
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-800"
                aria-label="Mobile menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {isMenuOpen && (
                <div className="absolute right-4 top-16 w-64 bg-black border border-gray-800 rounded-lg shadow-lg z-50 p-4 flex flex-col space-y-3 animate-fade-in">
                  <button onClick={() => { window.location.href = '/chatbot'; setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><Bot className="h-4 w-4 mr-2" /> Chat with AI</button>
                  <button onClick={() => { window.location.href = '/chart'; setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><ChartCandlestick className="h-4 w-4 mr-2" /> View Prices</button>
                  <button onClick={() => { window.location.href = '/newspages'; setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><Newspaper className="h-4 w-4 mr-2" /> News</button>
                  <button onClick={() => { setIsAddingContact(true); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><UserPlus className="h-4 w-4 mr-2" /> Add Contact</button>
                  <button onClick={() => { window.location.href = '/profile'; setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><User className="h-4 w-4 mr-2" /> profile</button>
                  <button onClick={() => { window.location.href = '/setting'; setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><Settings className="h-4 w-4 mr-2" /> Setting</button>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-900 text-left"><LogOut className="h-4 w-4 mr-2" /> Sign Out</button>
                </div>
              )}
            </div>
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2"
                aria-label="User menu"
                aria-expanded={isMenuOpen}
              >
                <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-800 flex items-center justify-center">
                  {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline">{currentUser?.displayName || "User"}</span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-black ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900">
                      Profile
                    </Link>
                    <Link href="/setting" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900">
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 lg:w-1/4 bg-black border-r border-gray-800 flex flex-col">
            <div className="p-2 md:p-4 border-b border-gray-800">
              <div className="relative mb-2 md:mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 pl-10 pr-4 py-2 text-sm md:text-base font-medium shadow-lg w-full"
                  aria-label="Search contacts"
                />
              </div>
              <div className="hidden md:grid grid-cols-2 gap-2 mb-2 md:mb-4">
                <button onClick={() => { window.location.href = '/chatbot'; }} className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300 text-sm"><Bot className="h-4 w-4 mr-2" />Chat with AI</button>
                <button onClick={() => { window.location.href = '/chart'; }} className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300 text-sm"><ChartCandlestick className="h-4 w-4 mr-2" />View Prices</button>
                <button onClick={() => { window.location.href = '/newspages'; }} className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300 text-sm"><Newspaper className="h-4 w-4 mr-2" />News</button>
                <button onClick={() => setIsAddingContact(true)} className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300 text-sm"><UserPlus className="h-4 w-4 mr-2" />Add Contact</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-400">{error}</div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className={`p-2 md:p-4 border-b border-gray-800 hover:bg-gray-900 cursor-pointer flex items-center ${activeContact?.id === contact.id ? "bg-gray-900" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chat with ${contact.name}`}
                  >
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white text-black flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      {contact.avatar || contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium truncate text-sm md:text-base">{contact.name}</h3>
                        <span className="text-xs text-gray-400">{contact.lastSeen || "—"}</span>
                      </div>
                      <p className="text-gray-400 text-xs md:text-sm truncate">
                        {contact.lastMessage || "Start chatting"}
                      </p>
                    </div>
                    {contact.unread > 0 && (
                      <div className="ml-2 bg-blue-500 rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-xs" aria-label={`${contact.unread} unread messages`}>
                        {contact.unread}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No contacts found. Add a new contact to start chatting!
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-black flex flex-col">
            {activeContact ? (
              <>
                <div className="p-2 md:p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white text-black flex items-center justify-center mr-2 md:mr-3">
                      {activeContact.avatar || activeContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm md:text-base">{activeContact.name}</h3>
                      <p className="text-xs md:text-sm text-gray-400">{activeContact.lastSeen || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 md:p-4" id="messages-container">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`mb-2 md:mb-4 flex group ${message.isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!message.isMine && (
                          <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                            {activeContact.avatar || activeContact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex items-center">
                          <div
                            className={`max-w-xs px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${
                              message.isMine
                                ? "bg-white text-black"
                                : "bg-black text-white border border-gray-800"
                            }`}
                          >
                            <p>{message.text}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {message.timestamp}
                            </p>
                          </div>
                          {message.isMine && (
                            <button 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              aria-label="Delete message"
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm md:text-base">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-2 md:p-4 border-t border-gray-800">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out hover:bg-black hover:text-white hover:border-white gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium shadow-lg w-full"
                      aria-label="Type a message"
                    />
                    <button
                      type="submit"
                      className="ml-2 bg-black border hover:bg-white hover:text-black hover:border-black rounded-full p-1 md:p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <User className="h-12 w-12 md:h-16 md:w-16 text-gray-500 mb-4" />
                <h2 className="text-lg md:text-xl font-semibold mb-2">Select a contact</h2>
                <p className="text-gray-400 max-w-md text-sm md:text-base">
                  Choose a contact from the sidebar to start chatting
                </p>
              </div>
            )}
          </div>
        </div>

        {isAddingContact && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-black rounded-lg max-w-md w-full p-4 md:p-6 border border-gray-800" role="dialog" aria-labelledby="add-contact-title">
              <h2 id="add-contact-title" className="text-lg md:text-xl font-semibold mb-4">Add New Contact</h2>
              {error && <p className="text-red-400 mb-4">{error}</p>}
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label htmlFor="contact-username" className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="contact-username"
                    name="contact-username"
                    value={newContactForm.username}
                    onChange={(e) => setNewContactForm({ username: e.target.value })}
                    required
                    className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 text-sm md:text-base font-medium shadow-lg w-full"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingContact(false); setError(null); }}
                    className="px-3 md:px-4 py-1 md:py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 md:px-4 py-1 md:py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300 text-sm md:text-base disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}