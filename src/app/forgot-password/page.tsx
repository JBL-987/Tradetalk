"use client";
import { useState } from "react";
import { auth } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Spline from '@splinetool/react-spline';

export default function ForgotPassword() {
    const [isLoaded, setIsLoaded] = useState(true);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
      try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({
        icon: "success",
        title: "Email Sent",
        text: "A password reset link has been sent to your email address.",
        confirmButtonText: "Back to Login"
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No account found with this email address.",
        });
      } else if (err.code === 'auth/invalid-email') {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Invalid email format.",
        });
      } else if (err.code === 'auth/too-many-requests') {
        Swal.fire({
          icon: "error",
          title: "Too Many Attempts",
          text: "Too many password reset attempts. Please try again later.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: `${err.message}`,
        });
      }
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
            Forgot Password
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
            Please fill the email address to reset your password
          </p>
          {error && (
            <div className="bg-red-500/80 text-white p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col space-y-4 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <div>
                <label htmlFor="email" className="text-white">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={email}
                  onChange={handleChange} 
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
                  {loading ? "Sending to your email in..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </main>
        <footer className="absolute bottom-4 text-white/80 text-sm">
          2025 © TradeTalk. All rights reserved.
        </footer>
      </div>
    </div>
    );
}