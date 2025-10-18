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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center space-y-6 px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Task Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400">Sign in or create an account to continue.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            Login
          </Link>
          <Link href="/signup" className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
