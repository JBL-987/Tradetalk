"use client";
import { useState } from "react";
import Spline from '@splinetool/react-spline';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(true);

  return (
    <div className="relative h-screen w-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <div className="fixed inset-0 w-full h-full -z-10">
        <Spline
          scene="https://prod.spline.design/7B1a04Mvaqer-pLN/scene.splinecode"
          className="w-full h-full"
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
            Welcome to Chatta
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
            The best place to chat with friends and family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              href="/signup"
            >
              Get started
            </a>
            <a
              className="rounded-full bg-white text-black border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-black hover:text-white hover:border-white flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg"
              href="/login"
            >
              Already have an account?
            </a>
          </div>
        </main>
        <footer className="absolute bottom-4 text-white/80 text-sm">
          2025 © Chatta. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
