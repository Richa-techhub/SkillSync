
"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost/skillsync/api/auth/login.php",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login failed. Please try again.");
        return;
      }

      const user = result.data;

      if (!user?.role || !user?.email) {
        setError("Login response is missing account details.");
        return;
      }

      // Save the CSRF token for authenticated API requests.
      if (user.csrf_token) {
        sessionStorage.setItem(
          "skillsync_csrf_token",
          user.csrf_token
        );
      }

      // Save the logged-in user's details for the frontend.
      sessionStorage.setItem(
        "skillsync_user",
        JSON.stringify({
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        })
      );

      // Redirect according to the role returned by the backend.
      if (user.role === "Student") {
        window.location.href = "/student";
      } else if (user.role === "Company") {
        window.location.href = "/company";
      } else if (user.role === "Admin") {
        window.location.href = "/admin";
      } else {
        setError("Your account has an unsupported role.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Cannot connect to the backend. Check that XAMPP Apache is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <h1 className="text-2xl font-bold text-cyan-400">
          SkillSync<span className="text-white">.</span>
        </h1>
        <span className="text-sm text-slate-400">
          Your career, connected.
        </span>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-8 py-20 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Learn · Connect · Grow
          </p>

          <h2 className="text-5xl font-bold leading-tight md:text-6xl">
            Find your next
            <span className="block text-cyan-400">
              opportunity.
            </span>
          </h2>

          <p className="mt-6 max-w-lg leading-7 text-slate-400">
            Build your profile, showcase your skills, and discover
            internship opportunities that match your goals.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["Student", "Company", "Admin"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-full border px-5 py-2 transition ${
                  role === item
                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                    : "border-white/20 text-slate-300 hover:border-cyan-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm text-cyan-400">
            WELCOME TO SKILLSYNC
          </p>

          <h3 className="mt-3 text-3xl font-semibold">
            {role} {role === "Admin" ? "Access" : "Portal"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {role === "Student"
              ? "Discover internships and manage your applications."
              : role === "Company"
                ? "Publish opportunities and find talented students."
                : "Manage platform information and user activity."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : `Sign in as ${role}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New to SkillSync?{" "}
            <Link
              href="/register"
              className="font-semibold text-cyan-400 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-sm text-slate-500">
        © 2026 SkillSync · Connecting skills with opportunities
      </footer>
    </main>
  );
}
