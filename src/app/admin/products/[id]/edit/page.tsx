import { EditProductClient } from "./edit-client";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditProductClient id={parseInt(id, 10)} />;
}
