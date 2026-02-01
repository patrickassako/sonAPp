
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.supabase_client import get_supabase_client

def check_job(job_id):
    print(f"Checking job: {job_id}")
    client = get_supabase_client()
    try:
        jobs = client.select("generation_jobs", filters={"id": job_id}, limit=1)
        if not jobs:
            print("Job NOT FOUND")
            return
            
        job = jobs[0]
        print(f"Status: {job.get('status')}")
        print(f"Error: {job.get('error_message')}")
        print(f"Provider Job ID: {job.get('provider_job_id')}")
        print(f"Metadata: {job.get('metadata')}")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    check_job("aef36018-ced5-498d-9d82-866364477bbb")
