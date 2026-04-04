"""
External API Service Layer
Calls OpenWeather, WAQI, TomTom with graceful fallback to mock data.
Now parses all 20 granular parameters explicitly.
"""
import httpx
import logging
from datetime import datetime
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
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key missing — returning mock data")
        return {
            "temp_c": 46.5,
            "feels_like_c": 51.0,
            "humidity_percent": 85,
            "wind_kmh": 65,
            "wind_gust_kmh": 85,
            "rainfall_mm_hr": 65.5,
            "visibility_m": 500,
            "cloud_cover_percent": 100,
            "condition": "extreme rain",
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
                "feels_like_c": round(data["main"]["feels_like"], 1),
                "humidity_percent": data["main"]["humidity"],
                "wind_kmh": round(data["wind"]["speed"] * 3.6, 1),
                "wind_gust_kmh": round(data.get("wind", {}).get("gust", data["wind"]["speed"]) * 3.6, 1),
                "rainfall_mm_hr": round(rain, 1),
                "visibility_m": data.get("visibility", 10000),
                "cloud_cover_percent": data.get("clouds", {}).get("all", 0),
                "condition": data["weather"][0]["description"] if data.get("weather") else "clear",
            }
    except Exception as e:
        logger.error(f"OpenWeather API error: {e}")
        return {
            "temp_c": 46.5, "feels_like_c": 51.0, "humidity_percent": 85,
            "wind_kmh": 65, "wind_gust_kmh": 85, "rainfall_mm_hr": 65.5,
            "visibility_m": 500, "cloud_cover_percent": 100, "condition": "extreme weather"
        }

async def get_aqi(lat: float, lon: float) -> dict:
    if not WAQI_API_KEY:
        logger.warning("WAQI API key missing — returning mock data")
        return {
            "aqi": 450,
            "pm25": 380,
            "pm10": 420,
            "no2": 85,
            "dominant_pollutant": "pm25",
            "category": "Hazardous"
        }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{WAQI_BASE_URL}/feed/geo:{lat};{lon}/",
                params={"token": WAQI_API_KEY}
            )
            resp.raise_for_status()
            data = resp.json()
            iaqi = data.get("data", {}).get("iaqi", {})
            aqi_val = data.get("data", {}).get("aqi", 0)
            dominant = data.get("data", {}).get("dominentpol", "pm25")
            
            pm25 = iaqi.get("pm25", {}).get("v", aqi_val * 0.8)
            pm10 = iaqi.get("pm10", {}).get("v", aqi_val * 0.6)
            no2 = iaqi.get("no2", {}).get("v", aqi_val * 0.2)
            
            if aqi_val <= 50: cat = "Good"
            elif aqi_val <= 100: cat = "Moderate"
            elif aqi_val <= 150: cat = "Unhealthy for Sensitive"
            elif aqi_val <= 200: cat = "Unhealthy"
            elif aqi_val <= 300: cat = "Very Unhealthy"
            else: cat = "Hazardous"
            
            return {
                "aqi": aqi_val,
                "pm25": round(pm25, 1),
                "pm10": round(pm10, 1),
                "no2": round(no2, 1),
                "dominant_pollutant": dominant,
                "category": cat
            }
    except Exception as e:
        logger.error(f"WAQI API error: {e}")
        return {"aqi": 450, "pm25": 380, "pm10": 420, "no2": 85, "dominant_pollutant": "pm25", "category": "Hazardous"}

async def get_traffic(lat: float, lon: float) -> dict:
    if not TOMTOM_API_KEY:
        logger.warning("TomTom API key missing — returning mock data")
        return {
            "current_speed_kmh": 5, "freeflow_speed_kmh": 40, "congestion_ratio": 8.0, 
            "traffic_confidence": 1.0, "road_closures": 3
        }
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
            confidence = flow.get("confidence", 1.0)
            ratio = round(freeflow / max(current, 1), 2)
            closures = 2 if ratio > 4.0 else 0
            
            return {
                "current_speed_kmh": current,
                "freeflow_speed_kmh": freeflow,
                "congestion_ratio": ratio,
                "traffic_confidence": confidence,
                "road_closures": closures
            }
    except Exception as e:
        logger.error(f"TomTom API error: {e}")
        return {"current_speed_kmh": 5, "freeflow_speed_kmh": 40, "congestion_ratio": 8.0, "traffic_confidence": 1.0, "road_closures": 3}

