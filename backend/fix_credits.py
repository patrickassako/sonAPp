#!/usr/bin/env python3
"""Quick script to reset reserved credits for a user."""

from app.supabase_client import SupabaseClient, SUPABASE_URL, SUPABASE_SERVICE_KEY

client = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Your user ID
user_id = "e49a1c9e-b750-4ec1-a37e-b79fd2e2b34c"

# Get current state
profiles = client.select("profiles", filters={"id": user_id}, limit=1)
print(f"Before: {profiles[0]}")

# Reset reserved credits to 0
client.update(
    "profiles",
    {"credits_reserved": 0},
    {"id": user_id}
)

# Check result
profiles = client.select("profiles", filters={"id": user_id}, limit=1)
print(f"After: {profiles[0]}")
print(f"✅ Available credits: {profiles[0]['credits'] - profiles[0]['credits_reserved']}")
