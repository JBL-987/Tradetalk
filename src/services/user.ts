import { doc, updateDoc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp, onSnapshot, orderBy, deleteDoc } from "firebase/firestore";
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
  read: boolean;
  isMine?: boolean;
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