import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "admin-secret-key")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# External APIs
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_BASE_URL = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5")
WAQI_API_KEY = os.getenv("WAQI_API_KEY", "")
WAQI_BASE_URL = os.getenv("WAQI_BASE_URL", "https://api.waqi.info")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "")
TOMTOM_BASE_URL = os.getenv("TOMTOM_BASE_URL", "https://api.tomtom.com/traffic/services/4")

# Payments
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

# Twilio
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://zoink:zoink@localhost:5432/zoinkdb")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/zoink_logs")

# H3 Zone mapping for display names
ZONE_DISPLAY_NAMES = {
    "8829e24dfffffff": "Chennai, Tamil Nadu",
    "8831a91dfffffff": "Hyderabad, Telangana",
    "883148c7fffffff": "Bengaluru, Karnataka",
    "88292e3dfffffff": "Mumbai, Maharashtra",
    "88316899fffffff": "Kochi, Kerala",
    "88395cd7fffffff": "Delhi, NCT",
    "8844b259fffffff": "Pune, Maharashtra",
    "8844f6bbfffffff": "Kolkata, West Bengal",
    "8844f2b1fffffff": "Ahmedabad, Gujarat",
    "8844e135fffffff": "Jaipur, Rajasthan",
    "8844e3cbfffffff": "Surat, Gujarat",
    "8844c219fffffff": "Lucknow, Uttar Pradesh",
    "8844cda7fffffff": "Kanpur, Uttar Pradesh",
    "8844a493fffffff": "Nagpur, Maharashtra",
    "8844f285fffffff": "Indore, Madhya Pradesh",
    "8844d5c9fffffff": "Patna, Bihar",
    "8844d187fffffff": "Bhopal, Madhya Pradesh",
    "8844c833fffffff": "Visakhapatnam, Andhra Pradesh",
    "8844f129fffffff": "Vadodara, Gujarat",
    "8844d32dfffffff": "Ludhiana, Punjab",
    "8844c4b5fffffff": "Agra, Uttar Pradesh",
    "8844e781fffffff": "Nashik, Maharashtra",
    "8844d939fffffff": "Varanasi, Uttar Pradesh",
    "8844b1c3fffffff": "Coimbatore, Tamil Nadu",
}

# Lat/Long for zones (approximate centers)
ZONE_COORDINATES = {
    "8829e24dfffffff": (13.0827, 80.2707),
    "8831a91dfffffff": (17.3850, 78.4867),
    "883148c7fffffff": (12.9716, 77.5946),
    "88292e3dfffffff": (19.0760, 72.8777),
    "88316899fffffff": (9.9312, 76.2673),
    "88395cd7fffffff": (28.7041, 77.1025),
    "8844b259fffffff": (18.5204, 73.8567),
    "8844f6bbfffffff": (22.5726, 88.3639),
    "8844f2b1fffffff": (23.0225, 72.5714),
    "8844e135fffffff": (26.9124, 75.7873),
    "8844e3cbfffffff": (21.1702, 72.8311),
    "8844c219fffffff": (26.8467, 80.9462),
    "8844cda7fffffff": (26.4499, 80.3319),
    "8844a493fffffff": (21.1458, 79.0882),
    "8844f285fffffff": (22.7196, 75.8577),
    "8844d5c9fffffff": (25.5941, 85.1376),
    "8844d187fffffff": (23.2599, 77.4126),
    "8844c833fffffff": (17.6868, 83.2185),
    "8844f129fffffff": (22.3072, 73.1812),
    "8844d32dfffffff": (30.9010, 75.8523),
    "8844c4b5fffffff": (27.1767, 78.0081),
    "8844e781fffffff": (19.9975, 73.7898),
    "8844d939fffffff": (25.3176, 82.9739),
    "8844b1c3fffffff": (11.0168, 76.9558),
}
