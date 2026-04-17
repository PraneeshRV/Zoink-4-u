"""
External API Service Layer
Calls OpenWeather, WAQI, TomTom with graceful fallback to mock data.
"""
import httpx
import logging
from app.core.config import (
    OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL,
    WAQI_API_KEY, WAQI_BASE_URL,
    TOMTOM_API_KEY, TOMTOM_BASE_URL,
    ZONE_COORDINATES,
)

logger = logging.getLogger("external_apis")
TIMEOUT = 5.0


def _get_coords(zone_h3: str) -> tuple:
    return ZONE_COORDINATES.get(zone_h3, (13.0418, 80.2341))


async def get_weather(lat: float, lon: float) -> dict:
    """Fetch weather from OpenWeatherMap. Falls back to mock data."""
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key missing — returning mock data")
        return {
            "temp_c": 38, "rainfall_mm_hr": 45, "wind_kmh": 60,
            "condition": "heavy rain", "raw": {}
        }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{OPENWEATHER_BASE_URL}/weather",
                params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
            )
            resp.raise_for_status()
            data = resp.json()
            rain = data.get("rain", {}).get("1h", 0)
            return {
                "temp_c": round(data["main"]["temp"], 1),
                "rainfall_mm_hr": round(rain, 1),
                "wind_kmh": round(data["wind"]["speed"] * 3.6, 1),
                "condition": data["weather"][0]["description"] if data.get("weather") else "clear",
                "raw": data,
            }
    except Exception as e:
        logger.error(f"OpenWeather API error: {e}")
        return {
            "temp_c": 38, "rainfall_mm_hr": 45, "wind_kmh": 60,
            "condition": "heavy rain", "raw": {}
        }


async def get_aqi(lat: float, lon: float) -> dict:
    """Fetch AQI from WAQI. Falls back to mock data."""
    if not WAQI_API_KEY:
        logger.warning("WAQI API key missing — returning mock data")
        return {"aqi": 320, "category": "Very Unhealthy", "dominant_pollutant": "pm25"}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{WAQI_BASE_URL}/feed/geo:{lat};{lon}/",
                params={"token": WAQI_API_KEY}
            )
            resp.raise_for_status()
            data = resp.json()
            aqi_val = data.get("data", {}).get("aqi", 0)
            dominant = data.get("data", {}).get("dominentpol", "pm25")
            if aqi_val <= 50:
                cat = "Good"
            elif aqi_val <= 100:
                cat = "Moderate"
            elif aqi_val <= 150:
                cat = "Unhealthy for Sensitive"
            elif aqi_val <= 200:
                cat = "Unhealthy"
            elif aqi_val <= 300:
                cat = "Very Unhealthy"
            else:
                cat = "Hazardous"
            return {"aqi": aqi_val, "category": cat, "dominant_pollutant": dominant}
    except Exception as e:
        logger.error(f"WAQI API error: {e}")
        return {"aqi": 320, "category": "Very Unhealthy", "dominant_pollutant": "pm25"}


async def get_traffic(lat: float, lon: float) -> dict:
    """Fetch traffic data from TomTom. Falls back to mock data."""
    if not TOMTOM_API_KEY:
        logger.warning("TomTom API key missing — returning mock data")
        return {"freeflow_speed": 40, "current_speed": 8, "congestion_ratio": 5.0}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{TOMTOM_BASE_URL}/flowSegmentData/absolute/10/json",
                params={"point": f"{lat},{lon}", "key": TOMTOM_API_KEY}
            )
            resp.raise_for_status()
            data = resp.json()
            flow = data.get("flowSegmentData", {})
            freeflow = flow.get("freeFlowSpeed", 40)
            current = flow.get("currentSpeed", 8)
            ratio = round(freeflow / max(current, 1), 2)
            return {
                "freeflow_speed": freeflow,
                "current_speed": current,
                "congestion_ratio": ratio,
            }
    except Exception as e:
        logger.error(f"TomTom API error: {e}")
        return {"freeflow_speed": 40, "current_speed": 8, "congestion_ratio": 5.0}


def _weather_severity(weather: dict) -> float:
    """0-10 severity from weather data."""
    score = 0.0
    rain = weather.get("rainfall_mm_hr", 0)
    if rain > 60:
        score = 10
    elif rain > 40:
        score = 8
    elif rain > 20:
        score = 5
    elif rain > 5:
        score = 3
    temp = weather.get("temp_c", 30)
    if temp > 45:
        score = max(score, 9)
    elif temp > 42:
        score = max(score, 6)
    wind = weather.get("wind_kmh", 0)
    if wind > 80:
        score = max(score, 8)
    elif wind > 50:
        score = max(score, 5)
    return min(10.0, score)


def _aqi_severity(aqi_data: dict) -> float:
    """0-10 severity from AQI data."""
    aqi = aqi_data.get("aqi", 0)
    if aqi > 400:
        return 10
    elif aqi > 350:
        return 8
    elif aqi > 300:
        return 7
    elif aqi > 200:
        return 5
    elif aqi > 150:
        return 3
    elif aqi > 100:
        return 2
    return 0


def _traffic_severity(traffic: dict) -> float:
    """0-10 severity from traffic data."""
    ratio = traffic.get("congestion_ratio", 1.0)
    if ratio > 6:
        return 10
    elif ratio > 4:
        return 8
    elif ratio > 3:
        return 6
    elif ratio > 2:
        return 4
    elif ratio > 1.5:
        return 2
    return 0


async def get_risk_conditions(zone_h3: str, city: str) -> dict:
    """Aggregate weather, AQI, traffic into an overall risk assessment."""
    lat, lon = _get_coords(zone_h3)

    weather = await get_weather(lat, lon)
    aqi = await get_aqi(lat, lon)
    traffic = await get_traffic(lat, lon)

    w_sev = _weather_severity(weather)
    a_sev = _aqi_severity(aqi)
    t_sev = _traffic_severity(traffic)

    overall = round(w_sev * 0.4 + a_sev * 0.3 + t_sev * 0.3, 2)

    active_triggers = []
    if weather.get("rainfall_mm_hr", 0) > 40:
        active_triggers.append("T1_HEAVY_RAIN")
    if weather.get("temp_c", 0) > 45:
        active_triggers.append("T4_EXTREME_HEAT")
    if aqi.get("aqi", 0) > 350:
        active_triggers.append("T3_SEVERE_AQI")
    if traffic.get("congestion_ratio", 0) > 4.0:
        active_triggers.append("T9_GRIDLOCK")

    return {
        "weather": weather,
        "aqi": aqi,
        "traffic": traffic,
        "overall_risk_score": overall,
        "active_triggers": active_triggers,
        "zone_h3": zone_h3,
        "city": city,
    }
