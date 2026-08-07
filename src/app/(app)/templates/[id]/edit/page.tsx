import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateBuilderForm } from "@/components/templates/template-builder-form";
import { getTemplateById, listTemplatesWithDesign } from "@/db/queries/templates";

export const metadata = { title: "Edit Email Template" };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [template, savedTemplates] = await Promise.all([getTemplateById(id), listTemplatesWithDesign()]);

  if (!template) notFound();

  return (
    <>
      <PageHeader title="Edit Email Template" subtitle={template.name} />
      <TemplateBuilderForm template={template} savedTemplates={savedTemplates} />
    </>
  );
}
