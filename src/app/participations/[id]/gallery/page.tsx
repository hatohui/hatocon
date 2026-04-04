// Gallery moved to the Media tab on the participation detail page.
import { redirect } from "next/navigation";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/participations/${id}`);
}
