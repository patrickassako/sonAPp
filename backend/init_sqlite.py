"""
Initialize SQLite database with schema.
Adapts PostgreSQL schema for SQLite compatibility.
"""
import sqlite3
import uuid
import os
from pathlib import Path

DB_PATH = "musicapp.db"

def init_db():
    """Initialize SQLite database with adapted schema."""
    
    # Remove existing DB if any
    if os.path.exists(DB_PATH):
        print(f"🗑️  Removing existing {DB_PATH}")
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    print(f"📦 Creating database: {DB_PATH}")
    
    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")
    
    # Profiles table (simplified from schema.sql)
    cur.execute("""
        CREATE TABLE profiles (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            credits INTEGER DEFAULT 0,
            credits_reserved INTEGER DEFAULT 0,
            total_credits_spent INTEGER DEFAULT 0,
            total_spent_money REAL DEFAULT 0.0
        );
    """)
    print("✅ Table 'profiles' created")
    
    # Projects table
    cur.execute("""
        CREATE TABLE projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            mode TEXT NOT NULL CHECK(mode IN ('TEXT', 'CONTEXT')),
            language TEXT NOT NULL CHECK(language IN ('fr', 'en')),
            style_id TEXT NOT NULL,
            lyrics_final TEXT,
            context_input TEXT,
            context_analysis TEXT,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'generating', 'completed', 'failed')),
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
    """)
    print("✅ Table 'projects' created")
    
    # Generation jobs table
    cur.execute("""
        CREATE TABLE generation_jobs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            status TEXT DEFAULT 'queued' CHECK(status IN ('queued', 'processing', 'completed', 'failed')),
            provider_job_id TEXT,
            credits_cost INTEGER DEFAULT 10,
            job_metadata TEXT,
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
    """)
    print("✅ Table 'generation_jobs' created")
    
    # Audio files table
    cur.execute("""
        CREATE TABLE audio_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            job_id TEXT,
            file_path TEXT,
            file_url TEXT NOT NULL,
            stream_url TEXT,
            image_url TEXT,
            duration_seconds REAL,
            version_number INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE SET NULL
        );
    """)
    print("✅ Table 'audio_files' created")
    
    # Transactions table
    cur.execute("""
        CREATE TABLE transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            project_id TEXT,
            job_id TEXT,
            type TEXT NOT NULL CHECK(type IN ('reserve', 'debit', 'refund', 'purchase')),
            amount INTEGER NOT NULL,
            price REAL,
            payment_provider TEXT,
            payment_id TEXT,
            status TEXT DEFAULT 'pending',
            transaction_metadata TEXT,
            balance_after INTEGER NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
            FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE SET NULL
        );
    """)
    print("✅ Table 'transactions' created")
    
    # Create test user with credits
    user_id = "e49a1c9e-b750-4ec1-a37e-b79fd2e2b34c"  # UUID from JWT token
    cur.execute("""
        INSERT INTO profiles (id, email, credits, credits_reserved, total_credits_spent, total_spent_money)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, "patrick@gmail.com", 100, 0, 0, 0.0))
    print(f"✅ Test user created: patrick@gmail.com (100 credits)")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Database initialized successfully!")
    print(f"📍 Location: {Path(DB_PATH).absolute()}")
    print(f"\n💡 Update your .env:")
    print(f"DATABASE_URL=sqlite:///./{DB_PATH}")

if __name__ == "__main__":
    init_db()
