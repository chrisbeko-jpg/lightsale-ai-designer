import type { EditorDocumentState } from "./types";
import { cloneDocumentState } from "./types";

const MAX_HISTORY = 50;

export interface HistoryStacks {
  past: EditorDocumentState[];
  future: EditorDocumentState[];
}

export function createHistory(): HistoryStacks {
  return { past: [], future: [] };
}

export function pushHistory(
  history: HistoryStacks,
  snapshot: EditorDocumentState,
): HistoryStacks {
  const past = [...history.past, cloneDocumentState(snapshot)];
  if (past.length > MAX_HISTORY) {
    past.shift();
  }
  return { past, future: [] };
}

export function undo(
  history: HistoryStacks,
  current: EditorDocumentState,
): { history: HistoryStacks; document: EditorDocumentState | null } {
  const previous = history.past.at(-1);
  if (!previous) {
    return { history, document: null };
  }
  const past = history.past.slice(0, -1);
  const future = [cloneDocumentState(current), ...history.future];
  return {
    history: { past, future },
    document: cloneDocumentState(previous),
  };
}

export function redo(
  history: HistoryStacks,
  current: EditorDocumentState,
): { history: HistoryStacks; document: EditorDocumentState | null } {
  const next = history.future[0];
  if (!next) {
    return { history, document: null };
  }
  const future = history.future.slice(1);
  const past = [...history.past, cloneDocumentState(current)];
  return {
    history: { past, future },
    document: cloneDocumentState(next),
  };
}

export function canUndo(history: HistoryStacks): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryStacks): boolean {
  return history.future.length > 0;
}
