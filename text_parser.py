import openai
import json
import re
from datetime import datetime, date
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from database import Database, ScholarshipData

load_dotenv()

class TextScholarshipParser:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.db = Database()
    
    def read_scholarships_file(self, filename: str, limit: int = 100) -> List[str]:
        """Read first N lines from scholarships.txt"""
        with open(filename, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines()[:limit] if line.strip()]
        return lines
    
    def parse_scholarship_line(self, line: str, line_number: int) -> Optional[ScholarshipData]:
        """Use AI to parse a single scholarship line"""
        try:
            prompt = f"""
            Search for information about this scholarship and return JSON:
            
            "{line}"
            
            Use web search to find current, accurate information about this scholarship and return JSON with these fields:
            {{
                "title": "Exact scholarship name",
                "amount": 5000,
                "deadline": "2024-12-31", 
                "description": "Detailed 2-3 sentence description explaining what the scholarship is for, who it's for, and what makes it special",
                "requirements": ["GPA 3.0+", "Undergraduate"],
                "organization": "Organization name",
                "categories": ["merit", "stem"],
                "application_url": "https://actual-scholarship-website.com/apply",
                "is_currently_active": true
            }}
            
            Rules:
            - Search for current information about this specific scholarship
            - If amount is variable or unclear, use null
            - ALWAYS provide a realistic deadline (use dates from 2024-12-31 onwards)
            - Make requirements realistic based on actual scholarship details
            - Categories should be relevant (merit, need-based, stem, minority, etc.)
            - Generate a detailed description based on actual scholarship information
            - Find the REAL application URL for this scholarship
            - Set is_currently_active to true only if the scholarship is currently accepting applications
            - Return only valid JSON, no other text
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            ai_data = json.loads(response.choices[0].message.content)
            
            # Check if scholarship is currently active
            is_currently_active = ai_data.get('is_currently_active', False)
            
            # Only process if scholarship is currently active
            if not is_currently_active:
                print(f"Line {line_number}: Scholarship not currently active, skipping")
                return None
            
            # Parse deadline
            deadline = None
            if ai_data.get('deadline'):
                try:
                    deadline = datetime.strptime(ai_data['deadline'], '%Y-%m-%d').date()
                except:
                    # If deadline parsing fails, set a default future date
                    from datetime import date
                    deadline = date(2024, 12, 31)
            
            return ScholarshipData(
                external_id=f"bigfuture_{line_number}",
                title=ai_data['title'],
                description=ai_data['description'],
                amount=ai_data.get('amount'),
                deadline=deadline,
                application_url=ai_data.get('application_url', 'https://bigfuture.collegeboard.org/scholarships'),
                organization=ai_data['organization'],
                requirements=json.dumps(ai_data.get('requirements', [])),
                categories=json.dumps(ai_data.get('categories', [])),
                source='bigfuture_search'
            )
            
        except Exception as e:
            print(f"Error parsing line {line_number}: {e}")
            return None
    
    def process_scholarships(self, filename: str = 'test_scholarships.txt', limit: int = 10):
        """Process scholarships from text file"""
        print(f"Reading first {limit} lines from {filename}...")
        lines = self.read_scholarships_file(filename, limit)
        
        print(f"Found {len(lines)} scholarship lines to process")
        
        scholarships = []
        for i, line in enumerate(lines):
            print(f"Processing line {i+1}: {line[:50]}...")
            
            scholarship = self.parse_scholarship_line(line, i+1)
            if scholarship:
                scholarships.append(scholarship)
        
        print(f"Successfully parsed {len(scholarships)} scholarships")
        
        # Save to database
        if scholarships:
            print("Saving to database...")
            saved_count = self.db.save_scholarships(scholarships)
            print(f"Saved {saved_count} scholarships to database")
        
        return scholarships

def main():
    """Test the parser with first 100 lines"""
    parser = TextScholarshipParser()
    
    print("Starting scholarship text parsing...")
    scholarships = parser.process_scholarships(limit=100)
    
    print(f"\nCompleted! Processed {len(scholarships)} scholarships")
    
    # Show sample results
    if scholarships:
        print("\nSample scholarships:")
        for i, scholarship in enumerate(scholarships[:3]):
            print(f"\n{i+1}. {scholarship.title}")
            print(f"   Amount: ${scholarship.amount}")
            print(f"   Organization: {scholarship.organization}")
            print(f"   Deadline: {scholarship.deadline}")

if __name__ == "__main__":
    main()
