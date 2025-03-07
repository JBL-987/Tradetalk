import { doc, updateDoc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp, onSnapshot, orderBy, deleteDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "@/config/firebase";

export interface UserProfileData {
  displayName?: string;
  username?: string;
  bio?: string;
  [key: string]: any;
}

export interface UserSettingsData {
  notifications?: boolean;
  soundEffects?: boolean;
  readReceipts?: boolean;
  twoFactorAuth?: boolean;
  [key: string]: any;
}

export interface Contact {
  id: string;
  contactId: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastSeen?: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: any;
  isMine?: boolean;
}

export interface GroupChat {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: any;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTimestamp?: any;
  updatedAt: any;
  unread?: number;
}

export interface GroupChatMessage {
  id: string;
  chatId: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: any;
  isMine?: boolean;
  readBy?: string[];
}


export const updateUserProfile = async (userId: string, data: UserProfileData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      displayName: data.displayName,
      username: data.username,
      bio: data.bio,
      updatedAt: new Date()
    });
    if (auth.currentUser && data.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const updateUserSettings = async (userId: string, settings: UserSettingsData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      settings: settings,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!email) {
    throw new Error("Email is required");
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const getUserChats = async (userId: string): Promise<Contact[]> => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    const chats: Contact[] = [];
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();
      const chatId = chatDoc.id;
      const otherParticipantId = chatData.participants.find((id: string) => id !== userId);
      if (otherParticipantId) {
        try {
          const participantDetails = chatData.participantDetails?.[otherParticipantId] || {};
          const unreadQuery = query(
            collection(db, "messages"),
            where("chatId", "==", chatId),
            where("sender", "==", otherParticipantId),
            where("read", "==", false)
          );
          const unreadSnapshot = await getDocs(unreadQuery);
          const lastMessageQuery = query(
            collection(db, "messages"),
            where("chatId", "==", chatId),
            orderBy("timestamp", "desc")
          );
          const lastMessageSnapshot = await getDocs(lastMessageQuery);
          const lastMessage = lastMessageSnapshot.docs[0]?.data();
          chats.push({
            id: chatId,
            contactId: otherParticipantId,
            name: participantDetails.displayName || "Unknown User",
            avatar: participantDetails.photoURL || null,
            lastMessage: lastMessage?.text || null,
            unread: unreadSnapshot.docs.length
          });
        } catch (error) {
          console.error(`Error processing chat ${chatId}:`, error);
        }
      }
    }
    return chats;
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
};

