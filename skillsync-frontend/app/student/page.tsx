"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Internship = {
  internship_id: number;
  company_id: number;
  company_name: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  stipend: string;
  deadline: string | null;
  status: string;
};

export default function StudentDashboard() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [skillsCount, setSkillsCount] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read saved user name/email if stored
    try {
      const stored = sessionStorage.getItem("skillsync_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) {
          setStudentName(u.email.split("@")[0]);
        }
      }
    } catch {
      // non-blocking
    }

    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch available internships
        const internRes = await fetch("http://localhost/skillsync/api/student/internships.php", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (internRes.ok) {
          const internData = await internRes.json();
          if (internData.success && Array.isArray(internData.internships)) {
            setAvailableCount(internData.internships.length);
            setInternships(internData.internships.slice(0, 3));
          }
        }

        // 2. Fetch applications count
        const appRes = await fetch("http://localhost/skillsync/api/student/applications.php", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          if (appData.success && Array.isArray(appData.applications)) {
            setAppliedCount(appData.applications.length);
          }
        }

        // 3. Fetch skills count
        const skillRes = await fetch("http://localhost/skillsync/api/student/skills.php", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (skillRes.ok) {
          const skillData = await skillRes.json();
          if (skillData.success && Array.isArray(skillData.skills)) {
            setSkillsCount(skillData.skills.length);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
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
    } catch {
      // ignore and clear client storage
    } finally {
      sessionStorage.removeItem("skillsync_user");
      sessionStorage.removeItem("skillsync_csrf_token");
      window.location.href = "/";
    }
  }

  function formatStipend(stipend: string) {
    const amount = Number(stipend);
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}/mo` : stipend;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <Link href="/" className="text-2xl font-bold text-cyan-400">
          SkillSync.
        </Link>

        <div className="flex gap-5 text-sm text-slate-300">
          <Link href="/student/internships" className="hover:text-cyan-400">
            Internships
          </Link>
          <Link href="/student/applications" className="hover:text-cyan-400">
            Applications
          </Link>
          <Link href="/student/profile" className="hover:text-cyan-400">
            Profile
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
        >
          Sign out
        </button>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-950 to-slate-900 p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            Student Dashboard {studentName ? `· Welcome, ${studentName}` : ""}
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Your next opportunity starts here.
          </h1>

          <p className="mt-4 max-w-2xl text-slate-300">
            Explore internships, build your skills, and keep track of your
            applications in one place.
          </p>

          <Link
            href="/student/internships"
            className="mt-7 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
          >
            Explore internships →
          </Link>
        </section>

        {/* Live Counters */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Available internships</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">
              {loading ? "..." : (availableCount ?? 0).toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-slate-500">Open for application</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Applications submitted</p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">
              {loading ? "..." : (appliedCount ?? 0).toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-slate-500">Tracked in database</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Skills listed</p>
            <p className="mt-3 text-3xl font-bold text-purple-400">
              {loading ? "..." : (skillsCount ?? 0).toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-slate-500">On your profile</p>
          </div>
        </section>

        {/* Recommended / Recent Internships */}
        <section id="internships" className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recommended internships</h2>
              <p className="mt-2 text-sm text-slate-400">
                Live opportunities currently open for applications.
              </p>
            </div>
            <Link
              href="/student/internships"
              className="text-sm font-semibold text-cyan-400 hover:underline"
            >
              View all ({availableCount ?? 0}) →
            </Link>
          </div>

          {loading && (
            <p className="py-8 text-center text-slate-400">Loading internships...</p>
          )}

          {!loading && internships.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-white/5 p-8 text-center text-slate-400">
              No open internships found in the database.
            </div>
          )}

          {!loading && internships.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-3">
              {internships.map((job) => (
                <article
                  key={job.internship_id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/60"
                >
                  <span className="w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    {job.status}
                  </span>

                  <h3 className="mt-5 text-xl font-semibold">{job.title}</h3>
                  <p className="mt-2 text-slate-300">{job.company_name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>📍 {job.location}</span>
                    <span>·</span>
                    <span>💰 {formatStipend(job.stipend)}</span>
                  </div>

                  <Link
                    href={`/student/internships/${job.internship_id}`}
                    className="mt-6 block w-full rounded-xl border border-cyan-400 px-4 py-3 text-center font-medium text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
                  >
                    View opportunity →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Quick links to Applications and Profile */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">My applications</h2>
            <p className="mt-2 text-sm text-slate-400">
              You have submitted {appliedCount ?? 0} application
              {appliedCount === 1 ? "" : "s"}. Track company review and decision status.
            </p>
            <Link
              href="/student/applications"
              className="mt-4 inline-block font-semibold text-cyan-400 hover:underline"
            >
              View my applications →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">My profile</h2>
            <p className="mt-2 text-sm text-slate-400">
              Manage your personal details, academic CGPA, resume URL, and skills.
            </p>
            <Link
              href="/student/profile"
              className="mt-4 inline-block font-semibold text-cyan-400 hover:underline"
            >
              Edit my profile →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
