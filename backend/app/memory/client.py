import logging
import urllib.request
from hindsight_client import Hindsight
from app.core.config import settings

logger = logging.getLogger("nexus-sentinel.memory")

class HindsightMemoryClient:
    def __init__(self):
        self.client = None
        self.base_url = settings.HINDSIGHT_BASE_URL
        self.api_key = settings.HINDSIGHT_API_KEY
        self.project_id = settings.HINDSIGHT_PROJECT_ID
        self.initialize_client()

    def initialize_client(self):
        try:
            # Initialize the Hindsight client with configured settings
            # Hindsight client constructor takes base_url, timeout, api_key, etc.
            self.client = Hindsight(
                base_url=self.base_url,
                api_key=self.api_key if self.api_key else None,
                timeout=60.0
            )
            logger.info("Hindsight client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Hindsight client: {str(e)}", exc_info=True)
            self.client = None

    def verify_connection(self) -> bool:
        """
        Verify connection by sending a GET request to Hindsight's /health endpoint.
        """
        try:
            # Construct the health check URL
            # Standard Hindsight API provides a top-level /health endpoint
            url = f"{self.base_url.rstrip('/')}/health"
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as response:
                if response.status == 200:
                    return True
        except Exception as e:
            logger.warning(f"Hindsight connection verification failed: {str(e)}")
        
        return False

# Export a single global client instance
memory_client = HindsightMemoryClient()
