"use client";

import {
  filterCompatibleProducts,
  getAllProducts,
  getProductById,
  metresPerPixel,
  pointToMetres,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { fieldClassName, labelClassName, sectionClassName, subsectionTitleClassName } from "./editor-form-styles";

export function SelectedLuminairePanel() {
  const selectedLuminaireId = useEditorStore((s) => s.selectedLuminaireId);
  const luminaires = useEditorStore((s) => s.luminaires);
  const rooms = useEditorStore((s) => s.rooms);
  const scale = useEditorStore((s) => s.scale);
  const updateLuminaire = useEditorStore((s) => s.updateLuminaire);
  const deleteSelectedLuminaire = useEditorStore((s) => s.deleteSelectedLuminaire);
  const duplicateSelectedLuminaire = useEditorStore(
    (s) => s.duplicateSelectedLuminaire,
  );

  const luminaire =
    selectedLuminaireId !== null
      ? luminaires.find((item) => item.id === selectedLuminaireId)
      : undefined;

  if (luminaire === undefined) {
    return null;
  }

  const product = getProductById(luminaire.productId);
  const room = rooms.find((item) => item.id === luminaire.roomId);
  const compatibleProducts =
    room !== undefined
      ? filterCompatibleProducts(getAllProducts(), room)
      : [];

  const positionMetres =
    scale !== null ? pointToMetres({ x: luminaire.x, y: luminaire.y }, scale) : null;

  return (
    <div className={sectionClassName}>
      <h4 className={subsectionTitleClassName}>Selected luminaire</h4>
      <p className="text-xs text-white">
        {product ? `${product.brand} — ${product.name}` : luminaire.productId}
      </p>
      {product?.articleNumber ? (
        <p className="text-[11px] text-[var(--muted)]">{product.articleNumber}</p>
      ) : null}

      <label className={labelClassName}>
        X ({scale !== null ? "m" : "px"})
        <input
          type="number"
          step="0.01"
          value={
            positionMetres !== null
              ? Number(positionMetres.x.toFixed(3))
              : Number(luminaire.x.toFixed(1))
          }
          onChange={(event) => {
            const raw = parseFloat(event.target.value);
            if (!Number.isFinite(raw)) {
              return;
            }
            if (scale !== null) {
              const mpp = metresPerPixel(scale);
              updateLuminaire(luminaire.id, { x: raw / mpp });
            } else {
              updateLuminaire(luminaire.id, { x: raw });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Y ({scale !== null ? "m" : "px"})
        <input
          type="number"
          step="0.01"
          value={
            positionMetres !== null
              ? Number(positionMetres.y.toFixed(3))
              : Number(luminaire.y.toFixed(1))
          }
          onChange={(event) => {
            const raw = parseFloat(event.target.value);
            if (!Number.isFinite(raw)) {
              return;
            }
            if (scale !== null) {
              updateLuminaire(luminaire.id, {
                y: raw / metresPerPixel(scale),
              });
            } else {
              updateLuminaire(luminaire.id, { y: raw });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Rotation (°)
        <input
          type="number"
          step="1"
          value={luminaire.rotationDegrees}
          onChange={(event) => {
            const degrees = parseFloat(event.target.value);
            if (Number.isFinite(degrees)) {
              updateLuminaire(luminaire.id, { rotationDegrees: degrees });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <p className="text-xs text-[var(--muted)]">
        Placement:{" "}
        <span className="text-white">
          {luminaire.placementSource === "generated" ? "Generated" : "Manual"}
        </span>
      </p>

      {compatibleProducts.length > 0 ? (
        <label className={labelClassName}>
          Replace product
          <select
            value={luminaire.productId}
            onChange={(event) => {
              updateLuminaire(luminaire.id, { productId: event.target.value });
            }}
            className={fieldClassName}
          >
            {compatibleProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.brand} — {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => duplicateSelectedLuminaire()}
          className="flex-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-white"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => deleteSelectedLuminaire()}
          className="flex-1 rounded border border-red-500/60 px-2 py-1.5 text-xs text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
