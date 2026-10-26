import { Suspense } from "react";
import InternshipDetailsClient from "./InternshipDetailsClient";

export default function InternshipDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-center text-white">Loading opportunity...</div>}>
      <InternshipDetailsClient />
    </Suspense>
  );
}
