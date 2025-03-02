"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { ArrowLeft, Upload, User, Mail, AtSign, Save } from "lucide-react";
import { updateUserProfile } from "@/services/user"; 

export default function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    displayName: "",
    email: "",
    username: "",
    bio: ""
  });

  useEffect(() => {
    if (currentUser) {
      // Populate form with current user data
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
      setError(null);
      
      // Call your API to update user profile
      await updateUserProfile(currentUser.uid, userForm);
      
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
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
        <header className="bg-black text-white p-4 shadow-md border-b border-gray-800">
          <div className="container mx-auto flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl">
                  {currentUser?.displayName ? (
                    currentUser.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-12 w-12" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors">
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold">
                {currentUser?.displayName || "User"}
              </h2>
              <p className="text-gray-400">
                {currentUser?.email || "No email"}
              </p>
            </div>
            
            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="p-3 bg-green-600 bg-opacity-20 border border-green-500 text-green-500 rounded">
                  {success}
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-600 bg-opacity-20 border border-red-500 text-red-500 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={userForm.displayName}
                    onChange={handleChange}
                    className="w-full bg-gray-900 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800"
                  />
                </div>
              </div>
              
              <div>
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
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userForm.username}
                    onChange={handleChange}
                    className="w-full bg-gray-900 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800"
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
                  className="w-full bg-gray-900 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-800"
                  placeholder="Tell us about yourself"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 transition duration-300 flex items-center justify-center disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    "Saving..."
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