import { getProductById } from "./product-catalog.js";
import type { Luminaire, Room } from "./schemas.js";

export interface ArticleListRow {
  positionNumbers: number[];
  productId: string;
  articleNumber: string;
  brand: string;
  productName: string;
  quantity: number;
  luminousFluxPerLuminaire: number;
  powerPerLuminaire: number;
  totalWattage: number;
}

export interface ArticleListResult {
  rows: ArticleListRow[];
  totalLuminaires: number;
  totalInstalledWattage: number;
  uniqueProductCount: number;
  roomsIncludedCount: number;
}

export interface LuminairePositionLabel {
  luminaireId: string;
  positionNumber: number;
}

/** Stable position numbers 1…n (room name, then y, then x). */
export function assignLuminairePositionNumbers(
  luminaires: readonly Luminaire[],
  rooms: readonly Room[],
): LuminairePositionLabel[] {
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const sorted = [...luminaires].sort((a, b) => {
    const roomA = roomById.get(a.roomId)?.name ?? "";
    const roomB = roomById.get(b.roomId)?.name ?? "";
    if (roomA !== roomB) {
      return roomA.localeCompare(roomB);
    }
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
  return sorted.map((item, index) => ({
    luminaireId: item.id,
    positionNumber: index + 1,
  }));
}

export function buildArticleList(
  luminaires: readonly Luminaire[],
  rooms: readonly Room[],
): ArticleListResult {
  if (luminaires.length === 0) {
    return {
      rows: [],
      totalLuminaires: 0,
      totalInstalledWattage: 0,
      uniqueProductCount: 0,
      roomsIncludedCount: 0,
    };
  }

  const positions = assignLuminairePositionNumbers(luminaires, rooms);
  const positionByLuminaireId = new Map(
    positions.map((item) => [item.luminaireId, item.positionNumber]),
  );

  const grouped = new Map<
    string,
    { productId: string; positionNumbers: number[]; quantity: number }
  >();

  for (const luminaire of luminaires) {
    const position = positionByLuminaireId.get(luminaire.id);
    const existing = grouped.get(luminaire.productId);
    if (existing) {
      existing.quantity += 1;
      if (position !== undefined) {
        existing.positionNumbers.push(position);
      }
    } else {
      grouped.set(luminaire.productId, {
        productId: luminaire.productId,
        quantity: 1,
        positionNumbers: position !== undefined ? [position] : [],
      });
    }
  }

  const rows: ArticleListRow[] = [];
  let totalWattage = 0;

  for (const group of grouped.values()) {
    const product = getProductById(group.productId);
    const flux = product?.luminousFluxLumens ?? 0;
    const power = product?.powerWatts ?? 0;
    const rowWattage = group.quantity * power;
    totalWattage += rowWattage;

    rows.push({
      positionNumbers: [...group.positionNumbers].sort((a, b) => a - b),
      productId: group.productId,
      articleNumber: product?.articleNumber ?? "—",
      brand: product?.brand ?? "Unknown",
      productName: product?.name ?? group.productId,
      quantity: group.quantity,
      luminousFluxPerLuminaire: flux,
      powerPerLuminaire: power,
      totalWattage: rowWattage,
    });
  }

  rows.sort((a, b) => {
    const brand = a.brand.localeCompare(b.brand);
    if (brand !== 0) {
      return brand;
    }
    const name = a.productName.localeCompare(b.productName);
    if (name !== 0) {
      return name;
    }
    return a.articleNumber.localeCompare(b.articleNumber);
  });

  const roomIds = new Set(luminaires.map((item) => item.roomId));

  return {
    rows,
    totalLuminaires: luminaires.length,
    totalInstalledWattage: totalWattage,
    uniqueProductCount: grouped.size,
    roomsIncludedCount: roomIds.size,
  };
}

export function formatPositionNumbers(numbers: readonly number[]): string {
  if (numbers.length === 0) {
    return "—";
  }
  if (numbers.length <= 8) {
    return numbers.join(", ");
  }
  return `${numbers.slice(0, 8).join(", ")}…`;
}
