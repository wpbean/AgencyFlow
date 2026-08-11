"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Copy, Trash2, Eye } from "lucide-react";
import { duplicateTemplateAction, deleteTemplateAction } from "@/actions/templates";
import { renderTemplate } from "@/lib/email";
import { renderDesignToHtml, wrapEmailPreviewDocument } from "@/lib/email/render-design";
import { TEMPLATE_CATEGORY_META } from "@/lib/labels";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import type { emailTemplates } from "@/db/schema";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Template = typeof emailTemplates.$inferSelect;

const SAMPLE_VARS = {
  first_name: "John",
  last_name: "Smith",
  agency_name: "Acme Web Agency",
  website: "acmeagency.com",
  country: "Germany",
};

export function TemplateCard({ template }: { template: Template }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewHtml = useMemo(
    () => (template.design ? wrapEmailPreviewDocument(renderDesignToHtml(template.design, SAMPLE_VARS)) : null),
    [template.design]
  );

  return (
    <Card className="relative gap-3 py-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 size-7 shrink-0">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/templates/${template.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              await duplicateTemplateAction(template.id);
              toast.success("Template duplicated.");
            }}
          >
            <Copy className="size-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CardHeader className="space-y-0 pt-4 pr-8">
        <CardTitle>
          <Link href={`/templates/${template.id}/edit`} className="block truncate hover:underline">
            {template.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="truncate text-sm font-medium text-foreground/80">{template.subject}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">{template.body}</p>
      </CardContent>
      <CardFooter className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="font-normal">
          {TEMPLATE_CATEGORY_META[template.category].label}
        </Badge>
      </CardFooter>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={previewHtml ? "sm:max-w-2xl" : "sm:max-w-lg"}>
          <DialogHeader>
            <DialogTitle>{renderTemplate(template.subject, SAMPLE_VARS)}</DialogTitle>
          </DialogHeader>
          {previewHtml ? (
            <iframe title="Template preview" srcDoc={previewHtml} className="h-[60vh] w-full rounded-md border bg-white" sandbox="" />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{renderTemplate(template.body, SAMPLE_VARS)}</p>
          )}
          <p className="text-xs text-muted-foreground">Preview uses sample data.</p>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${template.name}"?`}
        description="This permanently removes the template."
        onConfirm={async () => {
          await deleteTemplateAction(template.id);
          toast.success("Template deleted.");
        }}
      />
    </Card>
  );
}
