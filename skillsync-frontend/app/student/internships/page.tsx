
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
  min_cgpa?: string | number | null;
  start_date: string | null;
  deadline: string | null;
  status: string;
};

type ApiResponse = {
  success: boolean;
  internships?: Internship[];
  message?: string;
};

const API_URL =
  "http://localhost/skillsync/api/student/internships.php";

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

  if (!Number.isFinite(amount)) return stipend;

  return `₹${amount.toLocaleString("en-IN")}/month`;
}

export default function InternshipListingsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInternships() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              (response.status === 401
                ? "Please log in to view internships, then refresh this page."
                : `Unable to load internships (HTTP ${response.status}).`)
          );
        }

        if (!cancelled) {
          setInternships(data.internships ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the internships API."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInternships();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-bold text-cyan-400"
        >
          SkillSync.
        </Link>

        <Link
          href="/student"
          className="text-sm text-slate-300 hover:text-cyan-400"
        >
          Student Dashboard
        </Link>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-medium text-cyan-400">
          EXPLORE OPPORTUNITIES
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Internship Listings
        </h1>

        <p className="mt-3 max-w-2xl text-slate-400">
          Discover internship opportunities, explore their details,
          and find a role that matches your interests.
        </p>

        {loading && (
          <p className="mt-8 text-slate-300">
            Loading internships from SkillSync...
          </p>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-5">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-red-300/40 px-4 py-2 text-sm hover:bg-red-400/10"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && internships.length === 0 && (
          <p className="mt-8 rounded-xl border border-slate-800 p-6 text-slate-300">
            No internships are currently available.
          </p>
        )}

        {!loading && !error && internships.length > 0 && (
          <>
            <p className="mt-6 text-sm text-slate-400">
              {internships.length} internship
              {internships.length === 1 ? "" : "s"} loaded from the database
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {internships.map((internship) => (
                <article
                  key={internship.internship_id}
                  className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/50"
                >
                  <span className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    {internship.status}
                  </span>

                  <h2 className="mt-4 text-xl font-semibold">
                    {internship.title}
                  </h2>

                  <p className="mt-2 text-slate-300">
                    {internship.company_name}
                  </p>

                  <p className="mt-4 text-sm text-slate-400">
                    📍 {internship.location} · {internship.duration}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-lg font-semibold text-cyan-300">
                      {formatStipend(internship.stipend)}
                    </p>
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      🎯 Cutoff: {internship.min_cgpa && Number(internship.min_cgpa) > 0 ? `&ge; ${Number(internship.min_cgpa).toFixed(2)} CGPA` : "No limit"}
                    </span>
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                    {internship.description}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <p>
                      <span className="text-slate-300">Start date: </span>
                      {formatDate(internship.start_date)}
                    </p>
                    <p>
                      <span className="text-slate-300">Deadline: </span>
                      {formatDate(internship.deadline)}
                    </p>
                  </div>

                  <Link
                    href={`/student/internships/${internship.internship_id}`}
                    className="mt-6 block rounded-xl bg-cyan-400 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    View Details →
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-sm text-slate-500">
          SkillSync. · Find opportunities that match your skills.
        </footer>
      </section>
    </main>
  );
}
