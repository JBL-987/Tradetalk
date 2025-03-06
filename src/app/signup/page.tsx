"use client";
import { useState } from "react";
import { auth, db } from "@/config/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import Swal from "sweetalert2";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Spline from '@splinetool/react-spline';

export default function Signup() {
  const [isLoaded, setIsLoaded] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await updateProfile(userCredential.user, {
        displayName: formData.username
      });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: formData.username,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        username: result.user.displayName,
        email: result.user.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      
      router.push("/dashboard");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
       <div className="fixed inset-0 w-full h-full -z-10">
        <Spline
          scene="https://prod.spline.design/OImLoQD838hwPx9Z/scene.splinecode" 
          className="w-full h-full object-cover min-w-[100%] min-h-[100%]"
          onLoad={() => setIsLoaded(true)}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-white">Loading 3D...</p>
          </div>
        )}
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-screen p-6">
        <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-md dark:drop-shadow-lg transition-all duration-300">
            Let's make your account first
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
            Please fill in the form below to create your account
          </p>
          
          {error && (
            <div className="bg-red-500/80 text-white p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex flex-col space-y-4 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <div>
                <label htmlFor="username" className="text-white">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-6 py-3 font-medium shadow-lg w-full" 
                />
              </div>
              <div>
                <label htmlFor="email" className="text-white">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-6 py-3 font-medium shadow-lg w-full" 
                />
              </div>
              <div>
                <label htmlFor="password" className="text-white">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6" 
                  required
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white gap-2 px-6 py-3 font-medium shadow-lg w-full" 
                />
              </div>
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white px-6 py-3 font-medium shadow-lg w-full"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
            
            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-white/30"></div>
              <span className="mx-4 text-white">or</span>
              <div className="flex-1 border-t border-white/30"></div>
            </div>
            
            <button 
              onClick={handleGoogleSignup} 
              disabled={loading}
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white px-6 py-3 font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign Up with Google
            </button>
          </div>
          
          <p className="text-white/90">Already have an account? <a href="/login" className="text-white hover:underline transition-all duration-300 ease-out">Sign In now</a></p>
        </main>
        <footer className="absolute bottom-4 text-white/80 text-sm">
          2025 © Chatta. All rights reserved.
        </footer>
      </div>
    </div>
  );
}