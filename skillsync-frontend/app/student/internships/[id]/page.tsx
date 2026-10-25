
import InternshipDetailsClient from "./InternshipDetailsClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InternshipDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  return <InternshipDetailsClient internshipId={id} />;
}
