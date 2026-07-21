import type {
  Luminaire,
  OutputSettings,
  Room,
  ScaleCalibration,
} from "@lightsale/shared";
import {
  buildArticleList,
  buildLightingPlanPdfFilename,
  buildProductLegend,
  calculateProjectLightingSummary,
  extractPdfProjectMetadata,
  formatAreaSquareMetres,
  getProductById,
  getProductDisplayColor,
  INDICATIVE_LUX_DISCLAIMER_NL,
  INDICATIVE_LUX_PDF_DISCLAIMER_NL,
} from "@lightsale/shared";
import { roomTypeLabel } from "@/lib/room-property-labels";
import { LIGHTSALE_LOGO_SRC } from "@/lib/brand/lightsale-logo";
import { jsPDF } from "jspdf";
import {
  loadImageElement,
  renderPlanToDataUrl,
} from "./render-plan-image";
import {
  PDF_IMAGE_ERROR_NL,
  prepareImageForPdf,
  preparePngDataUrlForPdfExport,
  validatePngDataUrl,
} from "./prepare-image-for-pdf";

export interface PdfExportDocument {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  outputSettings: OutputSettings;
  projectName: string;
  floorPlanUrl: string | null;
  floorPlanSize: { width: number; height: number } | null;
}

const CHARCOAL: [number, number, number] = [46, 49, 53];
const MUTED: [number, number, number] = [107, 114, 128];
const SUCCESS: [number, number, number] = [46, 139, 87];
const WARNING: [number, number, number] = [217, 119, 6];
const ERROR: [number, number, number] = [192, 57, 43];
const ACCENT: [number, number, number] = [242, 201, 76];

function addPdfFooter(
  doc: jsPDF,
  meta: ReturnType<typeof extractPdfProjectMetadata>,
  pageNumber: number,
  totalPages: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("Lightsale", 14, pageHeight - 10);
  doc.text(meta.projectName, 14, pageHeight - 6);
  doc.text(
    meta.outputDate || new Date().toISOString().slice(0, 10),
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" },
  );
  doc.text(`Pagina ${pageNumber} / ${totalPages}`, pageWidth - 14, pageHeight - 8, {
    align: "right",
  });
  doc.text(INDICATIVE_LUX_PDF_DISCLAIMER_NL, 14, pageHeight - 4, {
    maxWidth: pageWidth - 28,
  });
}

async function loadProductThumbnailPng(productId: string): Promise<string | null> {
  const product = getProductById(productId);
  if (!product) {
    return null;
  }
  const path =
    product.imageUrl ?? `/product-thumbnails/${product.category}.svg`;
  const origin = globalThis.window?.location?.origin ?? "";
  const absolute =
    path.startsWith("http") || path.startsWith("data:") ? path : `${origin}${path}`;
  return prepareImageForPdf(absolute, { width: 64, height: 64 });
}

