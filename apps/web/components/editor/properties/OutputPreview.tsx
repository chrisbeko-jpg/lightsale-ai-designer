"use client";

import {
  buildArticleList,
  countLuminairesForRoom,
  getProductById,
  type OutputSettings,
  type Room,
} from "@lightsale/shared";
import { roomTypeLabel } from "@/lib/room-property-labels";
import type { Luminaire } from "@lightsale/shared";

interface OutputPreviewProps {
  projectName: string;
  outputSettings: OutputSettings;
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  onClose: () => void;
}

export function OutputPreview({
  projectName,
  outputSettings,
  rooms,
  luminaires,
  onClose,
}: OutputPreviewProps) {
  const articleList = buildArticleList(luminaires, rooms);
  const displayProjectName =
    outputSettings.projectName?.trim() || projectName || "Lighting plan";

  const roomsWithLuminaires = rooms.filter((room) =>
    luminaires.some((item) => item.roomId === room.id),
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Lightsale
            </p>
            <h2 className="text-lg font-medium text-white">{displayProjectName}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Output preview</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--muted)] hover:text-white"
          >
            Close
          </button>
        </div>

        <section className="mb-6 space-y-1 text-sm">
          <h3 className="text-xs font-medium uppercase text-[var(--muted)]">
            Project information
          </h3>
          {outputSettings.customerName ? (
            <p>
              <span className="text-[var(--muted)]">Customer: </span>
              {outputSettings.customerName}
            </p>
          ) : null}
          {outputSettings.projectReference ? (
            <p>
              <span className="text-[var(--muted)]">Reference: </span>
              {outputSettings.projectReference}
            </p>
          ) : null}
          {outputSettings.projectAddress ? (
            <p>
              <span className="text-[var(--muted)]">Address: </span>
              {outputSettings.projectAddress}
            </p>
          ) : null}
          {outputSettings.designerName ? (
            <p>
              <span className="text-[var(--muted)]">Designer: </span>
              {outputSettings.designerName}
            </p>
          ) : null}
          {outputSettings.outputDate ? (
            <p>
              <span className="text-[var(--muted)]">Date: </span>
              {outputSettings.outputDate}
            </p>
          ) : null}
          {outputSettings.notes ? (
            <p className="whitespace-pre-wrap text-[var(--foreground)]">
              {outputSettings.notes}
            </p>
          ) : null}
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase text-[var(--muted)]">
            Drawing options
          </h3>
          <ul className="grid grid-cols-2 gap-1 text-xs text-[var(--foreground)]">
            <li>
              Floor plan background:{" "}
              {outputSettings.showFloorPlanBackground ? "On" : "Off"}
            </li>
            <li>
              Room outlines: {outputSettings.showRoomOutlines ? "On" : "Off"}
            </li>
            <li>Room names: {outputSettings.showRoomNames ? "On" : "Off"}</li>
            <li>
              Luminaire symbols:{" "}
              {outputSettings.showLuminaireSymbols ? "On" : "Off"}
            </li>
            <li>
              Luminaire numbers:{" "}
              {outputSettings.showLuminaireNumbers ? "On" : "Off"}
            </li>
            <li>Scale: {outputSettings.showScale ? "On" : "Off"}</li>
            <li>Legend: {outputSettings.showLegend ? "On" : "Off"}</li>
          </ul>
          <p className="mt-3 rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted)]">
            Floor plan rendering for PDF export will appear here in a future
            release. Save your project and use drawing options when PDF export
            is enabled.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase text-[var(--muted)]">
            Article list
          </h3>
          {articleList.rows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No luminaires placed.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {articleList.rows.map((row) => (
                <li key={row.productId} className="flex justify-between gap-2">
                  <span>
                    {row.brand} — {row.productName} ({row.articleNumber})
                  </span>
                  <span className="shrink-0 text-[var(--muted)]">
                    ×{row.quantity} · {Math.round(row.totalWattage)} W
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-medium uppercase text-[var(--muted)]">
            Room summary
          </h3>
          {roomsWithLuminaires.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No rooms with luminaires.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {roomsWithLuminaires.map((room) => {
                const placed = countLuminairesForRoom(luminaires, room.id);
                const watts = luminaires
                  .filter((item) => item.roomId === room.id)
                  .reduce((sum, item) => {
                    const product = getProductById(item.productId);
                    return sum + (product?.powerWatts ?? 0);
                  }, 0);
                const product =
                  room.selectedProductId !== null
                    ? getProductById(room.selectedProductId)
                    : undefined;
                return (
                  <li
                    key={room.id}
                    className="rounded border border-[var(--border)] p-3 text-xs"
                  >
                    <p className="font-medium text-white">{room.name}</p>
                    <p className="text-[var(--muted)]">
                      {roomTypeLabel(room.roomType)} · Target{" "}
                      {room.targetLux ?? "default"} lx
                    </p>
                    <p className="mt-1 text-[var(--foreground)]">
                      Product:{" "}
                      {product
                        ? `${product.brand} — ${product.name}`
                        : "Not selected"}
                    </p>
                    <p className="text-[var(--foreground)]">
                      Placed: {placed} · {Math.round(watts)} W installed
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-6 text-[10px] text-[var(--muted)]">
          Indicative lighting design. Final lighting performance must be
          validated using photometric calculation data.
        </p>
      </div>
    </div>
  );
}
