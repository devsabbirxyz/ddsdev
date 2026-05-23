// Browser-side invoice/receipt PDF generator using jsPDF.
import { jsPDF } from "jspdf";

export type InvoiceOrder = {
  order_number: string;
  product_title: string;
  variant_label?: string | null;
  quantity?: number | null;
  regular_price?: number | null;
  offer_price?: number | null;
  total_price: number;
  discount_amount?: number | null;
  coupon_code?: string | null;
  payment_method: string;
  payment_type?: string | null;
  transaction_id?: string | null;
  status?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  created_at?: string | null;
};

const BRAND = "DDS-Digital";

function bdt(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return `BDT ${v.toLocaleString("en-US")}`;
}

export function downloadInvoicePDF(order: InvoiceOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(13, 13, 26);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(BRAND, margin, 38);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Digital Products Marketplace", margin, 56);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", W - margin, 38, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${order.order_number}`, W - margin, 56, { align: "right" });

  y = 110;
  doc.setTextColor(40, 40, 40);

  // Meta block
  const date = order.created_at ? new Date(order.created_at).toLocaleString("en-GB") : new Date().toLocaleString("en-GB");
  doc.setFontSize(10);
  doc.text(`Date: ${date}`, margin, y);
  doc.text(`Status: ${(order.status ?? "pending").toUpperCase()}`, W - margin, y, { align: "right" });
  y += 22;

  // Bill to
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 16;
  doc.text(order.customer_name, margin, y); y += 14;
  doc.text(order.customer_email, margin, y); y += 14;
  if (order.customer_phone) { doc.text(order.customer_phone, margin, y); y += 14; }

  y += 10;

  // Items table header
  doc.setFillColor(240, 240, 245);
  doc.rect(margin, y, W - margin * 2, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Item", margin + 8, y + 15);
  doc.text("Qty", W - margin - 180, y + 15, { align: "right" });
  doc.text("Price", W - margin - 90, y + 15, { align: "right" });
  doc.text("Subtotal", W - margin - 8, y + 15, { align: "right" });
  y += 22;

  doc.setFont("helvetica", "normal");
  const qty = order.quantity ?? 1;
  const unit = Number(order.offer_price ?? order.regular_price ?? order.total_price / Math.max(1, qty));
  const title = order.variant_label ? `${order.product_title} — ${order.variant_label}` : order.product_title;
  const lines = doc.splitTextToSize(title, W - margin * 2 - 220);
  doc.text(lines, margin + 8, y + 14);
  doc.text(String(qty), W - margin - 180, y + 14, { align: "right" });
  doc.text(bdt(unit), W - margin - 90, y + 14, { align: "right" });
  doc.text(bdt(unit * qty), W - margin - 8, y + 14, { align: "right" });
  y += Math.max(28, lines.length * 14 + 14);

  // Totals
  doc.setDrawColor(220);
  doc.line(margin, y, W - margin, y);
  y += 16;

  const right = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, W - margin - 120, y, { align: "right" });
    doc.text(value, W - margin - 8, y, { align: "right" });
    y += bold ? 20 : 16;
  };

  const subtotal = unit * qty;
  right("Subtotal", bdt(subtotal));
  if (Number(order.discount_amount ?? 0) > 0) {
    right(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`, `- ${bdt(order.discount_amount)}`);
  }
  y += 4;
  doc.setDrawColor(180);
  doc.line(W - margin - 240, y - 8, W - margin, y - 8);
  right("Total", bdt(order.total_price), true);

  y += 14;
  // Payment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 16;
  doc.text(`Method: ${order.payment_method}${order.payment_type ? ` (${order.payment_type})` : ""}`, margin, y); y += 14;
  if (order.transaction_id) { doc.text(`Transaction ID: ${order.transaction_id}`, margin, y); y += 14; }

  // Footer
  doc.setDrawColor(220);
  doc.line(margin, 780, W - margin, 780);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Thank you for shopping with ${BRAND}!`, margin, 798);
  doc.text("This is a system-generated invoice.", W - margin, 798, { align: "right" });

  doc.save(`invoice-${order.order_number}.pdf`);
}
