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
    "8829e24dfffffff": "T. Nagar, Chennai",
    "8831a91dfffffff": "Madhapur, Hyderabad",
    "883148c7fffffff": "Koramangala, Bengaluru",
    "88292e3dfffffff": "Andheri, Mumbai",
    "88316899fffffff": "Ernakulam, Kochi",
    "88395cd7fffffff": "Connaught Place, Delhi",
}

# Lat/Long for zones (approximate centers)
ZONE_COORDINATES = {
    "8829e24dfffffff": (13.0418, 80.2341),
    "8831a91dfffffff": (17.4486, 78.3908),
    "883148c7fffffff": (12.9352, 77.6245),
    "88292e3dfffffff": (19.1197, 72.8464),
    "88316899fffffff": (9.9312, 76.2673),
    "88395cd7fffffff": (28.6315, 77.2167),
}
