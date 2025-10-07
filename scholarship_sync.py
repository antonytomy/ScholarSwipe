import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
secret_key = os.getenv("SUPABASE_SECRET_KEY")

supabase: Client = create_client(url, secret_key)

# Test connection
result = supabase.table('test').select('*').execute()
print("Connected!")