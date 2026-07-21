"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";

export function ProductDragController() {
  const productDrag = useEditorStore((s) => s.productDrag);
  const updateProductDrag = useEditorStore((s) => s.updateProductDrag);
  const endProductDrag = useEditorStore((s) => s.endProductDrag);

  useEffect(() => {
    if (!productDrag) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== productDrag.pointerId) {
        return;
      }
      event.preventDefault();
      updateProductDrag(event.clientX, event.clientY);
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== productDrag.pointerId) {
        return;
      }
      event.preventDefault();
      endProductDrag(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [productDrag, updateProductDrag, endProductDrag]);

  return null;
}

export function PlacementMessageToast() {
  const message = useEditorStore((s) => s.placementMessage);
  const clearPlacementMessage = useEditorStore((s) => s.clearPlacementMessage);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => clearPlacementMessage(), 3500);
    return () => window.clearTimeout(timer);
  }, [message, clearPlacementMessage]);

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="pointer-events-none absolute bottom-4 left-1/2 z-30 max-w-md -translate-x-1/2 rounded-lg border border-red-500/40 bg-[#1a1d21]/95 px-4 py-2 text-center text-xs text-red-200 shadow-lg"
    >
      {message}
    </div>
  );
}
