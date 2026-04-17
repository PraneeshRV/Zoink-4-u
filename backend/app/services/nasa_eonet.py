import httpx
import random
from typing import List, Dict

# Demo zones from our platform
ZONES = [
    {"label": "T. Nagar, Chennai", "value": "8829e24dfffffff", "city": "Chennai"},
    {"label": "Madhapur, Hyderabad", "value": "8831a91dfffffff", "city": "Hyderabad"},
    {"label": "Koramangala, Bengaluru", "value": "883148c7fffffff", "city": "Bengaluru"},
    {"label": "Andheri, Mumbai", "value": "88292e3dfffffff", "city": "Mumbai"},
    {"label": "Ernakulam, Kochi", "value": "88316899fffffff", "city": "Kochi"},
    {"label": "Connaught Place, Delhi", "value": "88395cd7fffffff", "city": "Delhi"},
]

NASA_EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"

async def fetch_nasa_events(limit: int = 5, map_to_demo_zones: bool = True) -> List[Dict]:
    """
    Fetches real-time events from NASA EONET and maps them to our disruption model.
    If map_to_demo_zones is True, geographically remote events (like US wildfires) 
    are projected onto our Indian hackathon demo zones to simulate live tracking.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{NASA_EONET_URL}?limit={limit}")
            response.raise_for_status()
            data = response.json()
            
            disruptions = []
            
            for event in data.get("events", []):
                # 1. Determine Trigger Type based on NASA category
                categories = [c["id"] for c in event.get("categories", [])]
                event_type = "T1 — Heavy Rainfall (>40mm/hr)" # default fallback
                severity = random.randint(5, 10)
                
                if "severeStorms" in categories:
                    event_type = "T5 — Cyclone Warning"
                    severity = 9
                elif "wildfires" in categories:
                    event_type = "T3 — Severe AQI (>350)"
                    severity = 8
                elif "volcanoes" in categories:
                    event_type = "T7 — Toxic Gas Leak Advisory"
                    severity = 10
                elif "floods" in categories:
                    event_type = "T2 — Flooding / Waterlogging"
                    severity = 8
                    
                # 2. Extrapolate location
                # For Hackathon purposes, we randomly project the NASA event onto 1 of our 6 demo zones
                zone_data = random.choice(ZONES) if map_to_demo_zones else ZONES[0]
                
                coords = None
                if event.get("geometry") and len(event["geometry"]) > 0:
                    coords = event["geometry"][0].get("coordinates")
                    
                disruptions.append({
                    "event_type": event_type,
                    "zone_h3": zone_data["value"],
                    "city": zone_data["city"],
                    "severity": severity,
                    "source_api": f"NASA EONET: {event['title']}",
                    "raw_data": {
                        "nasa_id": event["id"],
                        "nasa_link": event["link"],
                        "original_coordinates": coords
                    },
                    "duration_hours": random.randint(2, 6)
                })
                
            return disruptions
            
    except Exception as e:
        print(f"Error fetching NASA EONET data: {e}")
        return []
