import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6">
      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <Link to="/">
          <BrandLogo size="sm" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full mx-auto rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 sm:p-7 space-y-5 my-8">
        <div>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-[#57534E] dark:text-[#9CA3AF] mt-1">
            Sign in to continue your ders.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm focus:outline-none focus:border-[#0F766E] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm focus:outline-none focus:border-[#0F766E] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center text-[#57534E] dark:text-[#9CA3AF]">
          New to Sabil?{" "}
          <Link
            to="/register"
            className="text-[#0F766E] dark:text-[#2DD4BF] font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>

      <div className="text-center text-xs text-[#57534E] dark:text-[#9CA3AF]">
        <Link to="/" className="hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}