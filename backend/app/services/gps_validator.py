"""
GPS Validation Service — Detects location spoofing and impossible travel.

Uses Haversine distance to validate claim GPS coordinates against zone centers.
Flags GPS spoofing, location mismatches, and impossible travel patterns.
"""
import math
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

logger = logging.getLogger("gps_validator")

# Zone center coordinates (same as config.py)
ZONE_COORDINATES = {
    "8829e24dfffffff": (13.0418, 80.2341),   # T. Nagar, Chennai
    "8831a91dfffffff": (17.4486, 78.3908),   # Madhapur, Hyderabad
    "883148c7fffffff": (12.9352, 77.6245),   # Koramangala, Bengaluru
    "88292e3dfffffff": (19.1197, 72.8464),   # Andheri, Mumbai
    "88316899fffffff": (9.9312, 76.2673),    # Ernakulam, Kochi
    "88395cd7fffffff": (28.6315, 77.2167),   # Connaught Place, Delhi
}

# H3 resolution 8 hexagon has ~0.74 km² area, edge length ~0.46 km
# Reasonable delivery radius is 5-10km from zone center
GPS_THRESHOLDS = {
    "safe": 5.0,       # km — within normal delivery range
    "warning": 10.0,   # km — suspicious but possible
    "spoof": 20.0,     # km — almost certainly spoofed
}

# Maximum speed a delivery rider could reasonably travel
MAX_SPEED_KMH = 80  # bikes/scooters in city traffic


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_zone_center(zone_h3: str) -> Tuple[float, float]:
    """Get lat/lon center for a zone. Falls back to Chennai center."""
    return ZONE_COORDINATES.get(zone_h3, (13.0418, 80.2341))


def validate_gps(
    claim_lat: float,
    claim_lon: float,
    zone_h3: str,
) -> dict:
    """
    Validate GPS coordinates against zone center.
    
    Returns:
        dict with distance_km, status, flags
    """
    center_lat, center_lon = get_zone_center(zone_h3)
    distance = haversine_km(claim_lat, claim_lon, center_lat, center_lon)

    flags = []
    status = "valid"

    if distance > GPS_THRESHOLDS["spoof"]:
        status = "spoofed"
        flags.append("GPS_SPOOFING_DETECTED")
        flags.append(f"DISTANCE_{distance:.1f}KM_FROM_ZONE")
    elif distance > GPS_THRESHOLDS["warning"]:
        status = "suspicious"
        flags.append("GPS_LOCATION_MISMATCH")
        flags.append(f"DISTANCE_{distance:.1f}KM_FROM_ZONE")
    elif distance > GPS_THRESHOLDS["safe"]:
        status = "warning"
        flags.append("GPS_EDGE_OF_ZONE")

    return {
        "distance_km": round(distance, 2),
        "status": status,
        "flags": flags,
        "zone_center": {"lat": center_lat, "lon": center_lon},
        "claim_location": {"lat": claim_lat, "lon": claim_lon},
    }


def check_impossible_travel(
    claim_lat: float,
    claim_lon: float,
    claim_time: datetime,
    previous_lat: float,
    previous_lon: float,
    previous_time: datetime,
) -> dict:
    """
    Detect impossible travel — two claims too far apart in too little time.
    
    Returns:
        dict with is_impossible, distance_km, time_hours, speed_kmh
    """
    distance = haversine_km(claim_lat, claim_lon, previous_lat, previous_lon)
    
    time_diff = abs((claim_time - previous_time).total_seconds())
    time_hours = time_diff / 3600.0

    if time_hours < 0.01:  # Less than 36 seconds
        speed_kmh = float('inf') if distance > 0.1 else 0
    else:
        speed_kmh = distance / time_hours

    is_impossible = speed_kmh > MAX_SPEED_KMH and distance > 2.0

    flags = []
    if is_impossible:
        flags.append("IMPOSSIBLE_TRAVEL_DETECTED")
        flags.append(f"SPEED_{speed_kmh:.0f}KMH_REQUIRED")

    return {
        "is_impossible": is_impossible,
        "distance_km": round(distance, 2),
        "time_hours": round(time_hours, 4),
        "speed_kmh": round(min(speed_kmh, 9999), 1),
        "flags": flags,
    }


def generate_mock_gps(zone_h3: str, spoofed: bool = False) -> dict:
    """
    Generate mock GPS coordinates for simulation/testing.
    If spoofed=True, generates coordinates far from zone center.
    """
    import random
    center_lat, center_lon = get_zone_center(zone_h3)

    if spoofed:
        # Offset 15-30km in random direction
        offset_lat = random.uniform(0.15, 0.30) * random.choice([-1, 1])
        offset_lon = random.uniform(0.15, 0.30) * random.choice([-1, 1])
    else:
        # Normal: within 3km radius
        offset_lat = random.uniform(-0.027, 0.027)  # ~3km
        offset_lon = random.uniform(-0.027, 0.027)

    return {
        "lat": round(center_lat + offset_lat, 6),
        "lon": round(center_lon + offset_lon, 6),
        "is_mock": True,
    }
