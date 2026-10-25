"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROFILE_API_URL = "http://localhost/skillsync/api/student/profile.php";
const SKILLS_API_URL = "http://localhost/skillsync/api/student/skills.php";

type StudentProfileData = {
  student_id: number;
  name: string;
  phone: string;
  department: string;
  year: number;
  CGPA: string | number | null;
  resume: string | null;
};

type SavedUser = {
  user_id?: number;
  email?: string;
  role?: string;
};

type StudentSkill = {
  skill_id: number;
  skill_name: string;
  skill_category?: string;
  proficiency_level: string;
};

type AvailableSkill = {
  skill_id: number;
  skill_name: string;
  skill_category?: string;
};

export default function StudentProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("2");
  const [cgpa, setCgpa] = useState("");
  const [resume, setResume] = useState("");

  const [mySkills, setMySkills] = useState<StudentSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");
  const [selectedLevel, setSelectedLevel] = useState("Intermediate");
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [skillSuccess, setSkillSuccess] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("skillsync_user");
      if (storedUser) {
        const user: SavedUser = JSON.parse(storedUser);
        setEmail(user.email ?? "");
      }
    } catch (err) {
      console.error("Could not read saved login details:", err);
    }

    async function loadData() {
      setError("");
      try {
        setLoading(true);

        // 1. Load Profile
        const profileRes = await fetch(PROFILE_API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const profileResult = await profileRes.json();
        if (profileRes.ok && profileResult.success) {
          const profile: StudentProfileData = profileResult.data;
          setName(profile.name ?? "");
          setPhone(profile.phone ?? "");
          setDepartment(profile.department ?? "");
          setYear(String(profile.year ?? 1));
          setCgpa(
            profile.CGPA === null || profile.CGPA === undefined
              ? ""
              : String(profile.CGPA)
          );
          setResume(profile.resume ?? "");
        } else {
          setError(profileResult.message || "Could not load profile.");
        }

        // 2. Load Skills
        await fetchSkills();
      } catch {
        setError("Could not connect to backend. Check that XAMPP is running.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function fetchSkills() {
    try {
      const skillsRes = await fetch(SKILLS_API_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const skillsResult = await skillsRes.json();
      if (skillsRes.ok && skillsResult.success) {
        setMySkills(skillsResult.skills ?? []);
        const avail: AvailableSkill[] = skillsResult.available_skills ?? [];
        setAvailableSkills(avail);
        if (avail.length > 0 && selectedSkillId === "") {
          setSelectedSkillId(avail[0].skill_id);
        }
      }
    } catch (err) {
      console.error("Failed to load skills:", err);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const csrfToken = sessionStorage.getItem("skillsync_csrf_token");

      const response = await fetch(PROFILE_API_URL, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          name,
          phone,
          department,
          year: Number(year),
          CGPA: cgpa === "" ? null : Number(cgpa),
          resume: resume.trim() === "" ? null : resume.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Could not save your profile.");
        return;
      }

      setMessage("Your profile was saved successfully.");
    } catch {
      setError("Could not connect to the API. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSkillId) return;

    setSkillLoading(true);
    setSkillError("");
    setSkillSuccess("");

    try {
      const csrfToken = sessionStorage.getItem("skillsync_csrf_token");
      const res = await fetch(SKILLS_API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          skill_id: Number(selectedSkillId),
          proficiency_level: selectedLevel,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setSkillError(result.message || "Failed to add skill.");
      } else {
        setSkillSuccess("Skill added successfully!");
        await fetchSkills();
      }
    } catch {
      setSkillError("Error connecting to server.");
    } finally {
      setSkillLoading(false);
    }
  }

  async function handleRemoveSkill(skillId: number) {
    setSkillError("");
    setSkillSuccess("");

    try {
      const csrfToken = sessionStorage.getItem("skillsync_csrf_token");
      const res = await fetch(SKILLS_API_URL, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          skill_id: skillId,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setSkillError(result.message || "Failed to remove skill.");
      } else {
        setSkillSuccess("Skill removed successfully.");
        await fetchSkills();
      }
    } catch {
      setSkillError("Error connecting to server.");
    }
  }

  function proficiencyBadge(level: string) {
    switch (level.toLowerCase()) {
      case "advanced":
      case "expert":
        return "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
      case "intermediate":
        return "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
      default:
        return "border border-amber-400/30 bg-amber-500/10 text-amber-300";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <Link href="/" className="text-2xl font-bold text-cyan-400">
          SkillSync.
        </Link>

        <div className="flex gap-4 text-sm text-slate-300">
          <Link href="/student" className="hover:text-cyan-400">
            Dashboard
          </Link>
          <Link href="/student/internships" className="hover:text-cyan-400">
            Internships
          </Link>
          <Link href="/student/applications" className="hover:text-cyan-400">
            Applications
          </Link>
          <span className="font-semibold text-cyan-400">My Profile</span>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link
          href="/student"
          className="text-sm text-cyan-400 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            Student account
          </p>
          <h1 className="mt-2 text-4xl font-bold">My Profile</h1>
          <p className="mt-3 text-slate-400">
            Manage your personal details, academic information, and listed skills.
          </p>
        </div>

        {loading ? (
          <p className="mt-8 text-slate-300">Loading your profile from SkillSync...</p>
        ) : (
          <div className="space-y-8">
            {/* Profile Info Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-7 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-9"
            >
              <section>
                <h2 className="text-xl font-semibold">Personal information</h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Full name
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Your registered account email address.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Phone number
                    </label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Resume URL / Link
                    </label>
                    <input
                      type="url"
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <h2 className="text-xl font-semibold">Academic information</h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Department
                    </label>
                    <input
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Current year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    >
                      <option value="1">First year</option>
                      <option value="2">Second year</option>
                      <option value="3">Third year</option>
                      <option value="4">Fourth year</option>
                      <option value="5">Fifth year</option>
                      <option value="6">Sixth year</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      CGPA (0 - 10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.25"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </section>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile Details"}
              </button>
            </form>

            {/* Live Skills Section */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-9">
              <h2 className="text-xl font-semibold">Skills & Proficiencies</h2>
              <p className="mt-2 text-sm text-slate-400">
                Skills saved here are linked to your profile and displayed to recruiters.
              </p>

              {/* Listed Skills Pills */}
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-300">Your Current Skills</p>
                {mySkills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {mySkills.map((sk) => (
                      <div
                        key={sk.skill_id}
                        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-sm"
                      >
                        <span className="font-semibold text-white">{sk.skill_name}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${proficiencyBadge(
                            sk.proficiency_level
                          )}`}
                        >
                          {sk.proficiency_level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(sk.skill_id)}
                          title="Remove skill"
                          className="ml-1 text-slate-400 transition hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    No skills added yet. Select a skill below to add it to your profile.
                  </p>
                )}
              </div>

              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm font-medium text-slate-300">Add a New Skill</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Skill</label>
                    <select
                      value={selectedSkillId}
                      onChange={(e) => setSelectedSkillId(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                    >
                      {availableSkills.map((sk) => (
                        <option key={sk.skill_id} value={sk.skill_id}>
                          {sk.skill_name} {sk.skill_category ? `(${sk.skill_category})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Proficiency Level</label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={skillLoading || !selectedSkillId}
                      className="w-full rounded-xl bg-cyan-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                    >
                      {skillLoading ? "Adding..." : "+ Add Skill"}
                    </button>
                  </div>
                </div>

                {skillError && (
                  <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                    {skillError}
                  </p>
                )}

                {skillSuccess && (
                  <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                    ✓ {skillSuccess}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
