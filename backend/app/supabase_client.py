"""
Supabase REST API Client Wrapper.

Provides a simple interface to interact with Supabase tables via REST API.
"""

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from typing import Dict, List, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


class SupabaseClient:
    """Wrapper around Supabase REST API."""
    
    def __init__(self, url: str, key: str):
        """Initialize Supabase client.
        
        Args:
            url: Supabase project URL (e.g. https://xxx.supabase.co)
            key: Service role key (has full access)
        """
        self.base_url = f"{url}/rest/v1"
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'  # Return inserted/updated rows
        }
        
        # Create session with retry logic
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,  # Total number of retries
            backoff_factor=1,  # Wait 1, 2, 4 seconds between retries
            status_forcelist=[429, 500, 502, 503, 504],  # HTTP codes to retry
            allowed_methods=["GET", "POST", "PATCH", "DELETE"],  # Methods to retry
            raise_on_status=False  # Don't raise on status, let us handle it
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
    
    def select(
        self, 
        table: str, 
        columns: str = "*",
        filters: Optional[Dict[str, Any]] = None,
        order: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Execute SELECT query.
        
        Args:
            table: Table name
            columns: Comma-separated columns to select (default: "*")
            filters: Dict of column=value filters (e.g. {"id": "123", "status": "active"})
            order: Order by column (e.g. "created_at.desc")
            limit: Max number of rows
            offset: Number of rows to skip
            
        Returns:
            List of rows (dicts)
            
        Example:
            client.select("profiles", filters={"id": user_id}, limit=1)
        """
        url = f"{self.base_url}/{table}?select={columns}"
        
        # Add filters
        if filters:
            for key, value in filters.items():
                url += f"&{key}=eq.{value}"
        
        # Add order
        if order:
            url += f"&order={order}"
        
        # Add limit/offset
        if limit:
            url += f"&limit={limit}"
        if offset:
            url += f"&offset={offset}"
        
        response = self.session.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()
    
    def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute INSERT query.
        
        Args:
            table: Table name
            data: Dict of column=value to insert
            
        Returns:
            Inserted row (dict)
            
        Example:
            client.insert("projects", {"title": "My Project", "user_id": "123"})
        """
        url = f"{self.base_url}/{table}"
        response = self.session.post(url, json=data, headers=self.headers, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result[0] if isinstance(result, list) else result
    
    def insert_many(self, table: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute bulk INSERT query.
        
        Args:
            table: Table name
            data: List of dicts to insert
            
        Returns:
            List of inserted rows
        """
        url = f"{self.base_url}/{table}"
        response = self.session.post(url, json=data, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()
    
    def update(
        self, 
        table: str, 
        data: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Execute UPDATE query.
        
        Args:
            table: Table name
            data: Dict of column=value to update
            filters: Dict of column=value filters (WHERE clause)
            
        Returns:
            Updated rows (list of dicts)
            
        Example:
            client.update("profiles", {"credits": 90}, {"id": user_id})
        """
        url = f"{self.base_url}/{table}"
        
        # Add filters to URL
        filter_params = []
        for key, value in filters.items():
            filter_params.append(f"{key}=eq.{value}")
        url += "?" + "&".join(filter_params)
        
        response = self.session.patch(url, json=data, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()
    
    def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute DELETE query.
        
        Args:
            table: Table name
            filters: Dict of column=value filters (WHERE clause)
            
        Returns:
            Deleted rows (list of dicts)
            
        Example:
            client.delete("projects", {"id": project_id})
        """
        url = f"{self.base_url}/{table}"
        
        # Add filters to URL
        filter_params = []
        for key, value in filters.items():
            filter_params.append(f"{key}=eq.{value}")
        url += "?" + "&".join(filter_params)
        
        response = self.session.delete(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()
    
    def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Call a Supabase stored procedure/function.
        
        Args:
            function_name: Name of the function to call
            params: Function parameters
            
        Returns:
            Function result
        """
        url = f"{self.base_url}/rpc/{function_name}"
        response = self.session.post(url, json=params or {}, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.json()


# Global client instance
def get_supabase_client() -> SupabaseClient:
    """Get configured Supabase client instance."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    return SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
