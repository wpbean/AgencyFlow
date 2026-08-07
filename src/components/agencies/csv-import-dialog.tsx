"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, Loader2, FileUp, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { previewCsvImportAction, commitCsvImportAction, type CsvRowPreview } from "@/actions/csv-import";
import { CSV_COLUMNS, MAX_CSV_ROWS, type CsvAgencyRow } from "@/lib/csv";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Step = "upload" | "preview" | "done";

const STATUS_META = {
  valid: { label: "Valid", icon: CheckCircle2, className: "text-success" },
  duplicate: { label: "Duplicate", icon: AlertTriangle, className: "text-warning" },
  invalid: { label: "Invalid", icon: XCircle, className: "text-danger" },
};

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<CsvRowPreview[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setPreview([]);
    setSelected(new Set());
    setImportedCount(0);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleFile(file: File) {
    Papa.parse<CsvAgencyRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const rows = results.data.slice(0, MAX_CSV_ROWS);
        startTransition(async () => {
          const previewResult = await previewCsvImportAction(rows);
          setPreview(previewResult);
          setSelected(new Set(previewResult.map((p, i) => (p.status === "valid" ? i : -1)).filter((i) => i >= 0)));
          setStep("preview");
        });
      },
      error: () => toast.error("Failed to parse CSV file."),
    });
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleImport() {
    const rows = preview.filter((_, i) => selected.has(i)).map((p) => p.row);
    if (rows.length === 0) {
      toast.error("Select at least one row to import.");
      return;
    }
    startTransition(async () => {
      const result = await commitCsvImportAction(rows);
      setImportedCount(result.imported);
      setStep("done");
      toast.success(`Imported ${result.imported} agencies.`);
    });
  }

  const validCount = preview.filter((p) => p.status === "valid").length;
  const duplicateCount = preview.filter((p) => p.status === "duplicate").length;
  const invalidCount = preview.filter((p) => p.status === "invalid").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="lg" className="gap-1.5" onClick={() => setOpen(true)}>
        <Upload className="size-4" /> Import CSV
      </Button>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Agencies from CSV</DialogTitle>
          <DialogDescription>
            Columns: {CSV_COLUMNS.join(", ")}. Duplicate agencies are detected by website and contact email.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            {pending ? (
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <FileUp className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag and drop a CSV file, or click to browse.</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="border-success/20 bg-success/15 text-success">
                {validCount} valid
              </Badge>
              <Badge variant="outline" className="border-warning/20 bg-warning/15 text-warning">
                {duplicateCount} duplicate
              </Badge>
              <Badge variant="outline" className="border-danger/20 bg-danger/15 text-danger">
                {invalidCount} invalid
              </Badge>
              <span className="text-muted-foreground">{selected.size} selected for import</span>
            </div>
            <ScrollArea className="h-96 rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Status</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((p, i) => {
                    const meta = STATUS_META[p.status];
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} disabled={p.status === "invalid"} />
                        </TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 text-xs ${meta.className}`}>
                            <meta.icon className="size-3.5" /> {meta.label}
                          </span>
                          {p.reason && <p className="text-xs text-muted-foreground">{p.reason}</p>}
                        </TableCell>
                        <TableCell className="font-medium">{p.row.agency_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.row.website || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.row.country || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.row.contact_name || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-medium">Imported {importedCount} agencies.</p>
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Import {selected.size} Agencies
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={() => handleOpenChange(false)}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