function statusRgb(band: "green" | "amber" | "red" | null): [number, number, number] {
  if (band === "green") {
    return SUCCESS;
  }
  if (band === "amber") {
    return WARNING;
  }
  if (band === "red") {
    return ERROR;
  }
  return MUTED;
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
  const lightingSummary = calculateProjectLightingSummary({
    rooms: document.rooms,
    luminaires: document.luminaires,
    scale: document.scale,
  });

  let floorPlanImage: HTMLImageElement | null = null;
  if (document.floorPlanUrl) {
    try {
      floorPlanImage = await loadImageElement(document.floorPlanUrl);
    } catch {
      floorPlanImage = null;
    }
  }

  let logoPng: string | null = null;
  try {
    const logoSrc = `${globalThis.window?.location?.origin ?? ""}${LIGHTSALE_LOGO_SRC}`;
    logoPng = await prepareImageForPdf(logoSrc, { width: 320, height: 90 });
  } catch {
    logoPng = null;
  }

  const planDataUrlRaw = await renderPlanToDataUrl({
    rooms: document.rooms,
    luminaires: document.luminaires,
    scale: document.scale,
    settings: document.outputSettings,
    floorPlanImage,
    pixelWidth: document.floorPlanSize?.width ?? floorPlanImage?.naturalWidth ?? 0,
    pixelHeight: document.floorPlanSize?.height ?? floorPlanImage?.naturalHeight ?? 0,
  });

  const planDataUrl = await preparePngDataUrlForPdfExport(planDataUrlRaw);
  if (planDataUrl === null || !validatePngDataUrl(planDataUrl)) {
    throw new Error(PDF_IMAGE_ERROR_NL);
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  if (logoPng) {
    doc.addImage(logoPng, "PNG", 14, 10, 32, 10);
  } else {
    doc.setFontSize(14);
    doc.setTextColor(...CHARCOAL);
    doc.text("Lightsale", 14, 16);
  }

  doc.setFillColor(...ACCENT);
  doc.rect(14, 22, pageW - 28, 1.2, "F");

  doc.setFontSize(16);
  doc.setTextColor(...CHARCOAL);
  doc.text(meta.projectName, 14, 30);

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  let infoY = 36;
  const infoLines: string[] = [];
  if (meta.customerName) {
    infoLines.push(`Klant: ${meta.customerName}`);
  }
  if (meta.projectAddress) {
    infoLines.push(`Adres: ${meta.projectAddress}`);
  }
  if (meta.projectReference) {
    infoLines.push(`Referentie: ${meta.projectReference}`);
  }
  if (meta.designerName) {
    infoLines.push(`Ontwerper: ${meta.designerName}`);
  }
  infoLines.push(`Datum: ${meta.outputDate || new Date().toISOString().slice(0, 10)}`);
  for (const line of infoLines) {
    doc.text(line, 14, infoY);
    infoY += 4.5;
  }

  doc.setFontSize(8);
  doc.text(
    `Ruimtes: ${document.rooms.length} · Armaturen: ${lightingSummary.totalLuminaires} · ${Math.round(lightingSummary.totalInstalledWattage)} W · Doel gehaald: ${lightingSummary.roomsMeetingTarget}/${lightingSummary.roomsMeetingTarget + lightingSummary.roomsNotMeetingTarget}`,
    14,
    infoY + 2,
  );

  const planTop = infoY + 8;
  const planHeight = pageH - planTop - 22;
  const planWidth = pageW - 28;
  const canvasAspect = 1600 / 1100;
  const boxAspect = planWidth / planHeight;
  let drawW = planWidth;
  let drawH = planHeight;
  let drawX = 14;
  let drawY = planTop;
  if (boxAspect > canvasAspect) {
    drawH = planWidth / canvasAspect;
    drawY = planTop + (planHeight - drawH) / 2;
  } else {
    drawW = planHeight * canvasAspect;
    drawX = 14 + (planWidth - drawW) / 2;
  }
  doc.addImage(planDataUrl, "PNG", drawX, drawY, drawW, drawH);

  if (document.outputSettings.showLegend && legend.length > 0) {
    let legendY = planTop + 4;
    doc.setFontSize(8);
    doc.setTextColor(...CHARCOAL);
    doc.text("Legenda", pageW - 52, legendY);
    legendY += 4;
    for (const entry of legend.slice(0, 10)) {
      doc.setFillColor(entry.color);
      doc.circle(pageW - 50, legendY - 1.2, 1.4, "F");
      doc.setTextColor(...CHARCOAL);
      doc.text(entry.label.slice(0, 24), pageW - 47, legendY);
      legendY += 4;
    }
  }

  if (document.outputSettings.includeLightIndicatorInPdf) {
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      "Light Indicator: paars = hoogste indicatieve concentratie · rood = laag · geen kleur = weinig bijdrage (indicatief, geen uniformiteit)",
      14,
      pageH - 18,
      { maxWidth: pageW - 28 },
    );
  }

  doc.addPage("a4", "portrait");
  let ry = 18;
  doc.setFontSize(16);
  doc.setTextColor(...CHARCOAL);
  doc.text("Ruimteprestaties", 14, ry);
  ry += 8;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    "Indicatieve gemiddelde lux = totaal effectieve lumen / ruimteoppervlak.",
    14,
    ry,
  );
  ry += 6;
  doc.text(INDICATIVE_LUX_DISCLAIMER_NL, 14, ry, { maxWidth: pageW - 28 });
  ry += 10;

  const portraitH = doc.internal.pageSize.getHeight();
  for (const roomPerf of lightingSummary.rooms) {
    if (roomPerf.placedQuantityInsideRoom === 0) {
      continue;
    }
    const room = document.rooms.find((item) => item.id === roomPerf.roomId);
    if (ry > portraitH - 40) {
      doc.addPage("a4", "portrait");
      ry = 18;
    }
    doc.setFillColor(...statusRgb(roomPerf.compliance.band));
    doc.rect(14, ry - 4, 2, 14, "F");
    doc.setFontSize(11);
    doc.setTextColor(...CHARCOAL);
    doc.text(roomPerf.roomName, 18, ry);
    ry += 5;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Type: ${room ? roomTypeLabel(room.roomType) : "—"} · Oppervlak: ${
        roomPerf.areaSquareMetres !== null
          ? formatAreaSquareMetres(roomPerf.areaSquareMetres)
          : "—"
      }`,
      18,
      ry,
    );
    ry += 4;
    doc.text(
      `Doel: ${roomPerf.targetLux} lx · Geplaatst: ${roomPerf.placedQuantityInsideRoom} · ${Math.round(roomPerf.totalInstalledWattage)} W · Indicatief gem.: ${roomPerf.indicativeAverageLux ?? "—"} lx (${roomPerf.compliance.differencePercent !== null ? `${roomPerf.compliance.differencePercent >= 0 ? "+" : ""}${roomPerf.compliance.differencePercent.toFixed(0)}%` : "—"}) · ${roomPerf.compliance.meetsTarget ? "Voldoet" : "Voldoet niet"}`,
      18,
      ry,
      { maxWidth: pageW - 32 },
    );
    ry += 10;
  }

  doc.addPage("a4", "portrait");
  doc.setFontSize(16);
  doc.setTextColor(...CHARCOAL);
  doc.text("Artikellijst", 14, 18);

  let y = 28;
  doc.setFontSize(8);
  for (const row of articleList.rows) {
    const thumb = await loadProductThumbnailPng(row.productId);
    const color = getProductDisplayColor(row.productId);
    doc.setFillColor(color);
    doc.circle(16, y - 1, 2, "F");
    if (thumb && validatePngDataUrl(thumb)) {
      doc.addImage(thumb, "PNG", 20, y - 6, 8, 8);
    }
    doc.setTextColor(...CHARCOAL);
    const line = `${row.brand} · ${row.productName} · ${row.articleNumber} · ×${row.quantity} · ${row.luminousFluxPerLuminaire} lm · ${row.powerPerLuminaire} W · ${Math.round(row.totalWattage)} W totaal`;
    doc.text(line.slice(0, 115), 30, y);
    y += 9;
    if (y > portraitH - 30) {
      doc.addPage("a4", "portrait");
      y = 20;
    }
  }

  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(...CHARCOAL);
  doc.text(`Totaal armaturen: ${articleList.totalLuminaires}`, 14, y);
  y += 6;
  doc.text(`Totaal vermogen: ${Math.round(articleList.totalInstalledWattage)} W`, 14, y);
  y += 6;
  doc.text(`Unieke producten: ${articleList.uniqueProductCount}`, 14, y);

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
