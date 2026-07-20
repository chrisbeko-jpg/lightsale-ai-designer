import type {
  Luminaire,
  OutputSettings,
  Room,
  ScaleCalibration,
} from "@lightsale/shared";
import {
  PDF_DISCLAIMER,
  buildArticleList,
  buildLightingPlanPdfFilename,
  buildProductLegend,
  countLuminairesForRoom,
  extractPdfProjectMetadata,
  formatAreaSquareMetres,
  getEffectiveTargetLux,
  getProductById,
  getProductDisplayColor,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import { roomTypeLabel } from "@/lib/room-property-labels";
import { jsPDF } from "jspdf";
import {
  loadImageElement,
  loadProductThumbnailBase64,
  renderPlanToDataUrl,
} from "./render-plan-image";

export interface PdfExportDocument {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  outputSettings: OutputSettings;
  projectName: string;
  floorPlanUrl: string | null;
  floorPlanSize: { width: number; height: number } | null;
}

function addPdfFooter(
  doc: jsPDF,
  meta: ReturnType<typeof extractPdfProjectMetadata>,
  pageNumber: number,
  totalPages: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(meta.projectName, 14, pageHeight - 8);
  doc.text(meta.outputDate || new Date().toISOString().slice(0, 10), pageWidth / 2, pageHeight - 8, {
    align: "center",
  });
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 14, pageHeight - 8, {
    align: "right",
  });
}

export async function exportLightingPlanPdf(
  document: PdfExportDocument,
): Promise<{ filename: string; blob: Blob }> {
  const meta = extractPdfProjectMetadata(
    document.outputSettings,
    document.projectName,
  );
  const filename = buildLightingPlanPdfFilename(meta.projectName);
  const articleList = buildArticleList(document.luminaires, document.rooms);
  const legend = buildProductLegend(document.luminaires.map((l) => l.productId));

  let floorPlanImage: HTMLImageElement | null = null;
  if (document.floorPlanUrl) {
    try {
      floorPlanImage = await loadImageElement(document.floorPlanUrl);
    } catch {
      floorPlanImage = null;
    }
  }

  const planDataUrl = await renderPlanToDataUrl({
    rooms: document.rooms,
    luminaires: document.luminaires,
    scale: document.scale,
    settings: document.outputSettings,
    floorPlanImage,
    pixelWidth: document.floorPlanSize?.width ?? floorPlanImage?.naturalWidth ?? 0,
    pixelHeight: document.floorPlanSize?.height ?? floorPlanImage?.naturalHeight ?? 0,
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Lightsale", 14, 16);
  doc.setFontSize(14);
  doc.text(meta.projectName, 14, 24);

  doc.setFontSize(9);
  let infoY = 32;
  const infoLines: string[] = [];
  if (meta.customerName) {
    infoLines.push(`Customer: ${meta.customerName}`);
  }
  if (meta.projectReference) {
    infoLines.push(`Reference: ${meta.projectReference}`);
  }
  if (meta.projectAddress) {
    infoLines.push(`Address: ${meta.projectAddress}`);
  }
  if (meta.designerName) {
    infoLines.push(`Designer: ${meta.designerName}`);
  }
  infoLines.push(`Date: ${meta.outputDate || new Date().toISOString().slice(0, 10)}`);
  for (const line of infoLines) {
    doc.text(line, 14, infoY);
    infoY += 5;
  }

  const planTop = Math.max(infoY + 4, 48);
  const planHeight = pageH - planTop - 36;
  const planWidth = pageW - 80;
  doc.addImage(planDataUrl, "PNG", 14, planTop, planWidth, planHeight);

  if (document.outputSettings.showLegend && legend.length > 0) {
    let legendY = planTop;
    doc.setFontSize(9);
    doc.text("Legend", pageW - 62, legendY);
    legendY += 5;
    for (const entry of legend.slice(0, 12)) {
      doc.setFillColor(entry.color);
      doc.circle(pageW - 60, legendY - 1.5, 1.5, "F");
      doc.setTextColor(30, 41, 59);
      doc.text(entry.label.slice(0, 28), pageW - 56, legendY);
      legendY += 5;
    }
  }

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(PDF_DISCLAIMER, 14, pageH - 14, { maxWidth: pageW - 28 });

  doc.addPage("a4", "portrait");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Article list", 14, 18);

  let y = 28;
  doc.setFontSize(9);
  for (const row of articleList.rows) {
    const thumb = await loadProductThumbnailBase64(row.productId);
    const color = getProductDisplayColor(row.productId);
    doc.setFillColor(color);
    doc.circle(16, y - 1, 2, "F");
    if (thumb) {
      doc.addImage(thumb, "PNG", 20, y - 6, 8, 8);
    }
    doc.setTextColor(30, 41, 59);
    const line = `${row.brand} · ${row.productName} · ${row.articleNumber} · ×${row.quantity} · ${row.luminousFluxPerLuminaire} lm · ${row.powerPerLuminaire} W · ${Math.round(row.totalWattage)} W total`;
    doc.text(line.slice(0, 110), 30, y);
    y += 10;
    if (y > pageH - 30) {
      doc.addPage("a4", "portrait");
      y = 20;
    }
  }

  y += 4;
  doc.setFontSize(10);
  doc.text(`Total luminaires: ${articleList.totalLuminaires}`, 14, y);
  y += 6;
  doc.text(
    `Total wattage: ${Math.round(articleList.totalInstalledWattage)} W`,
    14,
    y,
  );
  y += 6;
  doc.text(`Unique products: ${articleList.uniqueProductCount}`, 14, y);
  y += 6;
  doc.text(`Rooms: ${articleList.roomsIncludedCount}`, 14, y);

  const roomsWithLuminaires = document.rooms.filter((room) =>
    document.luminaires.some((item) => item.roomId === room.id),
  );

  for (const room of roomsWithLuminaires) {
    doc.addPage("a4", "portrait");
    let ry = 20;
    doc.setFontSize(14);
    doc.text("Room summary", 14, ry);
    ry += 10;
    doc.setFontSize(11);
    doc.text(room.name, 14, ry);
    ry += 7;
    doc.setFontSize(9);
    const areaM2 =
      document.scale !== null
        ? polygonAreaSquareMetres(room.vertices, document.scale)
        : null;
    doc.text(`Type: ${roomTypeLabel(room.roomType)}`, 14, ry);
    ry += 5;
    doc.text(
      `Area: ${areaM2 !== null ? formatAreaSquareMetres(areaM2) : "—"}`,
      14,
      ry,
    );
    ry += 5;
    doc.text(`Target lux: ${getEffectiveTargetLux(room)} lx`, 14, ry);
    ry += 5;
    const product =
      room.selectedProductId !== null
        ? getProductById(room.selectedProductId)
        : undefined;
    doc.text(
      `Selected product: ${product ? `${product.brand} — ${product.name}` : "—"}`,
      14,
      ry,
    );
    ry += 5;
    const placed = countLuminairesForRoom(document.luminaires, room.id);
    const watts = document.luminaires
      .filter((item) => item.roomId === room.id)
      .reduce((sum, item) => {
        const p = getProductById(item.productId);
        return sum + (p?.powerWatts ?? 0);
      }, 0);
    doc.text(`Installed quantity: ${placed}`, 14, ry);
    ry += 5;
    doc.text(`Installed wattage: ${Math.round(watts)} W`, 14, ry);
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    addPdfFooter(doc, meta, page, totalPages);
  }

  const blob = doc.output("blob");
  return { filename, blob };
}

export function downloadPdfBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
