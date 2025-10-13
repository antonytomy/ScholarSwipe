import os
import psycopg
import json
from datetime import datetime
from typing import List, Optional
from datetime import date
from dataclasses import dataclass
from dotenv import load_dotenv

@dataclass
class ScholarshipData:
    external_id: str
    title: str
    description: str
    amount: Optional[float]
    deadline: Optional[date]
    application_url: str
    organization: str
    requirements: str
    categories: str
    source: str

load_dotenv()

class Database:
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.create_table()
    
    def create_table(self):
        try:
            conn = psycopg.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scholarship (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    external_id VARCHAR(255) UNIQUE,
                    title VARCHAR(500) NOT NULL,
                    description TEXT,
                    amount DECIMAL(12,2),
                    deadline DATE,
                    application_url TEXT,
                    organization VARCHAR(255),
                    requirements TEXT,
                    categories TEXT,
                    source VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    is_active BOOLEAN DEFAULT TRUE
                );
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            print("Database table ready")
            
        except Exception as e:
            print(f"Database error: {e}")
            raise
    
    def save_scholarship(self, scholarship: ScholarshipData) -> bool:
        try:
            conn = psycopg.connect(self.database_url)
            cursor = conn.cursor()
            
            # Determine if scholarship is active based on deadline
            is_active = True
            if scholarship.deadline:
                from datetime import date
                is_active = scholarship.deadline >= date.today()
            
            cursor.execute("""
                INSERT INTO scholarship 
                (external_id, title, description, amount, deadline, application_url, 
                 organization, requirements, categories, source, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (external_id) 
                DO UPDATE SET 
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    amount = EXCLUDED.amount,
                    deadline = EXCLUDED.deadline,
                    application_url = EXCLUDED.application_url,
                    organization = EXCLUDED.organization,
                    requirements = EXCLUDED.requirements,
                    categories = EXCLUDED.categories,
                    is_active = EXCLUDED.is_active,
                    updated_at = NOW()
            """, (
                scholarship.external_id,
                scholarship.title,
                scholarship.description,
                scholarship.amount,
                scholarship.deadline,
                scholarship.application_url,
                scholarship.organization,
                scholarship.requirements,
                scholarship.categories,
                scholarship.source,
                is_active
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error saving scholarship: {e}")
            return False
    
    def save_scholarships(self, scholarships: List[ScholarshipData]) -> int:
        success_count = 0
        for scholarship in scholarships:
            if self.save_scholarship(scholarship):
                success_count += 1
        return success_count
    
    def get_scholarships(self, limit: int = 100) -> List[dict]:
        try:
            conn = psycopg.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT title, description, amount, deadline, application_url, 
                       organization, requirements, categories, source
                FROM scholarship 
                WHERE is_active = TRUE 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            scholarships = []
            for row in results:
                scholarships.append({
                    'title': row[0],
                    'description': row[1],
                    'amount': float(row[2]) if row[2] else None,
                    'deadline': row[3].isoformat() if row[3] else None,
                    'application_url': row[4],
                    'organization': row[5],
                    'requirements': json.loads(row[6]) if row[6] else [],
                    'categories': json.loads(row[7]) if row[7] else [],
                    'source': row[8]
                })
            
            return scholarships
            
        except Exception as e:
            print(f"Error fetching scholarships: {e}")
            return []
    
    def get_scholarships_count(self) -> int:
        try:
            conn = psycopg.connect(self.database_url)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM scholarship WHERE is_active = TRUE")
            count = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            return count
            
        except Exception as e:
            print(f"Error getting count: {e}")
            return 0
