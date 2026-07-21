"use client";



import { useState } from "react";

import {

  buildLayoutProposalPreviewText,

  getEffectiveTargetLux,

  getProductById,

  polygonAreaSquareMetres,

  validateLayoutGeneration,

  validateManualLuminairePlacement,

} from "@lightsale/shared";

import { useEditorStore } from "@/lib/editor/store";

import { fieldClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName, subsectionTitleClassName } from "./editor-form-styles";

import { ProductBrowser } from "./ProductBrowser";

import { LightIndicatorLegend } from "./LightIndicatorLegend";

import { LightingCalculationSummary } from "./LightingCalculationSummary";

import { SelectedLuminairePanel } from "./SelectedLuminairePanel";



export function LightingLayoutTab() {

  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);

  const rooms = useEditorStore((s) => s.rooms);

  const luminaires = useEditorStore((s) => s.luminaires);

  const scale = useEditorStore((s) => s.scale);

  const layoutWallMarginMetres = useEditorStore((s) => s.layoutWallMarginMetres);

  const updateRoomProperties = useEditorStore((s) => s.updateRoomProperties);

  const setLayoutWallMarginMetres = useEditorStore(

    (s) => s.setLayoutWallMarginMetres,

  );

  const generateLightingLayout = useEditorStore((s) => s.generateLightingLayout);

  const regenerateLightingLayout = useEditorStore(

    (s) => s.regenerateLightingLayout,

  );

  const updateOutputSettings = useEditorStore((s) => s.updateOutputSettings);
  const showLightIndicator = useEditorStore((s) => s.outputSettings.showLightIndicator);
  const addLuminaireManually = useEditorStore((s) => s.addLuminaireManually);



  const [layoutMessages, setLayoutMessages] = useState<string[]>([]);



  const room = rooms.find((item) => item.id === selectedRoomId) ?? null;



  if (room === null) {

    return (

      <p className="text-sm text-[var(--muted)]">

        Select a room on the floor plan to configure lighting layout and

        luminaires.

      </p>

    );

  }



  const areaM2 =

    scale !== null ? polygonAreaSquareMetres(room.vertices, scale) : null;

  const selectedProduct =

    room.selectedProductId !== null

      ? getProductById(room.selectedProductId)

      : undefined;



  const roomLuminaires = luminaires.filter((item) => item.roomId === room.id);

  const hasSameProductOnly =

    roomLuminaires.length > 0 &&

    selectedProduct !== undefined &&

    roomLuminaires.every((item) => item.productId === selectedProduct.id);



  const layoutValidation = validateLayoutGeneration({

    scale,

    roomAreaSquareMetres: areaM2,

    room,

    product: selectedProduct,

  });



  const manualValidation = validateManualLuminairePlacement({

    scale,

    room,

    product: selectedProduct,

  });



  const proposalPreview =

    selectedProduct !== undefined

      ? buildLayoutProposalPreviewText({

          quantity: layoutValidation.calculatedQuantity,

          productName: selectedProduct.name,

          targetLux: getEffectiveTargetLux(room),

        })

      : null;



  const patch = (updates: Parameters<typeof updateRoomProperties>[1]) => {

    updateRoomProperties(room.id, updates);

  };



  const runGenerate = () => {

    const warnings = generateLightingLayout(room.id);

    setLayoutMessages(warnings);

  };



  const runReplaceRoomLayout = () => {

    const confirmed = window.confirm(

      `Replace all luminaires in "${room.name}" with a new layout using ${selectedProduct?.name ?? "the selected product"}?`,

    );

    if (!confirmed) {

      return;

    }

    const warnings = regenerateLightingLayout(room.id);

    setLayoutMessages(warnings);

  };



  const canGenerateProposal =

    layoutValidation.canGenerate && !hasSameProductOnly;



  return (

    <div className="space-y-3">

      <ProductBrowser room={room} onPatch={patch} />



      <LightIndicatorLegend
        showToggle
        checked={showLightIndicator}
        onToggle={(value) => updateOutputSettings({ showLightIndicator: value })}
      />



      {selectedProduct ? (

        <LightingCalculationSummary

          room={room}

          luminaires={luminaires}

          areaM2={areaM2}

          selectedProduct={selectedProduct}

        />

      ) : null}



      <div className="space-y-2 rounded border border-[var(--border)] bg-[var(--background)] p-3">

        <h4 className={subsectionTitleClassName}>Placement</h4>



        {proposalPreview ? (

          <p className="text-xs text-[var(--foreground)]">{proposalPreview}</p>

        ) : null}



        <label className={labelClassName}>

          Wall margin (m)

          <input

            type="number"

            min="0"

            step="0.1"

            value={layoutWallMarginMetres}

            onChange={(event) => {

              const value = parseFloat(event.target.value);

              if (Number.isFinite(value) && value >= 0) {

                setLayoutWallMarginMetres(value);

              }

            }}

            className={fieldClassName}

            disabled={!selectedProduct}

          />

        </label>



        {!layoutValidation.canGenerate && layoutValidation.reason ? (

          <p className="text-xs text-[var(--muted)]">{layoutValidation.reason}</p>

        ) : null}



        {hasSameProductOnly ? (

          <p className="text-xs text-[var(--muted)]">

            This room already has luminaires for the selected product. Add another

            product type with Generate, or replace the full room layout below.

          </p>

        ) : null}



        <button

          type="button"

          disabled={!canGenerateProposal}

          onClick={runGenerate}

          className={primaryButtonClassName}

        >

          Generate proposal with selected product

        </button>



        <button

          type="button"

          disabled={!layoutValidation.canGenerate || roomLuminaires.length === 0}

          onClick={runReplaceRoomLayout}

          className={secondaryButtonClassName}

        >

          Replace room layout with selected product

        </button>



        <button

          type="button"

          disabled={!manualValidation.ok}

          onClick={() => addLuminaireManually(room.id)}

          className={secondaryButtonClassName}

        >

          Add luminaire manually

        </button>

        {!manualValidation.ok && manualValidation.reason ? (

          <p className="text-xs text-[var(--muted)]">{manualValidation.reason}</p>

        ) : null}



        {layoutMessages.map((message, index) => (

          <p key={`${message}-${index}`} className="text-xs text-amber-400">

            {message}

          </p>

        ))}

      </div>



      <SelectedLuminairePanel />

    </div>

  );

}


