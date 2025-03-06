"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { ArrowLeft, User, Mail, AtSign, Save } from "lucide-react";
import { updateUserProfile } from "@/services/user"; 
import { toast } from "react-hot-toast";

export default function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [userForm, setUserForm] = useState({
    displayName: "",
    email: "",
    username: "",
    bio: ""
  });

  useEffect(() => {
    if (currentUser) {
      setUserForm({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        username: currentUser.username || "",
        bio: currentUser.bio || ""
      });
    }
  }, [currentUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setLoading(true);
      await updateUserProfile(currentUser.uid, userForm);
      
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserForm({
      ...userForm,
      [name]: value
    });
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-black text-white">
        <header className="bg-black text-white p-4 shadow-md border-b border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/dashboard" className="mr-4 hover:text-blue-400 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4 relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-4xl shadow-lg">
                  {currentUser?.displayName ? (
                    currentUser.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-12 w-12" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-semibold">
                {currentUser?.displayName || "User"}
              </h2>
              <p className="text-gray-400">
                {currentUser?.email || "No email"}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={userForm.displayName}
                    onChange={handleChange}
                    className="w-full bg-gray-900 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800 transition-all"
                  />
                </div>
              </div>
              
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleChange}
                    disabled
                    className="w-full bg-gray-900 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800 opacity-70 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              
              <div className="group">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userForm.username}
                    onChange={handleChange}
                    className="w-full bg-gray-900 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800 transition-all"
                    placeholder="Choose a username"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">This is how others can find you</p>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={userForm.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-gray-900 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800 transition-all"
                  placeholder="Tell us about yourself"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md px-4 py-3 transition duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}