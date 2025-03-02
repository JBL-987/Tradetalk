import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createChatroom = async (name: string) => {
  try {
    const docRef = await addDoc(collection(db, "chatrooms"), {
      name: name, 
      users: [],  
      createdAt: serverTimestamp(),
    });
    console.log("Chatroom created with ID:", docRef.id);
    return docRef.id; 
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

const forgotPassword = async (email: string) => {
  if (!email) {
    console.error("Email is required!");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent!");
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

export { forgotPassword, createChatroom };
export { db, auth };
export default app;
