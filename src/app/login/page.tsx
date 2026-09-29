"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Factory,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface UserAccount {
  email: string;
  password: string;
  businessName: string;
  ownerName: string;
}

const PREDEFINED_ACCOUNTS: UserAccount[] = [
  {
    email: "althaftn761@gmail.com",
    password: "password123",
    businessName: "BrickBook Yard",
    ownerName: "Althaf",
  },
];

const USERS_STORAGE_KEY = "brickbook_registered_users";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  // States
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Get stored accounts from localStorage
  const getStoredAccounts = (): UserAccount[] => {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Return empty array on error
    }
    return [];
  };

  const handleToggleMode = () => {
    setIsSignUp((prev) => !prev);
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();

    // Basic Field Validations
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const localAccounts = getStoredAccounts();
    const allAccounts = [...PREDEFINED_ACCOUNTS, ...localAccounts];

    setIsLoading(true);

    setTimeout(() => {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        if (!businessName.trim()) {
          setError("Please enter your business or yard name.");
          setIsLoading(false);
          return;
        }
        if (!ownerName.trim()) {
          setError("Please enter the owner's name.");
          setIsLoading(false);
          return;
        }

        // Check if email already exists
        const existing = allAccounts.find((a) => a.email === cleanEmail);
        if (existing) {
          setError("An account with this email already exists. Please sign in.");
          setIsLoading(false);
          return;
        }

        // Save new user account to localStorage
        const newUser: UserAccount = {
          email: cleanEmail,
          password,
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
        };

        const updatedLocal = [...localAccounts, newUser];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedLocal));

        // Create active session directly upon registration
        localStorage.setItem(
          "brickbook_auth_user",
          JSON.stringify({
            email: newUser.email,
            businessName: newUser.businessName,
            ownerName: newUser.ownerName,
            loginTime: new Date().toISOString(),
          })
        );

        setSuccessMsg("Account created! Redirecting to dashboard...");
        setTimeout(() => {
          setIsLoading(false);
          router.push("/");
        }, 800);
      } else {
        // --- SIGN IN LOGIC ---
        const matchedAccount = allAccounts.find(
          (a) => a.email === cleanEmail && a.password === password
        );

        if (!matchedAccount) {
          setError("Invalid email or password. Please try again.");
          setIsLoading(false);
          return;
        }

        // Store active session token/user details
        localStorage.setItem(
          "brickbook_auth_user",
          JSON.stringify({
            email: matchedAccount.email,
            businessName: matchedAccount.businessName,
            ownerName: matchedAccount.ownerName,
            loginTime: new Date().toISOString(),
          })
        );

        setSuccessMsg("Signed in successfully! Redirecting...");
        setTimeout(() => {
          setIsLoading(false);
          router.push("/");
        }, 800);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="bg-[#213547] text-white py-8 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-3">
            <Factory className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            BrickBook
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            {isSignUp
              ? "Register your brick manufacturing business"
              : "Sign in to manage your brick yard"}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl text-center flex items-center justify-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Additional Fields for Sign Up Mode */}
            {isSignUp && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Business / Yard Name
                  </label>
                  <div className="bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                    <Building2 className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Royal Concrete Bricks"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Owner Name
                  </label>
                  <div className="bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                    <User className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Email Address
              </label>
              <div className="bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Password
              </label>
              <div className="bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                <Lock className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Toggle Mode Link */}
          <div className="border-t border-slate-100 pt-4 text-center">
            {!isSignUp ? (
              <p className="text-xs font-medium text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                >
                  Create new account
                </button>
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
