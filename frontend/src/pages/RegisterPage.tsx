import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to create account"
      );
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

      <div className="max-w-md w-full mx-auto rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 sm:p-7 space-y-5 my-8">
        <div>
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] mt-1">
            Includes Fiqhi, Hadith, Sira, Aqida, and Adab out of the box.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium">Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Abdullah Ahmed"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm focus:outline-none focus:border-[#0227a1] dark:focus:border-[#7C9BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm focus:outline-none focus:border-[#0227a1] dark:focus:border-[#7C9BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm focus:outline-none focus:border-[#0227a1] dark:focus:border-[#7C9BFF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-center text-[#57534E] dark:text-[#9CA3AF]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#0227a1] dark:text-[#7C9BFF] font-medium hover:underline"
          >
            Sign in
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