from app.domain.geometry import (
    metres_per_pixel,
    pixel_distance,
    polygon_area_pixels,
    polygon_area_square_metres,
)


def test_pixel_distance_horizontal() -> None:
    assert pixel_distance(0, 0, 100, 0) == 100


def test_pixel_distance_diagonal() -> None:
    assert pixel_distance(0, 0, 3, 4) == 5


def test_metres_per_pixel() -> None:
    assert metres_per_pixel(0, 0, 100, 0, 5) == 0.05


def test_polygon_area_square() -> None:
    square = [(0, 0), (10, 0), (10, 10), (0, 10)]
    assert polygon_area_pixels(square) == 100


def test_polygon_area_square_metres() -> None:
    square = [(0, 0), (100, 0), (100, 100), (0, 100)]
    area = polygon_area_square_metres(square, 0, 0, 100, 0, 10)
    assert abs(area - 100) < 0.001
