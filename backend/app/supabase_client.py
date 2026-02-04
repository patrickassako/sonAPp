"""
Supabase REST API Client Wrapper.

Provides a simple interface to interact with Supabase tables via REST API.
Uses a singleton pattern to reuse HTTP sessions across requests.
"""

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from typing import Dict, List, Any, Optional
from urllib.parse import quote
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


class SupabaseClient:
    """Wrapper around Supabase REST API."""

    def __init__(self, url: str, key: str):
        self.base_url = f"{url}/rest/v1"
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

        # Create session with retry logic and connection pooling
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PATCH", "DELETE"],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    @staticmethod
    def _encode_filter_value(value: Any) -> str:
        """URL-encode a filter value to prevent injection."""
        return quote(str(value), safe='')

    def select(
        self,
        table: str,
        columns: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Execute SELECT query."""
        url = f"{self.base_url}/{table}?select={columns}"

        if filters:
            for key, value in filters.items():
                url += f"&{key}=eq.{self._encode_filter_value(value)}"

        if order:
            url += f"&order={order}"

        if limit:
            url += f"&limit={limit}"
        if offset:
            url += f"&offset={offset}"

        response = self.session.get(url, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute INSERT query."""
        url = f"{self.base_url}/{table}"
        response = self.session.post(url, json=data, headers=self.headers, timeout=10)
        response.raise_for_status()
        result = response.json()
        return result[0] if isinstance(result, list) else result

    def insert_many(self, table: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute bulk INSERT query."""
        url = f"{self.base_url}/{table}"
        response = self.session.post(url, json=data, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def update(
        self,
        table: str,
        data: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Execute UPDATE query."""
        url = f"{self.base_url}/{table}"

        filter_params = []
        for key, value in filters.items():
            filter_params.append(f"{key}=eq.{self._encode_filter_value(value)}")
        url += "?" + "&".join(filter_params)

        response = self.session.patch(url, json=data, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute DELETE query."""
        url = f"{self.base_url}/{table}"

        filter_params = []
        for key, value in filters.items():
            filter_params.append(f"{key}=eq.{self._encode_filter_value(value)}")
        url += "?" + "&".join(filter_params)

        response = self.session.delete(url, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Call a Supabase stored procedure/function."""
        url = f"{self.base_url}/rpc/{function_name}"
        response = self.session.post(url, json=params or {}, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()


# Singleton instance
_client_instance: Optional[SupabaseClient] = None


def get_supabase_client() -> SupabaseClient:
    """Get or create the singleton Supabase client instance."""
    global _client_instance
    if _client_instance is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        _client_instance = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client_instance
