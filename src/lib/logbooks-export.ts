// Real PDF & Excel export for a logbook.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { findStudent, findAcademicSupervisor } from "./mock-data";
import {
  weeksEndorsed,
  deriveStatus,
  LOGBOOK_STATUS_LABEL,
  type Logbook,
} from "./logbooks-data";

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function baseFilename(lb: Logbook) {
  const s = findStudent(lb.studentId);
  const name = `${s?.firstName ?? "Student"}_${s?.lastName ?? ""}`.replace(
    /\s+/g,
    "_",
  );
  return `Logbook_${name}_${s?.regNumber ?? lb.id}`;
}

export function exportLogbookPDF(lb: Logbook) {
  const s = findStudent(lb.studentId);
  const sup = findAcademicSupervisor(s?.academicSupervisorId ?? null);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text("Student Industrial Attachment Logbook", pageWidth / 2, 40, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.text("Attachment Admin System", pageWidth / 2, 56, { align: "center" });

  autoTable(doc, {
    startY: 76,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      ["Student", `${s?.firstName ?? ""} ${s?.lastName ?? ""}`],
      ["Registration No.", s?.regNumber ?? "—"],
      ["Department", s?.department ?? "—"],
      ["Company", s?.companyName ?? "—"],
      [
        "Academic Supervisor",
        sup ? `${sup.title} ${sup.firstName} ${sup.lastName}` : "—",
      ],
      [
        "Attachment Period",
        `${fmt(lb.attachmentStart)} – ${fmt(lb.attachmentEnd)}`,
      ],
      ["Academic Year", `${lb.academicYear} · ${lb.semester} Semester`],
      [
        "Weeks Endorsed",
        `${weeksEndorsed(lb)} / ${lb.totalWeeks}`,
      ],
      ["Status", LOGBOOK_STATUS_LABEL[deriveStatus(lb)]],
      ["Final Grade", lb.finalGrade ?? "Not Yet Graded"],
    ],
  });

  for (const w of lb.weeks) {
    const y =
      (doc as unknown as { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY ?? 100;
    if (y > 700) doc.addPage();
    autoTable(doc, {
      startY: y + 16,
      head: [
        [
          `Week ${w.weekNumber}  ·  ${fmt(w.startDate)} – ${fmt(w.endDate)}`,
          "",
          "",
        ],
      ],
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 10 },
      body: [
        [
          { content: "Day", styles: { fontStyle: "bold" } },
          { content: "Narrative", styles: { fontStyle: "bold" } },
          { content: "Hours", styles: { fontStyle: "bold" } },
        ],
        ...w.daily.map((d) => [
          d.day,
          d.narrative || "—",
          String(d.hoursWorked),
        ]),
        [
          { content: "Company Endorsement", styles: { fontStyle: "bold" } },
          `${w.company.status.toUpperCase()} · ${w.company.endorsedByName}`,
          fmt(w.company.endorsedAt),
        ],
        [
          { content: "Academic Endorsement", styles: { fontStyle: "bold" } },
          `${w.academic.status.toUpperCase()} · ${w.academic.endorsedByName}`,
          fmt(w.academic.endorsedAt),
        ],
      ],
      styles: { fontSize: 8, cellPadding: 3, valign: "top" },
      columnStyles: { 0: { cellWidth: 90 }, 2: { cellWidth: 70 } },
    });
  }

  if (lb.finalReport.text) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Final Attachment Report", 40, 50);
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(lb.finalReport.text, pageWidth - 80);
    doc.text(wrapped, 40, 72);
  }

  doc.save(`${baseFilename(lb)}.pdf`);
}

export function exportLogbookExcel(lb: Logbook) {
  const s = findStudent(lb.studentId);
  const sup = findAcademicSupervisor(s?.academicSupervisorId ?? null);
  const wb = XLSX.utils.book_new();

  const summary = [
    ["Student", `${s?.firstName ?? ""} ${s?.lastName ?? ""}`],
    ["Registration No.", s?.regNumber ?? "—"],
    ["Department", s?.department ?? "—"],
    ["Company", s?.companyName ?? "—"],
    [
      "Academic Supervisor",
      sup ? `${sup.title} ${sup.firstName} ${sup.lastName}` : "—",
    ],
    ["Attachment Start", fmt(lb.attachmentStart)],
    ["Attachment End", fmt(lb.attachmentEnd)],
    ["Academic Year", lb.academicYear],
    ["Semester", lb.semester],
    ["Weeks Endorsed", `${weeksEndorsed(lb)} / ${lb.totalWeeks}`],
    ["Status", LOGBOOK_STATUS_LABEL[deriveStatus(lb)]],
    ["Final Grade", lb.finalGrade ?? "Not Yet Graded"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 24 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  const dailyRows: (string | number)[][] = [
    [
      "Week",
      "Day",
      "Date",
      "Narrative",
      "Hours",
      "Attachments",
      "Company Status",
      "Academic Status",
    ],
  ];
  for (const w of lb.weeks) {
    for (const d of w.daily) {
      dailyRows.push([
        w.weekNumber,
        d.day,
        fmt(d.date),
        d.narrative || "",
        d.hoursWorked,
        d.attachments.map((a) => a.name).join(", "),
        w.company.status,
        w.academic.status,
      ]);
    }
  }
  const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
  wsDaily["!cols"] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 14 },
    { wch: 70 },
    { wch: 6 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Entries");

  const endRows: (string | number)[][] = [
    [
      "Week",
      "Period",
      "Section",
      "Attendance",
      "Discipline",
      "Punctuality",
      "On Schedule",
      "Under Pressure",
      "Aptitude",
      "Company Endorsed By",
      "Company Endorsed At",
      "Company Status",
      "Academic Endorsed By",
      "Academic Endorsed At",
      "Academic Status",
      "Academic Comments",
    ],
  ];
  for (const w of lb.weeks) {
    endRows.push([
      w.weekNumber,
      `${fmt(w.startDate)} – ${fmt(w.endDate)}`,
      w.company.section,
      w.company.attendance,
      w.company.discipline,
      w.company.punctuality,
      w.company.workOnSchedule,
      w.company.workUnderPressure,
      w.company.generalAptitude,
      w.company.endorsedByName,
      fmt(w.company.endorsedAt),
      w.company.status,
      w.academic.endorsedByName,
      fmt(w.academic.endorsedAt),
      w.academic.status,
      w.academic.comments,
    ]);
  }
  const wsEnd = XLSX.utils.aoa_to_sheet(endRows);
  XLSX.utils.book_append_sheet(wb, wsEnd, "Endorsements");

  XLSX.writeFile(wb, `${baseFilename(lb)}.xlsx`);
}
