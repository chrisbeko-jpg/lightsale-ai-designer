import { DesignLibraryWizard } from "@/components/design-library/DesignLibraryWizard";

export default async function EditReferenceProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DesignLibraryWizard projectId={id} />;
}
