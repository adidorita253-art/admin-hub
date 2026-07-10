import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ImportEntity = "students" | "supervisors";

export interface ImportPreviewRow {
  cells: (string | number)[];
  valid: boolean;
}

export interface ImportValidationResult {
  total: number;
  valid: number;
  errors: number;
  previewColumns: string[];
  previewRows: ImportPreviewRow[];
  errorRows: { row: number; message: string }[];
}

const ACCEPTED = [".xlsx", ".xls", ".csv"];
const MAX_BYTES = 10 * 1024 * 1024;

export function ImportWizard({
  open,
  onOpenChange,
  entity,
  title,
  templateFilename,
  templateColumns,
  sampleRow,
  previewColumns,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: ImportEntity;
  title: string;
  templateFilename: string;
  templateColumns: string[];
  sampleRow: string[];
  previewColumns: string[];
  onConfirm: (count: number) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFile(null);
      setResult(null);
      setValidating(false);
    }
  }, [open]);

  function downloadTemplate() {
    const csv = [
      templateColumns.join(","),
      sampleRow.map((c) => `"${c}"`).join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFilename.replace(/\.xlsx$/i, ".csv");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    setFile(f);
  }

  async function validate() {
    if (!file) return;
    setValidating(true);
    // Simulated backend validation. Replace with a real POST when wiring the API.
    await new Promise((r) => setTimeout(r, 900));
    let total = 20;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) total = lines.length - 1;
    } catch {
      /* xlsx binary — fall back to mocked count */
    }
    const errors = Math.min(3, Math.max(0, Math.floor(total * 0.05)));
    const valid = Math.max(0, total - errors);
    const previewRows: ImportPreviewRow[] = Array.from({ length: Math.min(10, valid) }).map(
      (_, i) => ({
        cells: sampleRow.slice(0, previewColumns.length).map((v, j) =>
          j === 0
            ? entity === "students"
              ? ["Ama Boateng", "Kofi Mensah", "Yaw Owusu", "Efua Sarpong", "Kojo Asante"][i % 5]
              : ["Dr. Sarah Owusu", "Prof. Michael Asare", "Dr. Elizabeth Tetteh"][i % 3]
            : v,
        ),
        valid: true,
      }),
    );
    const errorRows =
      entity === "students"
        ? [
            { row: 5, message: "Missing email address" },
            { row: 12, message: "Student ID already exists" },
            { row: 18, message: "Invalid department name" },
          ].slice(0, errors)
        : [
            { row: 3, message: "Staff ID already exists in the system" },
            { row: 7, message: "Department does not belong to selected Faculty" },
            { row: 11, message: "Email already registered as a student account" },
          ].slice(0, errors);
    setResult({ total, valid, errors, previewColumns, previewRows, errorRows });
    setValidating(false);
    setStep(3);
  }

  function confirmImport() {
    if (!result || result.valid === 0) return;
    onConfirm(result.valid);
    onOpenChange(false);
  }

  const noun = entity === "students" ? "students" : "supervisors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <StepDots step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">STEP 1 OF 3: Download Template</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Before uploading, download the Excel template and fill it with{" "}
                {entity === "students" ? "student" : "supervisor"} data. Do not change the column headers.
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download /> Download Excel Template
            </Button>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs font-medium text-muted-foreground">Template columns</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {templateColumns.map((c) => (
                  <Badge key={c} variant="secondary" className="font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="border-t pt-4 text-sm text-muted-foreground">
              Already have a filled file?
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Continue to Upload →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">STEP 2 OF 3: Upload File</div>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                Drag and drop your Excel or CSV file here
              </p>
              <p className="text-xs text-muted-foreground">or</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <Button variant="outline" className="mt-2" onClick={() => inputRef.current?.click()}>
                Browse Files
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Accepted formats: .xlsx .xls .csv &middot; Maximum file size: 10MB
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button disabled={!file || validating} onClick={validate}>
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Validating…
                  </>
                ) : (
                  "Upload and Validate"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">STEP 3 OF 3: Review and Import</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.valid} records ready to import
                </div>
              </div>
              <div
                className={cn(
                  "rounded-md border p-3 text-sm",
                  result.errors > 0
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-border bg-muted/30 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors} records have errors
                </div>
              </div>
            </div>

            {result.errors > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csv = ["Row,Message", ...result.errorRows.map((e) => `${e.row},"${e.message}"`)].join(
                    "\n",
                  );
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${entity}-import-errors.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download /> Download Error Report
              </Button>
            )}

            {result.previewRows.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Preview (showing first {result.previewRows.length} valid records)
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewColumns.map((c) => (
                          <TableHead key={c}>{c}</TableHead>
                        ))}
                        <TableHead className="w-10 text-right">✓</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.previewRows.map((r, i) => (
                        <TableRow key={i}>
                          {r.cells.map((c, j) => (
                            <TableCell key={j} className="text-xs">
                              {c}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {result.errorRows.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">Error records</div>
                <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm">
                  {result.errorRows.map((e) => (
                    <div key={e.row} className="flex items-center justify-between text-destructive">
                      <span>
                        <span className="font-medium">Row {e.row}:</span> {e.message}
                      </span>
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Only valid records will be imported. Fix errors and re-upload to import remaining rows.
            </p>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                ← Back
              </Button>
              {result.valid > 0 ? (
                <Button onClick={confirmImport}>
                  Import {result.valid} Valid Records
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No valid records to import — download the error report and re-upload.
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  function StepDots({ step }: { step: 1 | 2 | 3 }) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium",
              n < step && "border-emerald-500 bg-emerald-500/10 text-emerald-700",
              n === step && "border-primary bg-primary text-primary-foreground",
              n > step && "border-border text-muted-foreground",
            )}
          >
            {n < step ? "✓" : n}
          </span>
        ))}
        <span className="ml-2">{noun === "students" ? "Students" : "Supervisors"} import</span>
      </div>
    );
  }
}
