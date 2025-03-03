"use client";
import { useState } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { ArrowLeft, Bell, Moon, Shield, Key, LogOut, ToggleLeft, ToggleRight } from "lucide-react";
import { updateUserSettings, resetPassword } from "@/services/user"; // Anda perlu membuat service ini

export default function Settings() {
  const { currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    soundEffects: true,
    readReceipts: true,
    twoFactorAuth: false
  });

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
    handleSaveSettings(setting, !settings[setting]);
  };

  const handleSaveSettings = async (setting: string, value: boolean) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      await updateUserSettings(currentUser.uid, { [setting]: value });
      
    } catch (err: any) {
      console.error("Error updating settings:", err);
      setError(err.message || "Failed to update settings");
      setSettings({
        ...settings,
        [setting]: !value
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      setResetLoading(true);
      setError(null);
      await resetPassword(currentUser.email);
      setSuccess("Password reset email sent. Check your inbox.");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      setError(err.message || "Failed to send password reset email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err: any) {
      console.error("Error signing out:", err);
      setError(err.message || "Failed to sign out");
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-black text-white">
        <header className="bg-black text-white p-4 shadow-md border-b border-gray-800">
          <div className="container mx-auto flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            {success && (
              <div className="p-3 mb-6 bg-green-600 bg-opacity-20 border border-green-500 text-green-500 rounded">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-3 mb-6 bg-red-600 bg-opacity-20 border border-red-500 text-red-500 rounded">
                {error}
              </div>
            )}            
            
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified about new messages</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('notifications')}
                      disabled={loading}
                      className="text-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      {settings.notifications ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Sound Effects</h3>
                      <p className="text-sm text-gray-400">Play sounds for notifications</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('soundEffects')}
                      disabled={loading}
                      className="text-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      {settings.soundEffects ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Privacy Section */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy & Security
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Read Receipts</h3>
                      <p className="text-sm text-gray-400">Let others know when you've read their messages</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('readReceipts')}
                      disabled={loading}
                      className="text-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      {settings.readReceipts ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('twoFactorAuth')}
                      disabled={loading}
                      className="text-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      {settings.twoFactorAuth ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={handlePasswordReset}
                      disabled={resetLoading}
                      className="flex items-center text-blue-500 hover:text-blue-400 transition duration-300 disabled:opacity-50"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {resetLoading ? "Sending..." : "Reset Password"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-700 hover:bg-red-800 text-white rounded-md px-4 py-3 transition duration-300 flex items-center justify-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500 pt-4">
                Chatta v1.0.0 • © 2025 Chatta Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}