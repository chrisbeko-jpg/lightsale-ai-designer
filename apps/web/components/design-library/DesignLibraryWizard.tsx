"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  approveDesignLibraryReference,
  createDesignLibraryProject,
  getDesignLibraryProject,
  updateDesignLibraryProject,
  uploadDesignLibraryFile,
} from "@/lib/api/design-library";
import { WIZARD_STEPS } from "@/lib/design-library-labels";
import {
  DESIGN_LIBRARY_PROJECT_TYPES,
  DESIGN_LIBRARY_ROOM_TYPES,
  DESIGN_LIBRARY_STYLE_PRESETS,
  defaultDesignLibraryInterpretation,
  getCatalogProducts,
  type DesignLibraryProject,
} from "@lightsale/shared";
import { fieldClassName, labelClassName } from "@/components/editor/properties/editor-form-styles";

type WizardRoom = DesignLibraryProject["rooms"][number];

function emptyRoom(): WizardRoom {
  return {
    id: crypto.randomUUID(),
    name: "Ruimte 1",
    roomType: "other",
    products: [],
  };
}

export function DesignLibraryWizard({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [id, setId] = useState(projectId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [projectType, setProjectType] = useState("office");
  const [location, setLocation] = useState("");
  const [designer, setDesigner] = useState("Lightsale");
  const [styles, setStyles] = useState<string[]>(["functional"]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("concept");
  const [interpretation, setInterpretation] = useState(
    defaultDesignLibraryInterpretation(),
  );
  const [rooms, setRooms] = useState<WizardRoom[]>([emptyRoom()]);
  const [files, setFiles] = useState<NonNullable<DesignLibraryProject["files"]>>(
    [],
  );
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

  const markDirty = () => setDirty(true);

  const applyProject = useCallback((project: DesignLibraryProject) => {
    setName(project.name);
    setClientName(project.clientName ?? "");
    setProjectNumber(project.projectNumber ?? "");
    setYear(project.year ?? "");
    setProjectType(project.projectType);
    setLocation(project.location ?? "");
    setDesigner(project.designer);
    setStyles(project.styles ?? []);
    setDescription(project.description ?? "");
    setStatus(project.status);
    setInterpretation({ ...defaultDesignLibraryInterpretation(), ...project.interpretation });
    setRooms(project.rooms.length > 0 ? project.rooms : [emptyRoom()]);
    setFiles(project.files ?? []);
    setId(project.id);
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void getDesignLibraryProject(projectId).then(applyProject).catch(() => {
      setMessage("Referentieproject laden mislukt.");
    });
  }, [projectId, applyProject]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const payload = () => ({
    name: name.trim() || "Naamloos referentieproject",
    clientName: clientName || null,
    projectNumber: projectNumber || null,
    year: year === "" ? null : year,
    projectType,
    location: location || null,
    designer,
    styles,
    description: description || null,
    status,
    interpretation,
    rooms,
  });

  const save = async (nextStatus?: string) => {
    setSaving(true);
    setMessage(null);
    try {
      let projectIdLocal = id;
      const body = {
        ...payload(),
        ...(nextStatus ? { status: nextStatus } : {}),
      };
      if (!projectIdLocal) {
        const created = await createDesignLibraryProject({
          name: body.name,
          projectType: body.projectType,
          year: body.year ?? undefined,
        });
        projectIdLocal = created.id;
        setId(created.id);
      }
      const updated = await updateDesignLibraryProject(projectIdLocal, body);
      for (const file of pendingUploads) {
        await uploadDesignLibraryFile(projectIdLocal, file, {
          category: "other",
        });
      }
      setPendingUploads([]);
      applyProject(updated);
      setDirty(false);
      setMessage("Opgeslagen.");
      if (!id) {
        router.replace(`/design-library/${projectIdLocal}`);
      }
      return projectIdLocal;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (style: string) => {
    markDirty();
    setStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style],
    );
  };

  const catalog = getCatalogProducts();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/design-library" className="text-sm text-[var(--muted)] hover:text-white">
          ← Design Library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {id ? "Referentieproject bewerken" : "Nieuw referentieproject"}
        </h1>
      </div>

      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              index === step
                ? "bg-[var(--accent)] text-[#17191c]"
                : "bg-[var(--panel)] text-zinc-400"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {message ? (
        <p className="rounded border border-[var(--border)] bg-[var(--panel)] p-2 text-sm text-zinc-200">
          {message}
        </p>
      ) : null}

      {step === 0 ? (
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <label className={labelClassName}>
            Projectnaam
            <input
              className={fieldClassName}
              value={name}
              onChange={(e) => {
                markDirty();
                setName(e.target.value);
              }}
            />
          </label>
          <label className={labelClassName}>
            Klantnaam
            <input
              className={fieldClassName}
              value={clientName}
              onChange={(e) => {
                markDirty();
                setClientName(e.target.value);
              }}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClassName}>
              Jaar
              <input
                type="number"
                className={fieldClassName}
                value={year}
                onChange={(e) => {
                  markDirty();
                  setYear(Number(e.target.value));
                }}
              />
            </label>
            <label className={labelClassName}>
              Projecttype
              <select
                className={fieldClassName}
                value={projectType}
                onChange={(e) => {
                  markDirty();
                  setProjectType(e.target.value);
                }}
              >
                {DESIGN_LIBRARY_PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClassName}>
            Algemene projectomschrijving
            <textarea
              className={`${fieldClassName} min-h-[80px]`}
              value={description}
              onChange={(e) => {
                markDirty();
                setDescription(e.target.value);
              }}
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs text-[var(--muted)]">Stijl (meerdere)</legend>
            <div className="flex flex-wrap gap-2">
              {DESIGN_LIBRARY_STYLE_PRESETS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`rounded border px-2 py-1 text-xs ${
                    styles.includes(style)
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--border)] text-zinc-400"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="text-sm text-zinc-300">
            Sleep bestanden hierheen of kies bestanden (PDF, PNG, JPG, DOCX, XLSX, CSV, TXT).
          </p>
          <input
            type="file"
            multiple
            className="text-sm text-zinc-300"
            onChange={(e) => {
              markDirty();
              setPendingUploads(Array.from(e.target.files ?? []));
            }}
          />
          <ul className="space-y-2 text-sm">
            {files.map((file) => (
              <li key={file.id} className="rounded border border-[var(--border)] p-2 text-zinc-200">
                {file.fileName} · {(file.sizeBytes / 1024).toFixed(0)} KB
              </li>
            ))}
            {pendingUploads.map((file) => (
              <li key={file.name} className="rounded border border-dashed border-[var(--accent)] p-2 text-zinc-200">
                {file.name} · wacht op upload
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          {rooms.map((room, roomIndex) => (
            <div
              key={room.id}
              className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <label className={labelClassName}>
                Ruimtenaam
                <input
                  className={fieldClassName}
                  value={room.name}
                  onChange={(e) => {
                    markDirty();
                    const next = [...rooms];
                    next[roomIndex] = { ...room, name: e.target.value };
                    setRooms(next);
                  }}
                />
              </label>
              <label className={labelClassName}>
                Ruimtetype
                <select
                  className={fieldClassName}
                  value={room.roomType}
                  onChange={(e) => {
                    markDirty();
                    const next = [...rooms];
                    next[roomIndex] = { ...room, roomType: e.target.value as WizardRoom["roomType"] };
                    setRooms(next);
                  }}
                >
                  {DESIGN_LIBRARY_ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className={labelClassName}>
                  Oppervlakte m²
                  <input
                    type="number"
                    className={fieldClassName}
                    value={room.areaSquareMetres ?? ""}
                    onChange={(e) => {
                      markDirty();
                      const next = [...rooms];
                      next[roomIndex] = {
                        ...room,
                        areaSquareMetres: Number(e.target.value) || undefined,
                      };
                      setRooms(next);
                    }}
                  />
                </label>
                <label className={labelClassName}>
                  Gewenste lux
                  <input
                    type="number"
                    className={fieldClassName}
                    value={room.targetLux ?? ""}
                    onChange={(e) => {
                      markDirty();
                      const next = [...rooms];
                      next[roomIndex] = {
                        ...room,
                        targetLux: Number(e.target.value) || undefined,
                      };
                      setRooms(next);
                    }}
                  />
                </label>
              </div>
              <div>
                <p className="mb-2 text-xs text-[var(--muted)]">Catalogusproducten</p>
                <select
                  className={fieldClassName}
                  onChange={(e) => {
                    const productId = e.target.value;
                    if (!productId) return;
                    markDirty();
                    const next = [...rooms];
                    next[roomIndex] = {
                      ...room,
                      products: [
                        ...room.products,
                        {
                          id: crypto.randomUUID(),
                          catalogProductId: productId,
                          isManualHistorical: false,
                          quantity: 1,
                        },
                      ],
                    };
                    setRooms(next);
                    e.target.value = "";
                  }}
                >
                  <option value="">Product toevoegen…</option>
                  {catalog.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.brand} — {product.name}
                    </option>
                  ))}
                </select>
                <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                  {room.products.map((product) => (
                    <li key={product.id}>
                      {product.isManualHistorical
                        ? `Historisch: ${product.manualName ?? "handmatig"}`
                        : product.catalogProductId}{" "}
                      × {product.quantity}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-xs text-[var(--accent)]"
                  onClick={() => {
                    markDirty();
                    const next = [...rooms];
                    next[roomIndex] = {
                      ...room,
                      products: [
                        ...room.products,
                        {
                          id: crypto.randomUUID(),
                          catalogProductId: null,
                          isManualHistorical: true,
                          manualBrand: "Historisch",
                          manualName: "Niet gekoppeld catalogusproduct",
                          quantity: 1,
                        },
                      ],
                    };
                    setRooms(next);
                  }}
                >
                  + Handmatig historisch product
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="rounded border border-[var(--border)] px-3 py-2 text-sm text-white"
            onClick={() => {
              markDirty();
              setRooms([...rooms, { ...emptyRoom(), name: `Ruimte ${rooms.length + 1}` }]);
            }}
          >
            + Ruimte toevoegen
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <label className={labelClassName}>
            Waarom is dit ontwerp op deze manier opgebouwd?
            <textarea
              className={`${fieldClassName} min-h-[140px]`}
              value={interpretation.mainRationale ?? ""}
              onChange={(e) => {
                markDirty();
                setInterpretation({ ...interpretation, mainRationale: e.target.value });
              }}
            />
          </label>
          <label className={labelClassName}>
            Belangrijkste ontwerpdoel
            <textarea
              className={fieldClassName}
              value={interpretation.designGoal ?? ""}
              onChange={(e) => {
                markDirty();
                setInterpretation({ ...interpretation, designGoal: e.target.value });
              }}
            />
          </label>
          <label className={labelClassName}>
            Wat werkte goed
            <textarea
              className={fieldClassName}
              value={interpretation.workedWell ?? ""}
              onChange={(e) => {
                markDirty();
                setInterpretation({ ...interpretation, workedWell: e.target.value });
              }}
            />
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-zinc-200">
          <p>
            <strong className="text-white">{name || "—"}</strong> · {projectType} · status{" "}
            {status}
          </p>
          <p>
            {rooms.length} ruimtes · {files.length + pendingUploads.length} bestand(en)
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save("concept")}
              className="rounded bg-[var(--panel-elevated)] border border-[var(--border)] px-3 py-2"
            >
              Opslaan als concept
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save("reviewed")}
              className="rounded border border-[var(--accent)] px-3 py-2 text-[var(--accent)]"
            >
              Opslaan en markeren als gecontroleerd
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                const savedId = await save("reviewed");
                if (savedId) {
                  await approveDesignLibraryReference(savedId);
                  setStatus("approved_reference");
                  setMessage("Goedgekeurd als referentie.");
                }
              }}
              className="rounded bg-[var(--accent)] px-3 py-2 text-[#17191c]"
            >
              Goedkeuren als referentie
            </button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded border border-[var(--border)] px-3 py-2 text-sm text-white"
        >
          Vorige
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded border border-[var(--border)] px-3 py-2 text-sm text-[var(--accent)]"
        >
          Concept opslaan
        </button>
        {step < WIZARD_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded bg-[var(--accent)] px-3 py-2 text-sm text-[#17191c]"
          >
            Volgende
          </button>
        ) : null}
      </div>
    </div>
  );
}
