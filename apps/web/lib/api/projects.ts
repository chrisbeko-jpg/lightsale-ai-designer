import {
  CreateProjectInputSchema,
  ProjectSchema,
  UpdateProjectDocumentInputSchema,
  type CreateProjectInput,
  type Project,
  type UpdateProjectDocumentInput,
} from "@lightsale/shared";
import { getApiBaseUrl } from "./config";

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  hasFloorPlan: boolean;
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
        : "Request failed";
    throw new Error(message);
  }
  return schema.parse(data);
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/projects`, {
    cache: "no-store",
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Failed to load projects");
  }
  if (!Array.isArray(data)) {
    throw new Error("Invalid projects response");
  }
  return data as ProjectListItem[];
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  CreateProjectInputSchema.parse(input);
  const response = await fetch(`${getApiBaseUrl()}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(response, ProjectSchema);
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/projects/${projectId}`,
    { cache: "no-store" },
  );
  return parseJson(response, ProjectSchema);
}

export async function updateProjectDocument(
  projectId: string,
  document: UpdateProjectDocumentInput,
): Promise<Project> {
  UpdateProjectDocumentInputSchema.parse(document);
  const response = await fetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/document`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
  const response = await fetch(
    `${getApiBaseUrl()}/api/projects/${projectId}/floor-plan`,
    { method: "POST", body: formData },
  );
  return parseJson(response, ProjectSchema);
}

export function floorPlanFileUrl(projectId: string): string {
  return `${getApiBaseUrl()}/api/projects/${projectId}/floor-plan/file`;
}
