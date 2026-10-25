"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminStats = {
  total_students: number;
  total_companies: number;
  total_internships: number;
  open_internships: number;
  total_applications: number;
  pending_applications: number;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: "Student" | "Company";
  status: string;
  joined: string;
  details?: string;
};

type InternshipRecord = {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  status: string;
  deadline: string;
};

const DASHBOARD_API = "http://localhost/skillsync/api/admin/dashboard.php";
const STUDENTS_API = "http://localhost/skillsync/api/admin/students.php";
const COMPANIES_API = "http://localhost/skillsync/api/admin/companies.php";
const INTERNSHIPS_API = "http://localhost/skillsync/api/admin/internships.php";

function formatDate(date: string | null) {
  if (!date) return "Recently";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatStipend(stipend: string) {
  const amount = Number(stipend);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}/mo` : stipend;
}

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      setError("");

      try {
        const [dashRes, stuRes, compRes, internRes] = await Promise.all([
          fetch(DASHBOARD_API, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
          fetch(STUDENTS_API, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
          fetch(COMPANIES_API, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
          fetch(INTERNSHIPS_API, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
        ]);

        if (
          dashRes.status === 401 ||
          dashRes.status === 403 ||
          stuRes.status === 403
        ) {
          setError("Admin access required. Please sign in with an Administrator account.");
          return;
        }

        const dashData = await dashRes.json();
        const stuData = await stuRes.json();
        const compData = await compRes.json();
        const internData = await internRes.json();

        if (dashData.success && dashData.data) {
          setStats(dashData.data);
        }

        const combinedUsers: UserRecord[] = [];

        if (stuData.success && Array.isArray(stuData.data)) {
          stuData.data.forEach((s: any) => {
            combinedUsers.push({
              id: s.student_id,
              name: s.name,
              email: s.email,
              role: "Student",
              status: s.account_status || "Active",
              joined: formatDate(s.created_at),
              details: `${s.department || "General"} · Year ${s.year || 1}${
                s.CGPA ? ` (CGPA: ${s.CGPA})` : ""
              }`,
            });
          });
        }

        if (compData.success && Array.isArray(compData.data)) {
          compData.data.forEach((c: any) => {
            combinedUsers.push({
              id: c.company_id,
              name: c.company_name,
              email: c.email,
              role: "Company",
              status: c.account_status || "Active",
              joined: formatDate(c.created_at),
              details: [c.industry, c.location].filter(Boolean).join(" · ") || "Enterprise",
            });
          });
        }

        setUsers(combinedUsers);

        if (internData.success && Array.isArray(internData.data)) {
          setInternships(
            internData.data.map((i: any) => ({
              id: i.internship_id,
              title: i.title,
              company: i.company_name,
              location: i.location,
              duration: i.duration,
              stipend: i.stipend,
              status: i.status,
              deadline: formatDate(i.deadline),
            }))
          );
        }
      } catch {
        setError("Unable to connect to SkillSync admin APIs. Please ensure XAMPP is running.");
      } finally {
        setLoading(false);
      }
    }

    void loadAdminData();
  }, []);

  async function handleSignOut() {
    try {
      const csrf = sessionStorage.getItem("skillsync_csrf_token") || "";
      await fetch("http://localhost/skillsync/api/auth/logout.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify({ csrf_token: csrf }),
      });
    } finally {
      sessionStorage.removeItem("skillsync_user");
      sessionStorage.removeItem("skillsync_csrf_token");
      window.location.href = "/";
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Navigation */}
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="text-2xl font-extrabold">
            SkillSync<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <Link href="/admin" className="font-semibold text-cyan-300">
              Admin Portal
            </Link>
            <Link href="/student" className="hover:text-cyan-300">
              Student View
            </Link>
            <Link href="/company" className="hover:text-cyan-300">
              Company View
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-white/15 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* Heading */}
        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Platform Management
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Admin Dashboard<span className="text-cyan-400">.</span>
          </h1>
          <p className="mt-3 text-slate-400">
            Monitor real-time accounts, review all internship listings, and oversee the SkillSync platform.
          </p>
        </section>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {/* Section Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {["Overview", "Users", "Internships"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                activeSection === section
                  ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                  : "border border-slate-700 text-slate-300 hover:border-cyan-400"
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Live Platform Stats */}
        {activeSection !== "Internships" && (
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {loading ? "..." : users.length}
              </p>
              <p className="mt-2 text-xs text-slate-500">Registered platform accounts</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Students</p>
              <p className="mt-3 text-3xl font-bold text-cyan-300">
                {loading ? "..." : stats?.total_students ?? users.filter((u) => u.role === "Student").length}
              </p>
              <p className="mt-2 text-xs text-slate-500">Active student profiles</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Companies</p>
              <p className="mt-3 text-3xl font-bold text-purple-300">
                {loading ? "..." : stats?.total_companies ?? users.filter((u) => u.role === "Company").length}
              </p>
              <p className="mt-2 text-xs text-slate-500">Recruiting organizations</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Total Applications</p>
              <p className="mt-3 text-3xl font-bold text-emerald-400">
                {loading ? "..." : stats?.total_applications ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {stats?.pending_applications ?? 0} pending review
              </p>
            </div>
          </section>
        )}

        {/* Overview Tab */}
        {activeSection === "Overview" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Recent Registered Users</h2>
                  <p className="mt-1 text-sm text-slate-400">Live student and company accounts.</p>
                </div>
                <button
                  onClick={() => setActiveSection("Users")}
                  className="text-sm font-semibold text-cyan-300 hover:underline"
                >
                  View all ({users.length}) →
                </button>
              </div>

              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div
                    key={`${user.role}-${user.id}`}
                    className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
                      {user.details && (
                        <p className="mt-1 text-xs text-cyan-400/80">{user.details}</p>
                      )}
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {user.role}
                    </span>
                  </div>
                ))}
                {users.length === 0 && !loading && (
                  <p className="text-sm text-slate-400">No users found in database.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Platform Internships</h2>
                  <p className="mt-1 text-sm text-slate-400">Published opportunities from all companies.</p>
                </div>
                <button
                  onClick={() => setActiveSection("Internships")}
                  className="text-sm font-semibold text-cyan-300 hover:underline"
                >
                  Manage ({internships.length}) →
                </button>
              </div>

              <div className="space-y-4">
                {internships.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.company} · {item.location} · {formatStipend(item.stipend)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status.toLowerCase() === "open" || item.status.toLowerCase() === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
                {internships.length === 0 && !loading && (
                  <p className="text-sm text-slate-400">No internships posted yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Users Tab */}
        {activeSection === "Users" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">User Directory</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Search and review all registered students and companies.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                {filteredUsers.length} total accounts
              </span>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
              >
                <option value="All">All roles</option>
                <option value="Student">Students</option>
                <option value="Company">Companies</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <article
                  key={`${user.role}-${user.id}`}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-cyan-300">
                        {user.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user.details} · Registered {user.joined}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.status.toLowerCase() === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </article>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <p className="py-8 text-center text-slate-400">No users match your search criteria.</p>
              )}
            </div>
          </section>
        )}

        {/* Internships Tab */}
        {activeSection === "Internships" && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Platform-Wide Internships</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review all internship opportunities published across companies.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                {internships.length} total listings
              </span>
            </div>

            <div className="space-y-4">
              {internships.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-cyan-300">
                      {item.company} · {item.location} · {item.duration}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Stipend: {formatStipend(item.stipend)} · Deadline: {item.deadline}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status.toLowerCase() === "open" || item.status.toLowerCase() === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
              {internships.length === 0 && !loading && (
                <p className="py-8 text-center text-slate-400">No internships found in database.</p>
              )}
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          SkillSync © 2026 · Admin Workspace
        </footer>
      </div>
    </main>
  );
}
