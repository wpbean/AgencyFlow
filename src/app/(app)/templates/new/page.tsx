import { PageHeader } from "@/components/layout/page-header";
import { TemplateBuilderForm } from "@/components/templates/template-builder-form";
import { listTemplatesWithDesign } from "@/db/queries/templates";

export const metadata = { title: "New Email Template" };

export default async function NewTemplatePage() {
  const savedTemplates = await listTemplatesWithDesign();

  return (
    <>
      <PageHeader title="New Email Template" subtitle="Design a reusable email with the visual builder." />
      <TemplateBuilderForm savedTemplates={savedTemplates} />
    </>
  );
}
