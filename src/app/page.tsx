"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // If already authenticated, send users straight to the dashboard
  useEffect(() => {
    try {
      const access = localStorage.getItem("access");
      const user = localStorage.getItem("user");
      if (access && user) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore SSR/localStorage access issues
    }
  }, [router]);

  // Minimal landing for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <div className="text-center space-y-8 px-6 py-12 max-w-lg w-full bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded-full shadow-lg">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-lg">Team Task Tracker</h1>
        </div>
        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">Collaborate, organize, and track your team's tasks effortlessly.</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link href="/login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-400">
            Login
          </Link>
          <Link href="/signup" className="px-6 py-3 rounded-xl border-2 border-indigo-200 dark:border-purple-700 text-indigo-700 dark:text-purple-200 font-semibold bg-white dark:bg-gray-800 shadow-lg hover:bg-indigo-50 dark:hover:bg-purple-900 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-400">
            Sign up
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-slow">
          <span>Secure, fast, and easy to use.</span>
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease;
        }
        .animate-fade-in-slow {
          animation: fadeIn 2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
