// lib/vcard.ts
export interface VCardContact {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  note?: string;
}

/**
 * Generates an RFC 6350 compliant vCard (.vcf) payload.
 * Compatible with iOS Contacts, Google Contacts, macOS Address Book, and Outlook.
 */
export function generateVCard(contact: VCardContact): string {
  const parts = (contact.name || "Contact").trim().split(/\s+/);
  const firstName = parts[0] || "Contact";
  const lastName = parts.slice(1).join(" ") || "";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${contact.name.trim() || "Contact"}`,
  ];

  if (contact.company) {
    lines.push(`ORG:${contact.company.trim()}`);
  }
  if (contact.title) {
    lines.push(`TITLE:${contact.title.trim()}`);
  }
  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${contact.phone.trim()}`);
  }
  if (contact.email) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${contact.email.trim()}`);
  }
  if (contact.website) {
    lines.push(`URL:${contact.website.trim()}`);
  }
  if (contact.address) {
    lines.push(`ADR;TYPE=WORK:;;${contact.address.trim()};;;;`);
  }

  lines.push(`NOTE:${contact.note ? contact.note.trim() : "Saved via DynamicQR NameLaunch instant brand card."}`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
}
