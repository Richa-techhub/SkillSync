"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [role, setRole] = useState<"Student" | "Company">("Student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("1");
  const [cgpa, setCgpa] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      };

      if (role === "Student") {
        payload.department = department.trim();
        payload.year = Number(year);
        if (cgpa.trim() !== "") {
          payload.CGPA = Number(cgpa);
        }
      }

      const res = await fetch("http://localhost/skillsync/api/auth/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed. Please check your inputs.");
        return;
      }

      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1600);
    } catch {
      setError("Unable to connect to the backend server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-bold text-cyan-400">
          SkillSync.
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            Join SkillSync
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Create your account
          </h1>

          <p className="mt-3 text-slate-400">
            Create your profile and start connecting opportunities with skills.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                I am registering as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("Student")}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    role === "Student"
                      ? "border-cyan-400 bg-cyan-400 text-slate-950"
                      : "border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("Company")}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    role === "Company"
                      ? "border-cyan-400 bg-cyan-400 text-slate-950"
                      : "border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400"
                  }`}
                >
                  Company
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {role === "Company" ? "Company name" : "Full name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "Company" ? "Acme Technologies" : "John Doe"}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {role === "Student" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Current year of study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                  >
                    <option value="1">First year</option>
                    <option value="2">Second year</option>
                    <option value="3">Third year</option>
                    <option value="4">Fourth year</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Password (8+ characters)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                ✓ {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : `Create ${role} Account`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/" className="font-semibold text-cyan-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
