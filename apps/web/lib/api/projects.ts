import {
  CreateProjectInputSchema,
  ProjectSchema,
  UpdateProjectDocumentInputSchema,
  type CreateProjectInput,
  type Project,
  type UpdateProjectDocumentInput,
} from "@lightsale/shared";
import { getApiBaseUrl } from "./config";

const OWNER_HEADER = "X-Owner-Id";
const DEFAULT_OWNER = "local";

function ownerHeaders(): HeadersInit {
  return { [OWNER_HEADER]: DEFAULT_OWNER };
}

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  hasFloorPlan: boolean;
  customerName?: string;
  roomCount?: number;
  luminaireCount?: number;
}

export interface ProjectTrashStats {
  activeProjectCount: number;
  trashProjectCount: number;
  totalUploadedBytes: number | null;
}

async function parseJson<T>(
  response: Response,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Invalid response from API (${response.status}). Check NEXT_PUBLIC_API_URL and backend availability.`,
    );
  }
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : "Request failed";
    throw new Error(message);
  }
  return schema.parse(data);
}

async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    const base = getApiBaseUrl();
    const hint =
      error instanceof TypeError
        ? `Network error calling ${base}. Check API URL, CORS, and that the backend is running.`
        : "Network request failed";
    throw new Error(hint, { cause: error });
  }
}

export async function listProjects(trash = false): Promise<ProjectListItem[]> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects?trash=${trash ? "true" : "false"}`,
    { cache: "no-store", headers: ownerHeaders() },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Failed to load projects");
  }
  if (!Array.isArray(data)) {
    throw new Error("Invalid projects response");
  }
  return data as ProjectListItem[];
}

export async function fetchProjectTrashStats(): Promise<ProjectTrashStats> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/projects/stats/trash`, {
    cache: "no-store",
    headers: ownerHeaders(),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Failed to load project stats");
  }
  return data as ProjectTrashStats;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  CreateProjectInputSchema.parse(input);
  const response = await apiFetch(`${getApiBaseUrl()}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ownerHeaders() },
    body: JSON.stringify(input),
  });
  return parseJson(response, ProjectSchema);
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}`,
    { cache: "no-store", headers: ownerHeaders() },
  );
  return parseJson(response, ProjectSchema);
}

export async function renameProject(
  projectId: string,
  name: string,
): Promise<Project> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...ownerHeaders() },
    body: JSON.stringify({ name }),
  });
  return parseJson(response, ProjectSchema);
}

export async function duplicateProject(projectId: string): Promise<Project> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/duplicate`,
    { method: "POST", headers: ownerHeaders() },
  );
  return parseJson(response, ProjectSchema);
}

export async function trashProject(projectId: string): Promise<ProjectListItem> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/trash`,
    { method: "POST", headers: ownerHeaders() },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Failed to delete project");
  }
  return data as ProjectListItem;
}

export async function restoreProject(projectId: string): Promise<ProjectListItem> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/restore`,
    { method: "POST", headers: ownerHeaders() },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Failed to restore project");
  }
  return data as ProjectListItem;
}

export async function permanentlyDeleteProject(projectId: string): Promise<void> {
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/permanent`,
    { method: "DELETE", headers: ownerHeaders() },
  );
  if (!response.ok) {
    throw new Error("Failed to permanently delete project");
  }
}

export async function updateProjectDocument(
  projectId: string,
  document: UpdateProjectDocumentInput,
): Promise<Project> {
  UpdateProjectDocumentInputSchema.parse(document);
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/document`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...ownerHeaders() },
      body: JSON.stringify(document),
    },
  );
  return parseJson(response, ProjectSchema);
}

export async function uploadFloorPlan(
  projectId: string,
  file: File,
): Promise<Project> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/floor-plan`,
    { method: "POST", body: formData, headers: ownerHeaders() },
  );
  return parseJson(response, ProjectSchema);
}

export function floorPlanFileUrl(projectId: string): string {
  return `${getApiBaseUrl()}/api/projects/${projectId}/floor-plan/file`;
}
