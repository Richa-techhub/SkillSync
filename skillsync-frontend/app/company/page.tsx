"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CompanyInternship = {
  internship_id: number;
  title: string;
  description: string;
  location: string;
  duration: string;
  stipend: string;
  start_date: string;
  deadline: string;
  status: string;
};

type CompanyApplication = {
  application_id: number;
  student_id: number;
  student_name: string;
  department: string;
  year: number;
  CGPA: number | string | null;
  student_email: string;
  internship_id: number;
  internship_title: string;
  application_date: string;
  status: string;
  resume: string | null;
  cover_letter: string | null;
};

const INTERNSHIPS_API = "http://localhost/skillsync/api/company/internships.php";
const APPLICATIONS_API = "http://localhost/skillsync/api/company/applications.php";

function applicantStatusStyle(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "shortlisted" || s === "accepted") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
  }
  if (s === "rejected") {
    return "bg-red-500/10 text-red-300 border border-red-500/20";
  }
  if (s === "under review") {
    return "bg-blue-500/10 text-blue-300 border border-blue-500/20";
  }
  return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
}

function formatDate(date: string | null) {
  if (!date) return "Not specified";
  const parsed = new Date(`${date}T00:00:00`);
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

export default function CompanyDashboardPage() {
  const [internships, setInternships] = useState<CompanyInternship[]>([]);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  // Post Internship Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Remote");
  const [duration, setDuration] = useState("3 months");
  const [stipend, setStipend] = useState("15000");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("skillsync_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) {
          setCompanyName(u.email.split("@")[0]);
        }
      }
    } catch {
      // non-blocking
    }

    void loadCompanyData();
  }, []);

  async function loadCompanyData() {
    setLoading(true);
    setError("");
    try {
      const [internRes, appRes] = await Promise.all([
        fetch(INTERNSHIPS_API, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch(APPLICATIONS_API, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      const internData = await internRes.json();
      const appData = await appRes.json();

      if (internRes.status === 401 || appRes.status === 401) {
        setError("Please log in as a Company account to view this workspace.");
        return;
      }

      if (internData.success && Array.isArray(internData.internships)) {
        setInternships(internData.internships);
      }

      if (appData.success && Array.isArray(appData.applications)) {
        setApplications(appData.applications);
      }
    } catch {
      setError("Unable to connect to the SkillSync backend API. Ensure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInternship(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");

    try {
      const csrf = sessionStorage.getItem("skillsync_csrf_token") || "";

      const res = await fetch(INTERNSHIPS_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          duration: duration.trim(),
          stipend: stipend.trim(),
          start_date: startDate,
          deadline: deadline,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setModalError(data.message || "Failed to create internship listing.");
        return;
      }

      setModalSuccess("Internship listing posted successfully!");
      setTitle("");
      setDescription("");
      setStipend("15000");
      setStartDate("");
      setDeadline("");

      await loadCompanyData();

      setTimeout(() => {
        setShowModal(false);
        setModalSuccess("");
      }, 1400);
    } catch {
      setModalError("Network error while creating internship.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleUpdateStatus(applicationId: number, newStatus: string) {
    try {
      const csrf = sessionStorage.getItem("skillsync_csrf_token") || "";
      const res = await fetch(APPLICATIONS_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        body: JSON.stringify({
          application_id: applicationId,
          status: newStatus,
          csrf_token: csrf,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.application_id === applicationId
              ? { ...app, status: newStatus }
              : app
          )
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

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
    } catch {
      // non-blocking
    } finally {
      sessionStorage.removeItem("skillsync_user");
      sessionStorage.removeItem("skillsync_csrf_token");
      window.location.href = "/";
    }
  }

  const filteredApplicants = applications.filter((app) => {
    const matchesTab =
      activeTab === "All" ||
      app.status.toLowerCase() === activeTab.toLowerCase();

    const matchesSearch =
      app.student_name.toLowerCase().includes(search.toLowerCase()) ||
      app.internship_title.toLowerCase().includes(search.toLowerCase()) ||
      app.department.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const shortlistedCount = applications.filter(
    (a) => a.status === "Shortlisted" || a.status === "Accepted"
  ).length;

  const activeInternshipsCount = internships.filter(
    (i) => i.status.toLowerCase() === "open" || i.status.toLowerCase() === "active"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Navigation */}
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="text-2xl font-extrabold">
            SkillSync<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <Link href="/company" className="font-semibold text-cyan-300">
              Dashboard
            </Link>
            <a href="#internships" className="hover:text-cyan-300">
              My Internships
            </a>
            <a href="#applicants" className="hover:text-cyan-300">
              Applicants ({applications.length})
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-white/15 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* Welcome section */}
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Company Workspace {companyName ? `· ${companyName}` : ""}
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Recruitment Dashboard<span className="text-cyan-400">.</span>
            </h1>
            <p className="mt-3 text-slate-400">
              Publish internship listings and review student applications in real time.
            </p>
          </div>

          <button
            onClick={() => {
              setModalError("");
              setModalSuccess("");
              setShowModal(true);
            }}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
          >
            + Post an Internship
          </button>
        </section>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Internships</p>
              <span className="text-xl">💼</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-cyan-400">{internships.length}</p>
            <p className="mt-2 text-xs text-slate-500">Positions posted</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Applicants</p>
              <span className="text-xl">👥</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{applications.length}</p>
            <p className="mt-2 text-xs text-slate-500">Across all listings</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Active Listings</p>
              <span className="text-xl">🟢</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-emerald-400">
              {activeInternshipsCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">Currently open</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Shortlisted</p>
              <span className="text-xl">⭐</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-amber-300">
              {shortlistedCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">Qualified candidates</p>
          </div>
        </section>

        {/* Internship management */}
        <section
          id="internships"
          className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Your Internships</h2>
              <p className="mt-1 text-sm text-slate-400">
                Positions created by your company stored in MySQL.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
              {internships.length} listing{internships.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-slate-400">Loading internships...</p>
          ) : internships.length > 0 ? (
            <div className="space-y-4">
              {internships.map((internship) => {
                const countForThis = applications.filter(
                  (a) => a.internship_id === internship.internship_id
                ).length;

                return (
                  <article
                    key={internship.internship_id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg font-bold text-cyan-300">
                          {internship.title.charAt(0)}
                        </div>

                        <div>
                          <h3 className="font-bold">{internship.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            📍 {internship.location} · 🕒 {internship.duration}
                          </p>
                          <p className="mt-2 text-sm text-cyan-300">
                            {formatStipend(internship.stipend)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Deadline: {formatDate(internship.deadline)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            internship.status.toLowerCase() === "open"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {internship.status}
                        </span>
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                          {countForThis} applicant{countForThis === 1 ? "" : "s"}
                        </span>
                        <a
                          href="#applicants"
                          onClick={() => setSearch(internship.title)}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-cyan-400"
                        >
                          Filter applicants ↓
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
              <p>You haven't posted any internships yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950"
              >
                + Post Your First Internship
              </button>
            </div>
          )}
        </section>

        {/* Applicant management */}
        <section
          id="applicants"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold">Student Applicants</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review candidate qualifications, read cover notes, and update hiring statuses.
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student name, role, or department..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <select
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map((app) => (
                <article
                  key={app.application_id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-700"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-cyan-300">
                        {app.student_name ? app.student_name.charAt(0) : "S"}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-lg">{app.student_name}</h3>
                          <span className="text-xs text-slate-400">· {app.student_email}</span>
                        </div>

                        <p className="mt-1 text-sm text-cyan-300">
                          Applied for: <span className="font-medium text-white">{app.internship_title}</span>
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>🎓 {app.department} (Year {app.year})</span>
                          {app.CGPA && <span>📊 CGPA: {app.CGPA}</span>}
                          <span>📅 Applied {formatDate(app.application_date)}</span>
                        </div>

                        {app.cover_letter && (
                          <p className="mt-3 rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-300">
                            <strong className="text-cyan-400">Note:</strong> "{app.cover_letter}"
                          </p>
                        )}

                        {app.resume && (
                          <p className="mt-2 text-xs">
                            <a
                              href={app.resume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline"
                            >
                              📄 View Student Resume / Portfolio →
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${applicantStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>

                      {/* Status Update Dropdown */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Set Status:</label>
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleUpdateStatus(app.application_id, e.target.value)
                          }
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <p className="font-semibold">No applicants found</p>
                <p className="mt-2 text-sm text-slate-400">
                  {search
                    ? "Try changing your search term."
                    : "No students have applied to your listings under this status filter yet."}
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          SkillSync © 2026 · Your career, connected.
        </footer>
      </div>

      {/* Post Internship Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  New Opportunity
                </span>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  Post an Internship
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInternship} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Internship Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Backend Developer Intern"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline internship duties, prerequisites, and learning opportunities..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 months"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Monthly Stipend (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="15000"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {modalError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {modalError}
                </p>
              )}

              {modalSuccess && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  ✓ {modalSuccess}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !!modalSuccess}
                  className="rounded-xl bg-cyan-400 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {modalLoading ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
