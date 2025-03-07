"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { Send, UserPlus, Search, User, Bot, Trash2, ChartCandlestick, Users, UserMinus } from "lucide-react";
import {
  getUserChats,
  addContact,
  createChat,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  deleteMessage,
  createGroupChat,
  getGroupChats,
  sendGroupMessage,
  getGroupChatMessages,
  markGroupMessagesAsRead,
  deleteGroupMessage,
  addMemberToGroupChat,
  removeMemberFromGroupChat,
  sendGroupInviteNotification,
  Contact,
  ChatMessage,
  GroupChat,
  GroupChatMessage
} from "@/services/user";
import Swal from "sweetalert2";
import Image from "next/image";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [activeGroupChat, setActiveGroupChat] = useState<GroupChat | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [messages, setMessages] = useState<ChatMessage[] | GroupChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [newContactForm, setNewContactForm] = useState({ username: "" });
  const [newGroupForm, setNewGroupForm] = useState({ name: "", members: [] as string[] });
  const [availableMembers, setAvailableMembers] = useState<Contact[]>([]);
  const [isAddingContact, setIsAddingContact] = useState<boolean>(false);
  const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [newMemberUsername, setNewMemberUsername] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabView, setTabView] = useState<'contacts' | 'groups'>('contacts');

  useEffect(() => {
    if (!currentUser) return;

    const loadContactsAndGroups = async () => {
      try {
        setLoading(true);
        const userChats = await getUserChats(currentUser.uid);
        const userGroups = await getGroupChats(currentUser.uid);
        setContacts(userChats);
        setGroupChats(userGroups);
        setAvailableMembers(userChats);
      } catch (err: any) {
        console.error("Error loading chats:", err);
        setError(err.message || "Failed to load contacts and groups");
      } finally {
        setLoading(false);
      }
    };

    loadContactsAndGroups();
  }, [currentUser]);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    let unsubscribe: () => void;

    try {
      if (chatType === 'direct') {
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
      } else {
        unsubscribe = getGroupChatMessages(chatId, (newMessages) => {
          setMessages(newMessages.map(msg => ({
            ...msg,
            isMine: msg.sender === currentUser.uid,
            timestamp: msg.timestamp?.toDate ? 
              new Date(msg.timestamp.toDate()).toLocaleTimeString() : 
              msg.timestamp
          })));
        });
        markGroupMessagesAsRead(chatId, currentUser.uid);
      }
    } catch (err: any) {
      console.error("Error setting up message listener:", err);
      setError(err.message || "Failed to load messages");
    }

    return () => unsubscribe && unsubscribe();
  }, [chatId, chatType, currentUser]);

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

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newGroupForm.name.trim() || newGroupForm.members.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      const groupId = await createGroupChat(currentUser.uid, newGroupForm.name, newGroupForm.members);
      if (groupId) {
        const userGroups = await getGroupChats(currentUser.uid);
        setGroupChats(userGroups);
        setNewGroupForm({ name: "", members: [] });
        setIsAddingGroup(false);
      }
    } catch (err: any) {
      console.error("Error creating group chat:", err);
      setError(err.message || "Failed to create group chat");
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
        setActiveGroupChat(null);
        setChatType('direct');
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

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeGroupChat || !newMemberUsername.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const userQuery = await addContact(currentUser.uid, newMemberUsername);
      const newMemberId = userQuery.id;
      if (activeGroupChat.members.includes(newMemberId)) {
        throw new Error("User is already a member of this group");
      }
      await addMemberToGroupChat(activeGroupChat.id, newMemberId);
      await sendGroupInviteNotification(newMemberId, activeGroupChat.id, activeGroupChat.name);
      const updatedGroups = await getGroupChats(currentUser.uid);
      setGroupChats(updatedGroups);
      const updatedActiveGroup = updatedGroups.find(g => g.id === activeGroupChat.id);
      if (updatedActiveGroup) setActiveGroupChat(updatedActiveGroup);
      setNewMemberUsername("");
      setIsAddingMember(false);
      Swal.fire('Success!', 'Member has been added to the group.', 'success');
    } catch (err: any) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = async (group: GroupChat) => {
    if (!currentUser) return;

    try {
      setChatId(group.id);
      setActiveGroupChat(group);
      setActiveContact(null);
      setChatType('group');
      markGroupMessagesAsRead(group.id, currentUser.uid);
      setGroupChats(prev => prev.map(g => g.id === group.id ? { ...g, unread: 0 } : g));
    } catch (err: any) {
      console.error("Error selecting group:", err);
      setError(err.message || "Failed to open group chat");
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    try {
      if (chatType === 'direct') {
        await sendMessage(chatId, currentUser.uid, newMessage);
      } else {
        await sendGroupMessage(chatId, currentUser.uid, currentUser.displayName || "User", newMessage);
      }
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
        if (chatType === 'direct') {
          await deleteMessage(messageId, currentUser.uid);
        } else {
          await deleteGroupMessage(messageId, currentUser.uid);
        }
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        Swal.fire('Deleted!', 'Your message has been deleted.', 'success');
      }
    } catch (err: any) {
      console.error("Error deleting message:", err);
      Swal.fire('Error', err.message || 'Failed to delete message. Please try again.', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentUser || !activeGroupChat) return;

    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to leave or delete the group "${activeGroupChat.name}"? If you're the creator and last member, the group will be deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, proceed!'
      });

      if (result.isConfirmed) {
        await removeMemberFromGroupChat(activeGroupChat.id, currentUser.uid, currentUser.uid);
        const updatedGroups = await getGroupChats(currentUser.uid);
        setGroupChats(updatedGroups);
        setActiveGroupChat(null);
        setChatId(null);
        setMessages([]);
        Swal.fire('Success!', 'You have left the group or it has been deleted.', 'success');
      }
    } catch (err: any) {
      console.error("Error deleting group:", err);
      Swal.fire('Error', err.message || 'Failed to delete group. Please try again.', 'error');
    }
  };

  const handleMemberSelection = (contactId: string) => {
    setNewGroupForm(prev => ({
      ...prev,
      members: prev.members.includes(contactId)
        ? prev.members.filter(id => id !== contactId)
        : [...prev.members, contactId]
    }));
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGroups = groupChats.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-black text-white">
        {/* Header */}
        <header className="bg-black text-white p-8 shadow-md border-b border-gray-800">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center absolute left-4 space-x-4 md:space-x-8">
              <Image
                src="/logo.png"
                alt="TradeTalk Logo"
                width={100}
                height={100}
                className="h-16 w-auto"
              />
            </div>
            <div className="absolute right-6">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2"
                aria-label="User menu"
                aria-expanded={isMenuOpen}
              >
                <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
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

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-black border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 font-medium shadow-lg w-full"
                  aria-label="Search contacts and groups"
                />
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setTabView('contacts')}
                  className={`flex-1 py-2 rounded-lg transition-colors duration-200 ${tabView === 'contacts' ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}
                >
                  <User className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs">Contacts</span>
                </button>
                <button
                  onClick={() => setTabView('groups')}
                  className={`flex-1 py-2 rounded-lg transition-colors duration-200 ${tabView === 'groups' ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}
                >
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs">Groups</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => { window.location.href = '/chatbot'; }}
                  className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300"
                  aria-label="Chat with AI"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Chat with AI
                </button>
                <button
                  onClick={() => { window.location.href = '/chart'; }}
                  className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300"
                  aria-label="View Prices"
                >
                  <ChartCandlestick className="h-4 w-4 mr-2" />
                  View Prices
                </button>
              </div>

              {/* Add Contact/Group Button */}
              <div className="flex space-x-4 mb-4">
                {tabView === 'contacts' ? (
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300"
                    aria-label="Add new contact"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Contact
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddingGroup(true)}
                    className="flex items-center justify-center w-full bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-4 py-2 transition duration-300"
                    aria-label="Create new group"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Create New Group
                  </button>
                )}
              </div>
            </div>

            {/* Contacts/Groups List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-400">{error}</div>
              ) : tabView === 'contacts' ? (
                filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className={`p-4 border-b border-gray-800 hover:bg-gray-900 cursor-pointer flex items-center ${activeContact?.id === contact.id ? "bg-gray-900" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Chat with ${contact.name}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center mr-3 flex-shrink-0">
                        {contact.avatar || contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-medium truncate">{contact.name}</h3>
                          <span className="text-xs text-gray-400">{contact.lastSeen || "—"}</span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">
                          {contact.lastMessage || "Start chatting"}
                        </p>
                      </div>
                      {contact.unread > 0 && (
                        <div className="ml-2 bg-blue-500 rounded-full h-5 w-5 flex items-center justify-center text-xs" aria-label={`${contact.unread} unread messages`}>
                          {contact.unread}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No contacts found. Add a new contact to start chatting!
                  </div>
                )
              ) : (
                filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className={`p-4 border-b border-gray-800 hover:bg-gray-900 cursor-pointer flex items-center ${activeGroupChat?.id === group.id ? "bg-gray-900" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Chat in ${group.name} group`}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 flex-shrink-0">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-medium truncate">{group.name}</h3>
                          <span className="text-xs text-gray-400">
                            {group.lastMessageTimestamp?.toDate ? 
                              new Date(group.lastMessageTimestamp.toDate()).toLocaleTimeString() : 
                              "—"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">
                          {group.lastMessage ? (
                            <>
                              {group.lastMessageSender !== currentUser?.uid && (
                                <span className="font-medium">
                                  {group.lastMessageSender?.split(' ')[0] || "Someone"}: 
                                </span>
                              )}
                              {' '}{group.lastMessage}
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </p>
                      </div>
                      {group.unread > 0 && (
                        <div className="ml-2 bg-blue-500 rounded-full h-5 w-5 flex items-center justify-center text-xs" aria-label={`${group.unread} unread messages`}>
                          {group.unread}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No groups found. Create a new group to start chatting!
                  </div>
                )
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="hidden md:flex flex-col flex-1 bg-black">
            {(activeContact || activeGroupChat) ? (
              <>
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${activeGroupChat ? "bg-blue-600" : "bg-white text-black"} flex items-center justify-center mr-3`}>
                      {activeGroupChat 
                        ? activeGroupChat.name.charAt(0).toUpperCase()
                        : (activeContact?.avatar || activeContact?.name.charAt(0).toUpperCase())
                      }
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {activeGroupChat ? activeGroupChat.name : activeContact?.name}
                      </h3>
                      {activeGroupChat ? (
                        <p className="text-sm text-gray-400">
                          {activeGroupChat.members?.length || 0} members
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">{activeContact?.lastSeen || "—"}</p>
                      )}
                    </div>
                  </div>
                  {activeGroupChat && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsAddingMember(true)}
                        className="flex items-center bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-3 py-1 transition duration-300"
                        aria-label="Add member to group"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        <span className="text-sm">Add</span>
                      </button>
                      <button
                        onClick={handleDeleteGroup}
                        className="flex items-center bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full px-3 py-1 transition duration-300"
                        aria-label="Delete or leave group"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        <span className="text-sm">Leave</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4" id="messages-container">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`mb-4 flex group ${message.isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!message.isMine && (
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                            {activeGroupChat ? 
                              ((message as GroupChatMessage).senderName?.charAt(0).toUpperCase() || "?") : 
                              (activeContact?.avatar || activeContact?.name.charAt(0).toUpperCase())
                            }
                          </div>
                        )}
                        <div className="flex items-center">
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.isMine
                                ? "bg-white text-black"
                                : "bg-black text-white border border-gray-800"
                            }`}
                          >
                            {activeGroupChat && !message.isMine && (
                              <p className="text-xs font-medium text-blue-400 mb-1">
                                {(message as GroupChatMessage).senderName || "User"}
                              </p>
                            )}
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
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out hover:bg-black hover:text-white hover:border-white gap-2 px-6 py-3 font-medium shadow-lg w-full"
                      aria-label="Type a message"
                    />
                    <button
                      type="submit"
                      className="ml-2 bg-black border hover:bg-white hover:text-black hover:border-black rounded-full p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Send message"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                {tabView === 'contacts' ? (
                  <>
                    <User className="h-16 w-16 text-gray-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Select a contact</h2>
                    <p className="text-gray-400 max-w-md">
                      Choose a contact from the sidebar to start chatting
                    </p>
                  </>
                ) : (
                  <>
                    <Users className="h-16 w-16 text-gray-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Select a group</h2>
                    <p className="text-gray-400 max-w-md">
                      Choose a group from the sidebar or create a new one to start chatting
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Contact Modal */}
        {isAddingContact && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-black rounded-lg max-w-md w-full p-6 border border-gray-800" role="dialog" aria-labelledby="add-contact-title">
              <h2 id="add-contact-title" className="text-xl font-semibold mb-4">Add New Contact</h2>
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
                    className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 font-medium shadow-lg w-full"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingContact(false); setError(null); }}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {isAddingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-black rounded-lg max-w-md w-full p-6 border border-gray-800" role="dialog" aria-labelledby="add-member-title">
              <h2 id="add-member-title" className="text-xl font-semibold mb-4">Add Member to Group</h2>
              {error && <p className="text-red-400 mb-4">{error}</p>}
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="member-username" className="block text-sm font-medium text-gray-300 mb-1">
                    Enter Username
                  </label>
                  <input
                    type="text"
                    id="member-username"
                    name="member-username"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    required
                    className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 font-medium shadow-lg w-full"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingMember(false); setError(null); setNewMemberUsername(""); }}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Group Modal */}
        {isAddingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-black rounded-lg max-w-md w-full p-6 border border-gray-800" role="dialog" aria-labelledby="add-group-title">
              <h2 id="add-group-title" className="text-xl font-semibold mb-4">Create New Group</h2>
              {error && <p className="text-red-400 mb-4">{error}</p>}
              <form onSubmit={handleAddGroup} className="space-y-4">
                <div>
                  <label htmlFor="group-name" className="block text-sm font-medium text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="group-name"
                    name="group-name"
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    required
                    className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 font-medium shadow-lg w-full"
                  />
                </div>
                <div>
                  <label htmlFor="group-members" className="block text-sm font-medium text-gray-300 mb-1">
                    Select Members
                  </label>
                  <div className="space-y-2">
                    {availableMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          checked={newGroupForm.members.includes(member.id)}
                          onChange={() => handleMemberSelection(member.id)}
                          className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-4 py-2 font-medium shadow-lg"
                        />
                        <label htmlFor={`member-${member.id}`} className="text-gray-300">
                          {member.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingGroup(false); setError(null); }}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-white hover:bg-black hover:text-white hover:border-white border border-gray-800 text-black rounded-full transition duration-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Group"}
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