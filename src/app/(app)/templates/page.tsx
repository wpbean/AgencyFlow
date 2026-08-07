import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateCard } from "@/components/templates/template-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/db/queries/templates";

export const metadata = { title: "Email Templates" };

export default async function TemplatesPage() {
  const templates = await listTemplates();

  return (
    <>
      <PageHeader
        title="Email Templates"
        subtitle="Reusable outreach and follow-up templates."
        actions={
          <Button size="lg" className="gap-1.5" asChild>
            <Link href="/templates/new">
              <Plus className="size-4" /> New Template
            </Link>
          </Button>
        }
      />
      <div className="p-4 sm:p-6">
        {templates.length === 0 ? (
          <EmptyState icon={Mail} title="No templates yet" description="Create your first template to speed up outreach." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