def _calculate_srs_from_20_params(params: dict) -> float:
    score = 0.0
    
    # Weather (1-8)
    if params["temp_c"] > 45: score += 1.5
    elif params["temp_c"] > 40: score += 0.8
    if params["feels_like_c"] > 48: score += 1.0
    if params["humidity_percent"] > 90 and params["temp_c"] > 35: score += 0.5
    if params["wind_kmh"] > 60: score += 1.0
    if params["wind_gust_kmh"] > 80: score += 1.0
    if params["rainfall_mm_hr"] > 40: score += 2.0
    elif params["rainfall_mm_hr"] > 20: score += 1.0
    if params["visibility_m"] < 1000: score += 1.5
    if params["cloud_cover_percent"] > 90 and params["rainfall_mm_hr"] > 0: score += 0.2
    
    # AQI (9-12)
    if params["aqi"] > 400: score += 2.0
    elif params["aqi"] > 300: score += 1.0
    if params["pm25"] > 250: score += 0.5
    if params["pm10"] > 300: score += 0.5
    if params["no2"] > 100: score += 0.2
    
    # Traffic (13-17)
    if params["current_speed_kmh"] < 10: score += 1.0
    if params["congestion_ratio"] > 5.0: score += 2.0
    elif params["congestion_ratio"] > 3.0: score += 1.0
    if params["traffic_confidence"] < 0.5: score += 0.2
    if params["road_closures"] > 0: score += params["road_closures"] * 0.5
    
    # Context (18-20)
    hour = params["time_of_day_hour"]
    if hour >= 22 or hour <= 4: score += 1.0
    if params["vehicle_type"] == "bicycle": score += 1.0
    if params["rider_experience_months"] < 3: score += 0.5
    
    return min(10.0, score)

async def get_risk_conditions(zone_h3: str, city: str, time_of_day_hour: int = None, vehicle_type: str = "scooter", rider_experience_months: int = 6) -> dict:
    lat, lon = _get_coords(zone_h3)

    weather = await get_weather(lat, lon)
    aqi = await get_aqi(lat, lon)
    traffic = await get_traffic(lat, lon)
    
    if time_of_day_hour is None:
        time_of_day_hour = datetime.now().hour

    params_20 = {
        "temp_c": weather["temp_c"],
        "feels_like_c": weather["feels_like_c"],
        "humidity_percent": weather["humidity_percent"],
        "wind_kmh": weather["wind_kmh"],
        "wind_gust_kmh": weather["wind_gust_kmh"],
        "rainfall_mm_hr": weather["rainfall_mm_hr"],
        "visibility_m": weather["visibility_m"],
        "cloud_cover_percent": weather["cloud_cover_percent"],
        "aqi": aqi["aqi"],
        "pm25": aqi["pm25"],
        "pm10": aqi["pm10"],
        "no2": aqi["no2"],
        "current_speed_kmh": traffic["current_speed_kmh"],
        "freeflow_speed_kmh": traffic["freeflow_speed_kmh"],
        "congestion_ratio": traffic["congestion_ratio"],
        "traffic_confidence": traffic["traffic_confidence"],
        "road_closures": traffic["road_closures"],
        "time_of_day_hour": time_of_day_hour,
        "vehicle_type": vehicle_type,
        "rider_experience_months": rider_experience_months
    }
    
    srs = _calculate_srs_from_20_params(params_20)

    active_triggers = []
    if weather["rainfall_mm_hr"] > 40: active_triggers.append("T1_HEAVY_RAIN")
    if weather["temp_c"] > 45: active_triggers.append("T4_EXTREME_HEAT")
    if aqi["aqi"] > 350: active_triggers.append("T3_SEVERE_AQI")
    if traffic["congestion_ratio"] > 4.0: active_triggers.append("T9_GRIDLOCK")

    return {
        "raw_weather": weather,
        "raw_aqi": aqi,
        "raw_traffic": traffic,
        "parameters_20": params_20,
        "overall_risk_score": round(srs, 1),
        "active_triggers": active_triggers,
        "zone_h3": zone_h3,
        "city": city,
    }
