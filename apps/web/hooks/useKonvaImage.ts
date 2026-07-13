"use client";

import { useEffect, useState } from "react";

export function useKonvaImage(
  url: string | null,
  mimeType: string | null,
): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    const isPdf = mimeType === "application/pdf";

    if (isPdf) {
      let cancelled = false;

      async function renderPdf() {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const response = await fetch(url as string);
        const buffer = await response.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const img = new window.Image();
        img.src = canvas.toDataURL("image/png");
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("PDF render failed"));
        });
        if (!cancelled) {
          setImage(img);
        }
      }

      renderPdf().catch(() => {
        if (!cancelled) {
          setImage(null);
        }
      });

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        setImage(img);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setImage(null);
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url, mimeType]);

  return image;
}
