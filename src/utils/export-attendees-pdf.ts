import type { Event, EventRegistration } from "@/types";

export function formatDeptShort(dept?: string | null): string {
  if (!dept) return "—";
  const d = dept.trim().toUpperCase();
  if (d.includes("COMPUTER SCIENCE") || d.includes("CSE") || d === "CS") return "CSE";
  if (d.includes("SOFTWARE") || d.includes("SWE") || d.includes("SE")) return "SWE";
  if (d.includes("ELECTRICAL") || d.includes("EEE") || d.includes("EE")) return "EEE";
  if (d.includes("CYBER") || d.includes("CYS")) return "CYBER";
  if (d.includes("INFORMATION TECH") || d.includes("IT")) return "IT";
  if (d.includes("INFORMATION SYSTEM") || d.includes("CIS")) return "CIS";
  if (d.includes("CIVIL") || d.includes("CE")) return "CE";
  if (d.includes("MECHANICAL") || d.includes("ME")) return "ME";
  if (d.includes("BBA") || d.includes("BUSINESS")) return "BBA";
  if (d.includes("ENGLISH") || d.includes("ENG")) return "ENG";
  if (d.length <= 6) return d;
  return d.slice(0, 6);
}

interface ExportPdfOptions {
  event: Event & {
    registrations?: Array<
      EventRegistration & {
        user?: {
          id: string;
          name: string;
          email: string;
          studentId?: string | null;
          rollNumber?: string | null;
          batch?: string | null;
          department?: string | null;
          phone?: string | null;
          role: string;
        };
        payment?: {
          id: string;
          amount: number;
          status: string;
          transactionId: string;
          paymentMethod: string;
        } | null;
      }
    >;
    attendance?: Array<{
      userId: string;
      status: "PRESENT" | "ABSENT" | "LATE";
    }>;
  };
}

export async function exportEventAttendeesPdf({ event }: ExportPdfOptions): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginLeft = 12;
  const marginRight = 12;
  const contentWidth = pageWidth - marginLeft - marginRight; // 273mm

  const registrations = event.registrations || [];
  const totalRegs = registrations.length;
  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length;

  const eventDateStr = new Date(event.startDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Table Column Definitions: Name, Email, Roll, Batch, Dept in short form, Signature
  const columns = [
    { header: "#", width: 12, align: "center" as const },
    { header: "Name", width: 54, align: "left" as const },
    { header: "Email", width: 60, align: "left" as const },
    { header: "Roll No", width: 35, align: "left" as const },
    { header: "Batch", width: 22, align: "center" as const },
    { header: "Dept", width: 22, align: "center" as const },
    { header: "Signature", width: 68, align: "center" as const },
  ];

  let currentPage = 1;
  const rowsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(registrations.length / rowsPerPage));

  function drawHeader(page: number) {
    // Header background banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, "F");

    // Decorative emerald accent line
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 28, pageWidth, 1.5, "F");

    // Club Brand Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("CYBER SECURITY CLUB", marginLeft, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(167, 243, 208); // emerald-200
    doc.text("Official Event Attendee & Verification Roster", marginLeft, 17);

    // Event Info (Top Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    const eventTitle = doc.splitTextToSize(event.title, 110);
    doc.text(eventTitle[0] || event.title, pageWidth - marginRight, 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    const subInfo = `Date: ${eventDateStr}  |  Venue: ${event.venue}  |  Type: ${event.type}`;
    doc.text(subInfo, pageWidth - marginRight, 17, { align: "right" });

    const statsInfo = `Total Attendees: ${totalRegs}  |  Approved Seats: ${approvedCount}`;
    doc.text(statsInfo, pageWidth - marginRight, 23, { align: "right" });

    // Summary metadata bar below header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}  •  Page ${page} of ${totalPages}`,
      marginLeft,
      35
    );
  }

  function drawTableHeaders(startY: number) {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginLeft, startY, contentWidth, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let currentX = marginLeft;
    columns.forEach((col) => {
      let textX = currentX + 2;
      if (col.align === "center") textX = currentX + col.width / 2;
      doc.text(col.header, textX, startY + 5.5, { align: col.align });
      currentX += col.width;
    });
  }

  function drawFooter(page: number) {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Cyber Security Club — Confidential & Internal Club Use Only", marginLeft, pageHeight - 7);

    // Verifier signature space
    doc.text("Verifier Signature: _______________________", pageWidth - marginRight - 65, pageHeight - 7);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginRight, pageHeight - 7, { align: "right" });
  }

  // Render Pages & Rows
  for (let p = 0; p < totalPages; p++) {
    if (p > 0) {
      doc.addPage();
      currentPage++;
    }

    drawHeader(currentPage);

    const tableStartY = 38;
    drawTableHeaders(tableStartY);

    const startIndex = p * rowsPerPage;
    const pageRows = registrations.slice(startIndex, startIndex + rowsPerPage);

    let rowY = tableStartY + 8;
    const rowHeight = 11.5;

    pageRows.forEach((reg, i) => {
      const globalIndex = startIndex + i + 1;
      const isEven = i % 2 === 0;

      // Row background
      if (isEven) {
        doc.setFillColor(248, 250, 252); // slate-50
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(marginLeft, rowY, contentWidth, rowHeight, "F");

      // Row border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(marginLeft, rowY, contentWidth, rowHeight, "S");

      // NAME: strictly taken from user profile (fallback to preferredName)
      const attendeeName = reg.user?.name || reg.preferredName || "Unknown Member";
      const email = reg.user?.email || "—";
      const rollNumber = reg.user?.rollNumber || reg.user?.studentId || reg.studentId || "—";
      const batch = reg.user?.batch || "—";
      const deptShort = formatDeptShort(reg.user?.department || reg.department);

      // Draw Cells
      let currentX = marginLeft;

      // 1. Index (#)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(String(globalIndex), currentX + columns[0].width / 2, rowY + 7, { align: "center" });
      currentX += columns[0].width;

      // 2. Attendee Name (from user profile)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      const truncatedName = doc.splitTextToSize(attendeeName, columns[1].width - 4);
      doc.text(truncatedName[0] || attendeeName, currentX + 2, rowY + 7);
      currentX += columns[1].width;

      // 3. Email
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const emailText = doc.splitTextToSize(email, columns[2].width - 4);
      doc.text(emailText[0] || email, currentX + 2, rowY + 7);
      currentX += columns[2].width;

      // 4. Roll No / Student ID
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const rollText = doc.splitTextToSize(rollNumber, columns[3].width - 4);
      doc.text(rollText[0] || rollNumber, currentX + 2, rowY + 7);
      currentX += columns[3].width;

      // 5. Batch
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(batch, currentX + columns[4].width / 2, rowY + 7, { align: "center" });
      currentX += columns[4].width;

      // 6. Department (Short form)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(16, 149, 106); // emerald-700
      doc.text(deptShort, currentX + columns[5].width / 2, rowY + 7, { align: "center" });
      currentX += columns[5].width;

      // 7. Signature Line (Wide, clear line for manual event check-in)
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text("________________________", currentX + columns[6].width / 2, rowY + 7, { align: "center" });

      rowY += rowHeight;
    });

    drawFooter(currentPage);
  }

  // Clean filename and trigger download
  const sanitizedTitle = (event.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${sanitizedTitle}_Attendee_List_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
