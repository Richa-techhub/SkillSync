
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

type Props = {
  internshipId?: string;
};

const API_URL =
  "http://localhost/skillsync/api/student/internships.php";
const APPLICATIONS_API_URL =
  "http://localhost/skillsync/api/student/applications.php";
const PROFILE_API_URL =
  "http://localhost/skillsync/api/student/profile.php";

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
    ? `₹${amount.toLocaleString("en-IN")}/month`
    : stipend;
}

export default function InternshipDetailsClient({
  internshipId: propInternshipId,
}: Props) {
  const routeParams = useParams();
  const internshipId = propInternshipId || (routeParams?.id as string) || "";
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentCgpa, setStudentCgpa] = useState<number | null>(null);

  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInternship() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              `Could not load internships (HTTP ${response.status}).`
          );
        }

        const selected = (data.internships ?? []).find(
          (item) => String(item.internship_id) === internshipId
        );

        if (!selected) {
          throw new Error(
            "This internship was not found in the API response."
          );
        }

        if (!cancelled) setInternship(selected);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the SkillSync API."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function checkExistingApplication() {
      try {
        const response = await fetch(APPLICATIONS_API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.applications)) {
            const alreadySubmitted = data.applications.some(
              (app: { internship_id: number }) =>
                String(app.internship_id) === internshipId
            );
            if (!cancelled && alreadySubmitted) {
              setHasApplied(true);
            }
          }
        }
      } catch {
        // Non-blocking: unauthenticated users or network issues are handled on submit
      }
    }

    async function loadProfile() {
      try {
        const response = await fetch(PROFILE_API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data && res.data.CGPA !== null) {
            const parsed = parseFloat(res.data.CGPA);
            if (!isNaN(parsed) && !cancelled) {
              setStudentCgpa(parsed);
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadInternship();
    checkExistingApplication();
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [internshipId]);

  async function handleApplySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const csrfToken = sessionStorage.getItem("skillsync_csrf_token") || "";

      const response = await fetch(APPLICATIONS_API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          internship_id: Number(internshipId),
          resume: resumeUrl.trim() === "" ? null : resumeUrl.trim(),
          cover_letter: coverLetter.trim() === "" ? null : coverLetter.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 409) {
          setHasApplied(true);
        }
        setApplyError(result.message || "Failed to submit application.");
        return;
      }

      setApplySuccess(result.message || "Application submitted successfully!");
      setHasApplied(true);
      setTimeout(() => {
        setShowApplyModal(false);
      }, 1800);
    } catch {
      setApplyError("Could not connect to server. Check Apache and MySQL in XAMPP.");
    } finally {
      setSubmitting(false);
    }
  }

  const isClosed = internship
    ? !["open", "active"].includes(internship.status.toLowerCase()) ||
      (internship.deadline !== null &&
        new Date(`${internship.deadline}T23:59:59`) < new Date())
    : false;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-bold">
            Skill<span className="text-cyan-400">Sync</span>
          </Link>
          <Link
            href="/student/internships"
            className="text-sm text-slate-300 hover:text-cyan-400"
          >
            All internships
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <Link
          href="/student/internships"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to internship listings
        </Link>

        {loading && (
          <p className="mt-8 text-slate-300">
            Loading internship details...
          </p>
        )}

        {error && (
          <section className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
            <h1 className="text-xl font-semibold">
              Unable to load internship
            </h1>
            <p className="mt-3 text-red-200">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
            >
              Try again
            </button>
          </section>
        )}

        {!loading && !error && internship && (
          <>
            <section className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                <div>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    {internship.status}
                  </span>

                  <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
                    {internship.title}
                  </h1>

                  <p className="mt-3 text-lg text-slate-300">
                    {internship.company_name}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="rounded-lg bg-slate-800 px-3 py-2">
                      📍 {internship.location}
                    </span>
                    <span className="rounded-lg bg-slate-800 px-3 py-2">
                      🕒 {internship.duration}
                    </span>
                    <span className="rounded-lg bg-slate-800 px-3 py-2">
                      Starts {formatDate(internship.start_date)}
                    </span>
                  </div>
                </div>

                <div className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-5 md:max-w-xs">
                  <p className="text-sm text-slate-400">
                    Monthly stipend
                  </p>
                  <p className="mt-2 text-2xl font-bold text-cyan-300">
                    {formatStipend(internship.stipend)}
                  </p>

                  <p className="mt-4 text-sm text-slate-400">
                    Application deadline
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDate(internship.deadline)}
                  </p>

                  {Number(internship.min_cgpa || 0) > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                      <p className="font-semibold text-amber-300">
                        🎯 Cutoff Criteria: &ge; {Number(internship.min_cgpa).toFixed(2)} CGPA
                      </p>
                      {studentCgpa !== null && (
                        <p className={`mt-1 font-medium ${studentCgpa < Number(internship.min_cgpa) ? "text-red-300" : "text-emerald-300"}`}>
                          Your CGPA: {studentCgpa.toFixed(2)} {studentCgpa < Number(internship.min_cgpa) ? "⚠️ (Below Cutoff)" : "✓ (Eligible)"}
                        </p>
                      )}
                    </div>
                  )}

                  {Number(internship.min_cgpa || 0) > 0 && studentCgpa !== null && studentCgpa < Number(internship.min_cgpa) && (
                    <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                      ⚠️ <strong>Automated Cutoff Warning:</strong> Your CGPA is below the minimum requirement. Submitting will trigger the system's auto-discard rule.
                    </div>
                  )}

                  {hasApplied ? (
                    <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-300">
                      ✓ Application Submitted
                    </div>
                  ) : isClosed ? (
                    <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-center text-sm font-medium text-slate-400">
                      Applications Closed
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setApplyError("");
                        setApplySuccess("");
                        setShowApplyModal(true);
                      }}
                      className="mt-5 w-full rounded-xl bg-cyan-400 py-3 text-center font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
                    >
                      Apply Now →
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold">
                  About this internship
                </h2>
                <p className="mt-4 leading-7 text-slate-400">
                  {internship.description}
                </p>
              </section>

              <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">
                  Internship information
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400">Company</p>
                    <p className="mt-1 font-medium">
                      {internship.company_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="mt-1 font-medium">
                      {internship.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Duration</p>
                    <p className="mt-1 font-medium">
                      {internship.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <p className="mt-1 font-medium">
                      {internship.status}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        <footer className="py-10 text-center text-sm text-slate-500">
          SkillSync · Find opportunities that match your skills.
        </footer>
      </div>

      {showApplyModal && internship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Internship Application
                </span>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  {internship.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {internship.company_name} · {internship.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Resume URL / Link
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-resume or portfolio"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Link to your online resume, PDF portfolio, or LinkedIn profile.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Cover letter / Note to recruiter
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, highlight relevant skills, and explain why you are a great fit for this internship..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>

              {Number(internship.min_cgpa || 0) > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                  <p className="font-semibold text-amber-300">
                    🎯 Minimum CGPA Cutoff: &ge; {Number(internship.min_cgpa).toFixed(2)}
                  </p>
                  {studentCgpa !== null && studentCgpa < Number(internship.min_cgpa) && (
                    <p className="mt-1 text-red-300">
                      ⚠️ <strong>Automated Auto-Discard:</strong> Your CGPA ({studentCgpa.toFixed(2)}) is below this requirement. Your application will be recorded, but automatically marked as <strong>Rejected</strong> by the database screening trigger.
                    </p>
                  )}
                </div>
              )}

              {applyError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {applyError}
                </p>
              )}

              {applySuccess && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  ✓ {applySuccess}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!applySuccess}
                  className="rounded-xl bg-cyan-400 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
