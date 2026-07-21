import {
  DesignLibraryFileSchema,
  DesignLibraryProjectSchema,
  DesignNoteSchema,
} from "@lightsale/shared";
import { getApiBaseUrl } from "./config";

const OWNER_HEADER = "X-Owner-Id";
const DEFAULT_OWNER = "local";

function ownerHeaders(): HeadersInit {
  return { [OWNER_HEADER]: DEFAULT_OWNER };
}

async function parseJson<T>(
  response: Response,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : "Verzoek mislukt";
    throw new Error(message);
  }
  return schema.parse(data);
}

export type DesignLibraryListItem = {
  id: string;
  name: string;
  projectType: string;
  year?: number | null;
  roomCount: number;
  fileCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export async function listDesignLibraryProjects(params?: {
  q?: string;
  projectType?: string;
  status?: string;
}): Promise<DesignLibraryListItem[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.projectType) search.set("projectType", params.projectType);
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects${qs ? `?${qs}` : ""}`,
    { cache: "no-store", headers: ownerHeaders() },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Design Library laden mislukt");
  }
  return data as DesignLibraryListItem[];
}

export async function getDesignLibraryProject(id: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}`,
    { cache: "no-store", headers: ownerHeaders() },
  );
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function createDesignLibraryProject(body: {
  name: string;
  projectType?: string;
  year?: number;
  status?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/design-library/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ownerHeaders() },
    body: JSON.stringify({
      designer: "Lightsale",
      styles: [],
      status: "concept",
      ...body,
    }),
  });
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function updateDesignLibraryProject(
  id: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...ownerHeaders() },
      body: JSON.stringify(body),
    },
  );
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function duplicateDesignLibraryProject(id: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}/duplicate`,
    { method: "POST", headers: ownerHeaders() },
  );
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function deleteDesignLibraryProject(id: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}`,
    { method: "DELETE", headers: ownerHeaders() },
  );
  if (!response.ok) {
    throw new Error("Verwijderen mislukt");
  }
}

export async function restoreDesignLibraryProject(id: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}/restore`,
    { method: "POST", headers: ownerHeaders() },
  );
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function approveDesignLibraryReference(id: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${id}/approve-reference`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...ownerHeaders() },
      body: JSON.stringify({ confirm: true }),
    },
  );
  return parseJson(response, DesignLibraryProjectSchema);
}

export async function uploadDesignLibraryFile(
  projectId: string,
  file: File,
  meta: { category: string; description?: string; isPrimary?: boolean },
) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", meta.category);
  form.append("description", meta.description ?? "");
  form.append("isPrimary", String(meta.isPrimary ?? false));
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/projects/${projectId}/files`,
    { method: "POST", headers: ownerHeaders(), body: form },
  );
  return parseJson(response, DesignLibraryFileSchema);
}

export async function listDesignNotes(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const response = await fetch(
    `${getApiBaseUrl()}/api/design-library/notes${qs}`,
    { cache: "no-store", headers: ownerHeaders() },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Ontwerpnotities laden mislukt");
  }
  return (data as unknown[]).map((item) => DesignNoteSchema.parse(item));
}

export async function createDesignNote(body: {
  title: string;
  ruleText: string;
  category?: string;
  priority?: string;
  status?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/api/design-library/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ownerHeaders() },
    body: JSON.stringify(body),
  });
  return parseJson(response, DesignNoteSchema);
}
