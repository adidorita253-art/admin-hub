
# Admin Dashboard — Faculty, Department, Programme, Level + Bulk Assignment

This is a large, multi-page change. I'll ship it as frontend-only using local seed data (Lovable Cloud is not enabled). All lists (faculties, departments, programmes) come from a single source-of-truth store so every dropdown across the app pulls from the same data.

## Data layer (new)

Create `src/lib/academic-structure.ts` seeded with the full HTU spec from the prompt:
- `faculties`: 6 entries (BS, FASS, FAD, FE, FAST, FBNE) with code + active status
- `departments`: 15 entries, each linked to a faculty id, with code + status
- `programmes`: ~40 entries linked to department id, with `type` ∈ `HND | BTech | BSc | BA | Bachelor`
- Helpers: `getDepartmentsByFaculty`, `getProgrammesByDepartment`, `isAttachmentEligible(programmeType, level)` implementing the rule (HND+200, BTech/BSc+300).

Extend `src/lib/mock-data.ts` (students, academic supervisors) with `facultyId`, `departmentId`, `programmeId`, `level`. Backfill existing mock rows with reasonable values so the table renders.

## Part 1 — System Settings tabs

`src/routes/settings.tsx` gets three tab additions in the required order:
`Attachment Period | Approvals | Faculties | Departments | Programmes | Letter Template | Version History | Branding & QR`.

- **Faculties tab**: table (Name / Code / Status / Actions), `+ Add Faculty`, Edit / Deactivate (no delete).
- **Departments tab**: updated to `Faculty | Department | Code | Status | Actions` with a Faculty dropdown in add/edit.
- **Programmes tab**: table `Faculty | Department | Programme | Type | Status | Actions` with Faculty/Department/Type filters (cascading), and `+ Add Programme` modal (Faculty → Department cascading, Name, Type, Status).

Each tab is a small component in `src/components/settings/`.

## Part 2 — Student add/edit form

Replace free-text Department with cascading dropdowns:
Faculty → Department → Programme → Level (100/200/300/400). Faculty auto-fills when Department is picked. Show a live "Eligible for Attachment" / "Not Yet Eligible" badge based on programme type + level.

## Part 3 — Admin Students page

Update `src/routes/students.tsx`:
- Columns: `☐ | Student | Reg No | Faculty | Department | Programme | Level | Year | Attachment | Supervisor | Account | Actions`
- Filters row: search + `Faculty ▼ Department ▼ Programme ▼ Level ▼ Status ▼ Attachment ▼` with cascading behavior and `Clear Filters`
- Keep existing three-dot menu actions unchanged.

## Part 4 — Bulk supervisor assignment

- Per-row checkbox + header master checkbox.
- Sticky bulk action bar between filters and table when any row selected: `N selected | [Assign Supervisor] [Deactivate] [Export Selected] [Clear ✕]`.
- Master checkbox: page-select first, then banner "Select all N students?" for cross-page selection.
- **Bulk Assign Supervisor modal**: lists selected students, searchable supervisor dropdown showing `Name — Department — X students`, amber badge on 20+ load, warning if some already have a supervisor, `Cancel` / `Assign to All` → confirm modal → toast + audit log entry.

## Part 5 — Academic Supervisors page

- Add Faculty + Department (cascading) required fields to add/edit form with the override note.
- Table columns: `Photo | Name | Email | Faculty | Department | Students Assigned | Reviews Pending | Status | Actions`.
- Filters: search + `Faculty ▼ Department ▼ Status ▼` (cascading).

## Part 6 — Single-student Assign Supervisor modal

Update the existing per-student assign action to group supervisors: **Recommended** (same faculty as student) first, then **Other Faculties**. Admin can still pick any.

## Audit logging

Extend `src/lib/audit-logs-data.ts` with a helper to append a bulk-assignment event; wire it from both the bulk and single assign flows.

## Technical notes

- All state lives in in-memory Zustand-style stores under `src/lib/` (matching existing `applications-store.ts`, `letters-store.ts` patterns) so edits in Settings immediately reflect in every dropdown.
- Reuse shadcn `Select`, `Command` (for searchable dropdown), `Checkbox`, `Dialog`, `Badge`, `Sonner` toast.
- No backend / no schema changes — this is all UI + local data as per the current project setup. If persistence across reloads is needed later, we can enable Lovable Cloud and migrate the stores to tables.

## Out of scope (this pass)

- Real DB persistence, RLS, auth roles.
- Deactivate / Export Selected bulk actions beyond wiring the buttons (Assign Supervisor is fully implemented; the other two show a toast placeholder unless you want them fully built now).

Confirm and I'll implement.
