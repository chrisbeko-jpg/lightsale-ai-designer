"""Domain calculations mirroring @lightsale/shared (Python-side validation)."""

from math import sqrt


def pixel_distance(ax: float, ay: float, bx: float, by: float) -> float:
    return sqrt((bx - ax) ** 2 + (by - ay) ** 2)


def metres_per_pixel(
    ax: float,
    ay: float,
    bx: float,
    by: float,
    real_distance_metres: float,
) -> float:
    span = pixel_distance(ax, ay, bx, by)
    if span == 0:
        raise ValueError("Calibration points must not be identical")
    return real_distance_metres / span


def polygon_area_pixels(vertices: list[tuple[float, float]]) -> float:
    if len(vertices) < 3:
        return 0.0
    total = 0.0
    n = len(vertices)
    for i in range(n):
        x1, y1 = vertices[i]
        x2, y2 = vertices[(i + 1) % n]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2.0


def polygon_area_square_metres(
    vertices: list[tuple[float, float]],
    ax: float,
    ay: float,
    bx: float,
    by: float,
    real_distance_metres: float,
) -> float:
    area_px = polygon_area_pixels(vertices)
    mpp = metres_per_pixel(ax, ay, bx, by, real_distance_metres)
    return area_px * mpp * mpp
