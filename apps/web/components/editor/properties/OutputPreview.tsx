"use client";



import { useEffect, useState } from "react";

import {

  buildArticleList,

  calculateProjectLightingSummary,

  extractPdfProjectMetadata,

  INDICATIVE_LUX_DISCLAIMER_NL,

  type Luminaire,

  type OutputSettings,

  type Room,

  type ScaleCalibration,

} from "@lightsale/shared";

import { LightsaleLogo } from "@/components/brand/LightsaleLogo";

import {

  loadImageElement,

  renderPlanToDataUrl,

} from "@/lib/pdf/render-plan-image";

import { ProjectLuxSummary } from "./ProjectLuxSummary";

import { ArticleListPreview } from "./ArticleListPreview";



interface OutputPreviewProps {

  projectName: string;

  outputSettings: OutputSettings;

  rooms: readonly Room[];

  luminaires: readonly Luminaire[];

  scale: ScaleCalibration | null;

  floorPlanUrl: string | null;

  floorPlanSize: { width: number; height: number } | null;

  onClose: () => void;

}



export function OutputPreview({

  projectName,

  outputSettings,

  rooms,

  luminaires,

  scale,

  floorPlanUrl,

  floorPlanSize,

  onClose,

}: OutputPreviewProps) {

  const meta = extractPdfProjectMetadata(outputSettings, projectName);

  const articleList = buildArticleList(luminaires, rooms);

  const summary = calculateProjectLightingSummary({ rooms, luminaires, scale });

  const [planDataUrl, setPlanDataUrl] = useState<string | null>(null);



  useEffect(() => {

    let cancelled = false;

    async function renderPlan() {

      let floorPlanImage: HTMLImageElement | null = null;

      if (floorPlanUrl) {

        try {

          floorPlanImage = await loadImageElement(floorPlanUrl);

        } catch {

          floorPlanImage = null;

        }

      }

      const dataUrl = await renderPlanToDataUrl({

        rooms,

        luminaires,

        scale,

        settings: {

          ...outputSettings,

          includeLightIndicatorInPdf: outputSettings.includeLightIndicatorInPdf,

        },

        floorPlanImage,

        pixelWidth: floorPlanSize?.width ?? floorPlanImage?.naturalWidth ?? 0,

        pixelHeight: floorPlanSize?.height ?? floorPlanImage?.naturalHeight ?? 0,

      }, { heatmap: false });

      if (!cancelled) {

        setPlanDataUrl(dataUrl);

      }

    }

    void renderPlan();

    return () => {

      cancelled = true;

    };

  }, [

    rooms,

    luminaires,

    scale,

    outputSettings,

    floorPlanUrl,

    floorPlanSize,

  ]);



  return (

    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">

      <button

        type="button"

        className="absolute inset-0 bg-black/40"

        aria-label="Close preview"

        onClick={onClose}

      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded border border-[var(--border)] bg-white p-6 shadow-xl">

        <div className="mb-4 flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">

          <div className="flex gap-4">

            <LightsaleLogo className="h-10 w-auto" />

            <div>

              <h2 className="text-lg font-semibold text-[var(--charcoal)]">

                {meta.projectName}

              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">Output preview</p>

            </div>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"

          >

            Close

          </button>

        </div>



        <div className="mb-4 h-1 w-full bg-[var(--accent)]" />



        <section className="mb-6 grid gap-4 text-sm md:grid-cols-2">

          <div className="space-y-1 text-xs">

            {meta.customerName ? (

              <p>

                <span className="text-[var(--muted)]">Klant: </span>

                {meta.customerName}

              </p>

            ) : null}

            {meta.projectAddress ? (

              <p>

                <span className="text-[var(--muted)]">Adres: </span>

                {meta.projectAddress}

              </p>

            ) : null}

            {meta.projectReference ? (

              <p>

                <span className="text-[var(--muted)]">Referentie: </span>

                {meta.projectReference}

              </p>

            ) : null}

            {meta.designerName ? (

              <p>

                <span className="text-[var(--muted)]">Ontwerper: </span>

                {meta.designerName}

              </p>

            ) : null}

            <p>

              <span className="text-[var(--muted)]">Datum: </span>

              {meta.outputDate || new Date().toISOString().slice(0, 10)}

            </p>

          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">

            <dt className="text-[var(--muted)]">Ruimtes</dt>

            <dd className="text-right">{rooms.length}</dd>

            <dt className="text-[var(--muted)]">Armaturen</dt>

            <dd className="text-right">{summary.totalLuminaires}</dd>

            <dt className="text-[var(--muted)]">Vermogen</dt>

            <dd className="text-right">

              {Math.round(summary.totalInstalledWattage)} W

            </dd>

            <dt className="text-[var(--muted)]">Doel gehaald</dt>

            <dd className="text-right">{summary.roomsMeetingTarget}</dd>

          </dl>

        </section>



        <section className="mb-6">

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--charcoal)]">

            Plan preview

          </h3>

          {planDataUrl ? (

            <img

              src={planDataUrl}

              alt="Lighting plan preview"

              className="w-full rounded border border-[var(--border)] bg-[var(--background)]"

            />

          ) : (

            <p className="text-xs text-[var(--muted)]">Rendering plan…</p>

          )}

        </section>



        <section className="mb-6">

          <ProjectLuxSummary

            rooms={rooms}

            luminaires={luminaires}

            scale={scale}

            showLuxSummary={outputSettings.showLuxSummary}

            showComplianceStatus={outputSettings.showComplianceStatus}

          />

        </section>



        <section className="mb-6">

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--charcoal)]">

            Artikellijst

          </h3>

          {articleList.rows.length === 0 ? (

            <p className="text-sm text-[var(--muted)]">No luminaires placed.</p>

          ) : (

            <ArticleListPreview />

          )}

        </section>



        <p className="text-[10px] leading-snug text-[var(--muted)]">

          {INDICATIVE_LUX_DISCLAIMER_NL}

        </p>

      </div>

    </div>

  );

}


