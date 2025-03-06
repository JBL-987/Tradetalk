"use client";
import React, { memo, useState } from 'react';
import { useAuth } from "@/context/auth_context";
import ProtectedRoute from "@/components/protected_route";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Home } from "lucide-react"; 

const TradingViewClientComponent = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const container = React.useRef();

  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "NASDAQ:AAPL",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "withdateranges": true,
        "range": "YTD",
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "details": true,
        "hotlist": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      }`;
    
    container.current.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

   return (
    <ProtectedRoute>
      <div>
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            zIndex: 1001,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Link href="/dashboard" className="flex items-center text-white hover:underline">
            <Home className="w-5 h-5 mr-2" /> Home
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
              aria-label="User menu"
              aria-expanded={isMenuOpen}
            >
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white">
                {currentUser?.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <span className="hidden md:inline text-white">
                {currentUser?.displayName || "User"}
              </span>
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-black ring-1 ring-white ring-opacity-10 z-10"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
              >
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
                    onClick={() => {
                      logout(); 
                      setMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
        <div
          className="tradingview-widget-container"
          ref={container}
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "calc(100vh - 60px)",
            zIndex: 1000,
          }}
        >
          <div
            className="tradingview-widget-container__widget"
            style={{
              height: "100%",
              width: "100%",
            }}
          ></div>
          <div
            className="tradingview-widget-copyright"
            style={{
              position: "absolute",
              bottom: "5px",
              right: "5px",
              zIndex: 1001,
            }}
          >
            <a
              href="https://www.tradingview.com/"
              rel="noopener nofollow"
              target="_blank"
            >
              <span className="blue-text">Track all markets on TradingView</span>
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

const TradingViewWidget = dynamic(
  () => Promise.resolve(TradingViewClientComponent),
  { ssr: false }
);

export default memo(TradingViewWidget);