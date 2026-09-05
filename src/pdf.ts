import type { Attachment, PropertyProfile, RepairRecord } from './types';
import { formatBytes, formatDate } from './utils';

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function attachmentJpeg(attachment: Attachment): Promise<{ data: string; width: number; height: number } | null> {
  if (!attachment.type.startsWith('image/')) return null;
  const data = await readDataUrl(attachment.blob);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const max = 1400;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ data: canvas.toDataURL('image/jpeg', 0.76), width: canvas.width, height: canvas.height });
    };
    image.onerror = () => resolve(null);
    image.src = data;
  });
}

export async function exportProofPdf(property: PropertyProfile, records: RepairRecord[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: false });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 52;
  const contentWidth = pageWidth - margin * 2;

  const header = (label: string) => {
    pdf.setFillColor(9, 42, 67);
    pdf.rect(0, 0, pageWidth, 72, 'F');
    pdf.setTextColor(246, 242, 232);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('MAINTENANCE PROOF BOOK', margin, 30);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label.toUpperCase(), margin, 50);
  };

  pdf.setFillColor(9, 42, 67);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setTextColor(246, 242, 232);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('PROPERTY RECORD / LOCAL EXPORT', margin, 84);
  pdf.setFontSize(34);
  const title = property.name || 'My home';
  pdf.text(pdf.splitTextToSize(title, contentWidth), margin, 142);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text(pdf.splitTextToSize(property.address || 'Address not recorded', contentWidth), margin, 208);
  pdf.setDrawColor(233, 118, 58);
  pdf.setLineWidth(4);
  pdf.line(margin, 250, margin + 110, 250);
  pdf.setFontSize(12);
  pdf.text(`${records.length} repair record${records.length === 1 ? '' : 's'}`, margin, 290);
  pdf.text(`Exported ${new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, margin, 314);
  pdf.setFontSize(9);
  pdf.setTextColor(185, 206, 219);
  pdf.text(pdf.splitTextToSize('This is a homeowner-created record. It preserves the attachment names, types, sizes and recorded dates supplied to the app; it is not a legal certification or authenticity service.', contentWidth), margin, pageHeight - 72);

  for (const [recordIndex, record] of records.entries()) {
    pdf.addPage();
    header(`Repair ${recordIndex + 1} of ${records.length} · ${record.id.slice(0, 8)}`);
    pdf.setTextColor(18, 34, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(pdf.splitTextToSize(record.title, contentWidth), margin, 116);
    pdf.setFontSize(10);
    pdf.setTextColor(91, 105, 114);
    pdf.text(`${formatDate(record.completedDate)}  /  ${record.area || 'Area not recorded'}`, margin, 154);
    const detailRows = [
      ['Contractor', record.contractor || 'Not recorded'],
      ['Vendor', record.vendor || 'Not recorded'],
      ['Part / model', record.part || 'Not recorded'],
      ['Cost', record.cost == null ? 'Not recorded' : new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(record.cost)],
      ['Next action', record.nextAction],
      ['Next due', formatDate(record.nextDue)]
    ];
    let y = 188;
    pdf.setFontSize(10);
    for (const [label, value] of detailRows) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(155, 61, 20);
      pdf.text(label.toUpperCase(), margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(18, 34, 45);
      const lines = pdf.splitTextToSize(value, contentWidth - 112);
      pdf.text(lines, margin + 112, y);
      y += Math.max(24, lines.length * 13 + 8);
    }
    if (record.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(155, 61, 20);
      pdf.text('NOTES', margin, y + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(18, 34, 45);
      const notes = pdf.splitTextToSize(record.notes, contentWidth);
      pdf.text(notes.slice(0, 9), margin, y + 24);
      y += Math.min(9, notes.length) * 13 + 38;
    }
    pdf.setDrawColor(191, 198, 198);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 24;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(18, 34, 45);
    pdf.text(`EVIDENCE INDEX · ${record.attachments.length}`, margin, y);
    y += 22;
    for (const [index, attachment] of record.attachments.entries()) {
      if (y > pageHeight - 86) { pdf.addPage(); header(`${record.title} · evidence continued`); y = 104; }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(`${index + 1}. ${attachment.name}`, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(91, 105, 114);
      pdf.text(`${attachment.type || 'unknown type'} · ${formatBytes(attachment.size)} · added ${new Date(attachment.addedAt).toLocaleString()}`, margin, y + 14);
      pdf.setTextColor(18, 34, 45);
      y += 34;
      const image = await attachmentJpeg(attachment);
      if (image) {
        const targetHeight = Math.min(190, contentWidth * image.height / image.width);
        if (y + targetHeight > pageHeight - 60) { pdf.addPage(); header(`${record.title} · image evidence`); y = 96; }
        const targetWidth = targetHeight * image.width / image.height;
        pdf.addImage(image.data, 'JPEG', margin, y, targetWidth, targetHeight, undefined, 'FAST');
        y += targetHeight + 20;
      }
    }
    if (record.attachments.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(91, 105, 114);
      pdf.text('No attachments were added to this record.', margin, y);
    }
  }

  const safeName = (property.name || 'home').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  pdf.save(`${safeName || 'home'}-maintenance-proof-book.pdf`);
}
