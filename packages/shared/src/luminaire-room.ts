import type { Luminaire, Point, Room } from "./schemas.js";
import { isPointInPolygon } from "./point-in-polygon.js";

export function roomPolygonCentroid(vertices: readonly Point[]): Point {
  if (vertices.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = vertices.reduce(
    (acc, vertex) => ({ x: acc.x + vertex.x, y: acc.y + vertex.y }),
    { x: 0, y: 0 },
  );
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
  };
}

/** Prefer centroid; if outside polygon, use first vertex inside or first vertex. */
export function defaultManualLuminairePosition(room: Room): Point {
  if (room.vertices.length < 3) {
    return { x: 0, y: 0 };
  }
  const centroid = roomPolygonCentroid(room.vertices);
  if (isPointInPolygon(centroid, room.vertices)) {
    return centroid;
  }
  for (const vertex of room.vertices) {
    if (isPointInPolygon(vertex, room.vertices)) {
      return { ...vertex };
    }
  }
  const first = room.vertices[0];
  return first ? { ...first } : { x: 0, y: 0 };
}

export function isLuminaireInsideRoom(
  luminaire: Pick<Luminaire, "x" | "y" | "roomId">,
  room: Room,
): boolean {
  if (luminaire.roomId !== room.id) {
    return false;
  }
  return isPointInPolygon({ x: luminaire.x, y: luminaire.y }, room.vertices);
}

export function countLuminairesOutsideRoom(
  luminaires: readonly Luminaire[],
  room: Room,
): number {
  return luminaires.filter(
    (item) =>
      item.roomId === room.id && !isLuminaireInsideRoom(item, room),
  ).length;
}

export function isRoomGeometryValid(room: Pick<Room, "vertices">): boolean {
  return room.vertices.length >= 3;
}
