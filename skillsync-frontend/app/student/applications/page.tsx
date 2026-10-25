"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Application = {
  application_id: number;
  internship_id: number;
  internship_title: string;
  company_name: string;
  location: string;
  duration: string;
  stipend: string;
  application_date: string;
  status: string;
  resume: string | null;
  cover_letter: string | null;
};

const API_URL = "http://localhost/skillsync/api/student/applications.php";

const filters = ["All", "Pending", "Under Review", "Shortlisted", "Rejected"];

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
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN")} / month`
    : stipend;
}

function statusStyle(status: string) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "shortlisted":
    case "accepted":
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "under review":
    case "review":
      return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "rejected":
      return "border border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              (response.status === 401
                ? "Please sign in as a student to view your applications."
                : `Failed to load applications (HTTP ${response.status}).`)
          );
        }

        if (!cancelled) {
          setApplications(Array.isArray(data.applications) ? data.applications : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the SkillSync applications API."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredApplications =
    activeFilter === "All"
      ? applications
      : applications.filter(
          (app) => (app.status || "").toLowerCase() === activeFilter.toLowerCase()
        );

  const shortlistedCount = applications.filter((app) =>
    ["shortlisted", "accepted"].includes((app.status || "").toLowerCase())
  ).length;

  const reviewCount = applications.filter((app) =>
    ["under review", "review"].includes((app.status || "").toLowerCase())
  ).length;

  const otherCount = applications.length - shortlistedCount - reviewCount;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Navigation */}
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/student" className="text-2xl font-extrabold tracking-tight">
            SkillSync<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <Link href="/student" className="hover:text-cyan-300">
              Dashboard
            </Link>
            <Link
              href="/student/internships"
              className="hover:text-cyan-300"
            >
              Internships
            </Link>
            <Link
              href="/student/applications"
              className="font-semibold text-cyan-300"
            >
              My Applications
            </Link>
            <Link href="/student/profile" className="hover:text-cyan-300">
              My Profile
            </Link>
          </div>
        </nav>

        {/* Page heading */}
        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Student Portal
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            My Applications<span className="text-cyan-400">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Keep track of your internship applications and follow your career
            journey in one place.
          </p>
        </section>

        {/* Summary cards */}
        <section className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Applications</p>
            <p className="mt-3 text-3xl font-bold">{applications.length}</p>
            <p className="mt-2 text-xs text-slate-500">
              Across all internships
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Shortlisted</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">
              {shortlistedCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Positive progress
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Under Review</p>
            <p className="mt-3 text-3xl font-bold text-blue-300">
              {reviewCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Awaiting a decision
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Other Decisions</p>
            <p className="mt-3 text-3xl font-bold text-amber-300">
              {otherCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Pending or closed
            </p>
          </div>
        </section>

        {/* Application list */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Your applications</h2>
              <p className="mt-1 text-sm text-slate-400">
                Review your current application statuses.
              </p>
            </div>
            <Link
              href="/student/internships"
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              + Find Internships
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {loading && (
            <p className="py-8 text-center text-slate-400">
              Loading your applications from SkillSync...
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
              >
                Retry
              </button>
            </div>
          )}

          {/* Cards */}
          {!loading && !error && filteredApplications.length > 0 && (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <article
                  key={app.application_id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-600 sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg font-bold text-cyan-300">
                        {app.company_name ? app.company_name.charAt(0) : "C"}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold">{app.internship_title}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {app.company_name}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                          <span>📍 {app.location}</span>
                          <span>💰 {formatStipend(app.stipend)}</span>
                          {app.duration && <span>🕒 {app.duration}</span>}
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Applied on {formatDate(app.application_date)}
                        </p>
                        {app.resume && (
                          <p className="mt-1 text-xs text-slate-400">
                            Resume:{" "}
                            <a
                              href={app.resume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline"
                            >
                              View submitted link
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(app.status)}`}
                      >
                        {app.status}
                      </span>
                      <Link
                        href={`/student/internships/${app.internship_id}`}
                        className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        View internship →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredApplications.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 px-5 py-12 text-center">
              <p className="text-lg font-semibold">No applications found</p>
              <p className="mt-2 text-sm text-slate-400">
                {activeFilter === "All"
                  ? "You have not submitted any applications yet."
                  : `No applications with status "${activeFilter}".`}
              </p>
              <Link
                href="/student/internships"
                className="mt-4 inline-block rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Browse Internships
              </Link>
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          SkillSync © 2026 · Your career, connected.
        </footer>
      </div>
    </main>
  );
}