export const addContact = async (userId: string, username: string) => {
  if (!userId || !username) {
    throw new Error("User ID and username are required");
  }

  try {
    const userQuery = query(
      collection(db, "users"),
      where("username", "==", username.trim())
    );
    const userSnapshot = await getDocs(userQuery); 
    if (userSnapshot.empty) {
      throw new Error("User not found");
    }
    const contactData = userSnapshot.docs[0].data();
    const contactId = userSnapshot.docs[0].id;
    if (contactId === userId) {
      throw new Error("You cannot add yourself as a contact");
    }
    const chatId = await createChat(userId, contactId);
    return {
      id: contactId,
      chatId: chatId,
      name: contactData.displayName || contactData.username || "Unknown User",
      avatar: contactData.photoURL || null,
      lastSeen: contactData.lastSeen ? new Date(contactData.lastSeen.toDate()).toLocaleString() : null
    };
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
};

export const createChat = async (userId: string, contactId: string): Promise<string> => {
  if (!userId || !contactId) {
    throw new Error("Both user IDs are required");
  }
  try {
    const chatQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );
    const chatsSnapshot = await getDocs(chatQuery);
    for (const doc of chatsSnapshot.docs) {
      const participants = doc.data().participants;
      if (participants.includes(contactId)) {
        return doc.id; 
      }
    }
  
    const userDoc = await getDoc(doc(db, "users", userId));
    const contactDoc = await getDoc(doc(db, "users", contactId));
    const userData = userDoc.data() || {};
    const contactData = contactDoc.data() || {};
    const participantDetails = {
      [userId]: {
        displayName: userData.displayName || userData.username || "User",
        photoURL: userData.photoURL || null  
      },
      [contactId]: {
        displayName: contactData.displayName || contactData.username || "Contact",
        photoURL: contactData.photoURL || null  
      }
    };

    const newChatRef = await addDoc(collection(db, "chats"), {
      participants: [userId, contactId],
      participantDetails: participantDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newChatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  if (!chatId || !senderId || !text) {
    throw new Error("Chat ID, sender ID, and message text are required");
  }
  try {
    await addDoc(collection(db, "messages"), {
      chatId,
      sender: senderId,
      text,
      timestamp: serverTimestamp(),
      read: false
    });
    
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastMessageSender: senderId,
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getChatMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  try {
    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      
      callback(messages);
    });
  } catch (error) {
    console.error("Error getting chat messages:", error);
    throw error;
  }
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  if (!chatId || !userId) {
    throw new Error("Chat ID and user ID are required");
  }
  try {
    const unreadQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      where("sender", "!=", userId),
      where("read", "==", false)
    );
    const unreadSnapshot = await getDocs(unreadQuery);
    const updatePromises = unreadSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

export const getContacts = async (userId: string): Promise<Contact[]> => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const usersSnapshot = await getDocs(collection(db, "users")); 
    const contacts: Contact[] = [];
    for (const userDoc of usersSnapshot.docs) {
      if (userDoc.id !== userId) {
        const userData = userDoc.data();
        contacts.push({
          id: userDoc.id,
          contactId: userDoc.id,
          name: userData.displayName || userData.username || "Unknown User",
          avatar: userData.photoURL,
          unread: 0
        });
      }
    }
    
    return contacts;
  } catch (error) {
    console.error("Error getting contacts:", error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string, currentUserId: string) => {
  if (!messageId) {
    throw new Error("Message ID is required");
  }
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageDoc = await getDoc(messageRef);
    if (!messageDoc.exists()) {
      throw new Error("Message not found");
    }
    const messageData = messageDoc.data();
    if (messageData?.sender !== currentUserId) {
      throw new Error("You can only delete your own messages");
    }
    await deleteDoc(messageRef);
    return true;
  } catch (error: any) {
    console.error("Error deleting message:", error);
    if (error.code === 'permission-denied') {
      throw new Error("You do not have permission to delete this message");
    }

    throw error;
  }
};

export const createGroupChat = async (userId: string, groupName: string, memberIds: string[]) => {
  if (!userId || !groupName || !memberIds.length) {
    throw new Error("Creator ID, group name and at least one member are required");
  }
  
  try {
    // Get member details for display in UI
    const memberDetails: {[key: string]: any} = {};
    for (const memberId of [...memberIds, userId]) {
      const memberDoc = await getDoc(doc(db, "users", memberId));
      const memberData = memberDoc.data() || {};
      memberDetails[memberId] = {
        displayName: memberData.displayName || memberData.username || "User",
        photoURL: memberData.photoURL || null
      };
    }
    
    // Create the group chat document
    const newGroupChatRef = await addDoc(collection(db, "groupchats"), {
      name: groupName,
      createdBy: userId,
      members: [...memberIds, userId], // Include creator in members
      memberDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageSender: null,
      lastMessageTimestamp: null
    });
    
    return newGroupChatRef.id;
  } catch (error) {
    console.error("Error creating group chat:", error);
    throw error;
  }
};

export const getGroupChats = async (userId: string): Promise<GroupChat[]> => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    const groupChatsQuery = query(
      collection(db, "groupchats"),
      where("members", "array-contains", userId)
    );
    
    const groupChatsSnapshot = await getDocs(groupChatsQuery);
    const groupChats: GroupChat[] = [];
    
    for (const groupChatDoc of groupChatsSnapshot.docs) {
      const chatData = groupChatDoc.data();
      
      // Simplified query to just get all messages for this chat
      const messagesQuery = query(
        collection(db, "groupmessages"),
        where("chatId", "==", groupChatDoc.id)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Count unread messages client-side
      const unreadCount = messagesSnapshot.docs.filter(doc => {
        const msgData = doc.data();
        return msgData.sender !== userId && 
               (!msgData.readBy || !msgData.readBy.includes(userId));
      }).length;
      
      groupChats.push({
        id: groupChatDoc.id,
        name: chatData.name,
        createdBy: chatData.createdBy,
        members: chatData.members,
        createdAt: chatData.createdAt,
        lastMessage: chatData.lastMessage,
        lastMessageSender: chatData.lastMessageSender,
        lastMessageTimestamp: chatData.lastMessageTimestamp,
        updatedAt: chatData.updatedAt,
        unread: unreadCount
      });
    }
    
    return groupChats;
  } catch (error) {
    console.error("Error getting group chats:", error);
    throw error;
  }
};

export const sendGroupMessage = async (chatId: string, senderId: string, senderName: string, text: string) => {
  if (!chatId || !senderId || !text) {
    throw new Error("Chat ID, sender ID, and message text are required");
  }
  
  try {
    // Get the group chat to find all members
    const groupChatRef = doc(db, "groupchats", chatId);
    const groupChatDoc = await getDoc(groupChatRef);
    
    if (!groupChatDoc.exists()) {
      throw new Error("Group chat not found");
    }
    
    const groupChatData = groupChatDoc.data();
    const members = groupChatData.members || [];
    
    // Add message to groupmessages collection
    const messageRef = await addDoc(collection(db, "groupmessages"), {
      chatId,
      sender: senderId,
      senderName: senderName,
      text,
      timestamp: serverTimestamp(),
      readBy: [senderId] // Initially read only by sender
    });
    
    // Update the group chat with latest message info
    await updateDoc(groupChatRef, {
      lastMessage: text,
      lastMessageSender: senderId,
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return messageRef.id;
  } catch (error) {
    console.error("Error sending group message:", error);
    throw error;
  }
};

export const getGroupChatMessages = (chatId: string, callback: (messages: GroupChatMessage[]) => void) => {
  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  try {
    // Simplified query that only requires a basic composite index
    const messagesQuery = query(
      collection(db, "groupmessages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GroupChatMessage[];
      
      callback(messages);
    });
  } catch (error) {
    console.error("Error getting group chat messages:", error);
    throw error;
  }
};

export const markGroupMessagesAsRead = async (chatId: string, userId: string) => {
  if (!chatId || !userId) {
    throw new Error("Chat ID and user ID are required");
  }
  
  try {
    // Fix: The query should look for messages where userId is NOT in readBy array
    const unreadQuery = query(
      collection(db, "groupmessages"),
      where("chatId", "==", chatId),
      where("sender", "!=", userId) // Only mark messages from others as read
    );
    
    const unreadSnapshot = await getDocs(unreadQuery);
    const updatePromises = unreadSnapshot.docs
      .filter(doc => {
        // Check if user is not in readBy array
        const data = doc.data();
        return !data.readBy || !data.readBy.includes(userId);
      })
      .map(doc => 
        updateDoc(doc.ref, { 
          readBy: arrayUnion(userId) 
        })
      );
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    return true;
  } catch (error) {
    console.error("Error marking group messages as read:", error);
    throw error;
  }
};

export const addMemberToGroupChat = async (chatId: string, userId: string) => {
  if (!chatId || !userId) {
    throw new Error("Chat ID and user ID are required");
  }
  
  try {
    const groupChatRef = doc(db, "groupchats", chatId);
    const groupChatDoc = await getDoc(groupChatRef);
    
    if (!groupChatDoc.exists()) {
      throw new Error("Group chat not found");
    }
    
    // Get user details to add to memberDetails
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data() || {};
    const userDetails = {
      displayName: userData.displayName || userData.username || "User",
      photoURL: userData.photoURL || null
    };
    
    // Update the group chat document
    await updateDoc(groupChatRef, {
      members: arrayUnion(userId),
      [`memberDetails.${userId}`]: userDetails,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error adding member to group chat:", error);
    throw error;
  }
};

export const removeMemberFromGroupChat = async (chatId: string, userId: string, currentUserId: string) => {
  if (!chatId || !userId) {
    throw new Error("Chat ID and user ID are required");
  }
  
  try {
    const groupChatRef = doc(db, "groupchats", chatId);
    const groupChatDoc = await getDoc(groupChatRef);
    
    if (!groupChatDoc.exists()) {
      throw new Error("Group chat not found");
    }
    
    const groupData = groupChatDoc.data();
    
    // Check if current user is the creator or removing themselves
    if (groupData.createdBy !== currentUserId && currentUserId !== userId) {
      throw new Error("Only the group creator can remove other members");
    }
    
    // If creator is leaving, need to transfer ownership or delete group
    if (userId === groupData.createdBy && groupData.members.length > 1) {
      // Find a new creator (first member who isn't current creator)
      const newCreator = groupData.members.find((id: string) => id !== userId);
      
      // Update owner and remove member
      await updateDoc(groupChatRef, {
        members: arrayRemove(userId),
        createdBy: newCreator,
        updatedAt: serverTimestamp()
      });
    } else if (userId === groupData.createdBy && groupData.members.length <= 1) {
      // Last person leaving, delete the group chat
      await deleteDoc(groupChatRef);
    } else {
      // Regular member leaving
      await updateDoc(groupChatRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error removing member from group chat:", error);
    throw error;
  }
};

export const updateGroupChatName = async (chatId: string, newName: string, currentUserId: string) => {
  if (!chatId || !newName) {
    throw new Error("Chat ID and new name are required");
  }
  
  try {
    const groupChatRef = doc(db, "groupchats", chatId);
    const groupChatDoc = await getDoc(groupChatRef);
    
    if (!groupChatDoc.exists()) {
      throw new Error("Group chat not found");
    }
    
    // Check if current user is the creator
    const groupData = groupChatDoc.data();
    if (groupData.createdBy !== currentUserId) {
      throw new Error("Only the group creator can change the group name");
    }
    
    await updateDoc(groupChatRef, {
      name: newName,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating group chat name:", error);
    throw error;
  }
};

export const deleteGroupMessage = async (messageId: string, currentUserId: string) => {
  if (!messageId) {
    throw new Error("Message ID is required");
  }
  
  try {
    const messageRef = doc(db, "groupmessages", messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error("Message not found");
    }
    
    const messageData = messageDoc.data();
    
    // Check if current user is the sender
    if (messageData.sender !== currentUserId) {
      throw new Error("You can only delete your own messages");
    }
    
    await deleteDoc(messageRef);
    return true;
  } catch (error: any) {
    console.error("Error deleting group message:", error);
    if (error.code === 'permission-denied') {
      throw new Error("You do not have permission to delete this message");
    }
    
    throw error;
  }
};

export const sendGroupInviteNotification = async (userId: string, groupId: string, groupName: string) => {
  await addDoc(collection(db, "notifications"), {
    userId,
    type: "group_invite",
    groupId,
    groupName,
    message: `You have been invited to join ${groupName}`,
    createdAt: serverTimestamp(),
    read: false
  });
};