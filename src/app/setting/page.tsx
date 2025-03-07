"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import Link from "next/link";
import { ArrowLeft, Bell, Shield, Key, LogOut, ToggleLeft, ToggleRight } from "lucide-react";
import { updateUserSettings, resetPassword } from "@/services/user"; 
import { toast } from "react-hot-toast";

export default function Settings() {
  const { currentUser} = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    soundEffects: true,
    readReceipts: true,
    twoFactorAuth: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser?.uid) return;
      
      try {
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    
    fetchSettings();
  }, [currentUser]);

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    handleSaveSettings(setting, !settings[setting]);
  };

  const handleSaveSettings = async (setting: string, value: boolean) => {
    if (!currentUser) return;
    
    setLoading(prev => ({ ...prev, [setting]: true }));
    
    try {
      await updateUserSettings(currentUser.uid, { [setting]: value });
      toast.success(`${setting.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      console.error("Error updating settings:", err);
      toast.error(err.message || "Failed to update setting");
      setSettings(prev => ({
        ...prev,
        [setting]: !value
      }));
    } finally {
      setLoading(prev => ({ ...prev, [setting]: false }));
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    setResetLoading(true);
    
    try {
      await resetPassword(currentUser.email);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      toast.error(err.message || "Failed to send password reset email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-black text-white">
        <header className="bg-black text-white p-4 shadow-md border-b border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/dashboard" className="mr-4 hover:text-blue-400 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">          
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-500" />
                  Notifications
                </h2>
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between group p-2 hover:bg-gray-800 rounded-md transition-colors">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified about new messages</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('notifications')}
                      disabled={loading['notifications']}
                      className="text-blue-500 focus:outline-none disabled:opacity-50 group-hover:scale-110 transition-transform"
                    >
                      {settings.notifications ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between group p-2 hover:bg-gray-800 rounded-md transition-colors">
                    <div>
                      <h3 className="font-medium">Sound Effects</h3>
                      <p className="text-sm text-gray-400">Play sounds for notifications</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('soundEffects')}
                      disabled={loading['soundEffects']}
                      className="text-blue-500 focus:outline-none disabled:opacity-50 group-hover:scale-110 transition-transform"
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
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Privacy & Security
                </h2>
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between group p-2 hover:bg-gray-800 rounded-md transition-colors">
                    <div>
                      <h3 className="font-medium">Read Receipts</h3>
                      <p className="text-sm text-gray-400">Let others know when you've read their messages</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('readReceipts')}
                      disabled={loading['readReceipts']}
                      className="text-blue-500 focus:outline-none disabled:opacity-50 group-hover:scale-110 transition-transform"
                    >
                      {settings.readReceipts ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between group p-2 hover:bg-gray-800 rounded-md transition-colors">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('twoFactorAuth')}
                      disabled={loading['twoFactorAuth']}
                      className="text-blue-500 focus:outline-none disabled:opacity-50 group-hover:scale-110 transition-transform"
                    >
                      {settings.twoFactorAuth ? (
                        <ToggleRight className="h-6 w-6" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  
                  <div className="pt-2 p-2">
                    <button
                      onClick={handlePasswordReset}
                      disabled={resetLoading}
                      className="flex items-center text-blue-500 hover:text-blue-400 transition duration-300 disabled:opacity-50 hover:underline"
                    >
                      {resetLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 pt-4">
                TradeTalk v1.0.0 • © 2025 TradeTalk Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}