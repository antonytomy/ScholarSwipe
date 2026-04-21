import os
import re
import math
import pandas as pd
from supabase import create_client, Client

# =========================
# SUPABASE CONFIG
# =========================
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]   # server-side key only

USERS_TABLE = "user_profiles"
SCHOLARSHIPS_TABLE = "Scholarship_trial"
OUTPUT_TABLE = "scholarship_eligibility"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# COLUMN MAPS
# =========================
USER_COLS = {
    "id": "id",
    "name": "full_name",
    "education": "education_level",
    "standing": "academic_year",
    "gpa": "gpa",
    "major": "intended_major",
    "citizenship": "citizenship",
    "income": "income_range",
    "first_gen": "first_generation",
    "state": "location_state",
    "disability": "disabilities",
    "military": "military",
}

SCH_COLS = {
    "url": "source_url",
    "title": "title",
    "grade_level": "grade_level_summary",
    "amount": "amount",
    "citizenship": "citizenship_status",
    "academic": "academic_interest",
    "other_background": "other_background_interest",
    "state_residency": "state_residency",
    "minimum_gpa": "minimum_gpa",
    "uuid": "UUID",
}

# =========================
# HELPERS
# =========================
def fetch_all_rows(table_name: str, page_size: int = 1000) -> pd.DataFrame:
    all_rows = []
    start = 0

    while True:
        end = start + page_size - 1
        response = (
            supabase.table(table_name)
            .select("*")
            .range(start, end)
            .execute()
        )

        rows = response.data or []
        if not rows:
            break

        all_rows.extend(rows)

        if len(rows) < page_size:
            break

        start += page_size

    return pd.DataFrame(all_rows)


def clear_output_table(table_name: str):
    supabase.table(table_name).delete().neq("user_id", "").execute()


def insert_in_batches(table_name: str, rows: list[dict], batch_size: int = 500):
    if not rows:
        return

    total_batches = math.ceil(len(rows) / batch_size)
    for i in range(total_batches):
        batch = rows[i * batch_size:(i + 1) * batch_size]
        supabase.table(table_name).insert(batch).execute()
        print(f"Inserted batch {i + 1}/{total_batches} ({len(batch)} rows)")


def is_nullish(value):
    if pd.isna(value):
        return True
    s = str(value).strip().lower()
    return s in {"", "null", "none", "nan", "n/a"}


def clean_text(value):
    if is_nullish(value):
        return ""
    return re.sub(r"\s+", " ", str(value).strip().lower())


def to_float(value):
    if is_nullish(value):
        return None
    s = str(value).strip().replace("$", "").replace(",", "")
    try:
        return float(s)
    except Exception:
        return None


def normalize_bool(value):
    s = clean_text(value)
    if s in {"true", "1", "yes", "y"}:
        return True
    if s in {"false", "0", "no", "n"}:
        return False
    return None


STATE_MAP = {
    "alabama": "AL", "al": "AL", "alaska": "AK", "ak": "AK",
    "arizona": "AZ", "az": "AZ", "arkansas": "AR", "ar": "AR",
    "california": "CA", "ca": "CA", "colorado": "CO", "co": "CO",
    "connecticut": "CT", "ct": "CT", "delaware": "DE", "de": "DE",
    "florida": "FL", "fl": "FL", "georgia": "GA", "ga": "GA",
    "hawaii": "HI", "hi": "HI", "idaho": "ID", "id": "ID",
    "illinois": "IL", "il": "IL", "indiana": "IN", "in": "IN",
    "iowa": "IA", "ia": "IA", "kansas": "KS", "ks": "KS",
    "kentucky": "KY", "ky": "KY", "louisiana": "LA", "la": "LA",
    "maine": "ME", "me": "ME", "maryland": "MD", "md": "MD",
    "massachusetts": "MA", "ma": "MA", "michigan": "MI", "mi": "MI",
    "minnesota": "MN", "mn": "MN", "mississippi": "MS", "ms": "MS",
    "missouri": "MO", "mo": "MO", "montana": "MT", "mt": "MT",
    "nebraska": "NE", "ne": "NE", "nevada": "NV", "nv": "NV",
    "new hampshire": "NH", "nh": "NH", "new jersey": "NJ", "nj": "NJ",
    "new mexico": "NM", "nm": "NM", "new york": "NY", "ny": "NY",
    "north carolina": "NC", "nc": "NC", "north dakota": "ND", "nd": "ND",
    "ohio": "OH", "oh": "OH", "oklahoma": "OK", "ok": "OK",
    "oregon": "OR", "or": "OR", "pennsylvania": "PA", "pa": "PA",
    "rhode island": "RI", "ri": "RI", "south carolina": "SC", "sc": "SC",
    "south dakota": "SD", "sd": "SD", "tennessee": "TN", "tn": "TN",
    "texas": "TX", "tx": "TX", "utah": "UT", "ut": "UT",
    "vermont": "VT", "vt": "VT", "virginia": "VA", "va": "VA",
    "washington": "WA", "wa": "WA", "west virginia": "WV", "wv": "WV",
    "wisconsin": "WI", "wi": "WI", "wyoming": "WY", "wy": "WY",
    "district of columbia": "DC", "dc": "DC",
}


def normalize_state(value):
    s = clean_text(value).replace(".", "")
    return STATE_MAP.get(s, s.upper() if len(s) == 2 else s)


def extract_states(text):
    t = clean_text(text).replace(".", "")
    if not t:
        return set()
    if "united states" in t or "u.s." in t or "nationwide" in t or "national" in t:
        return set()

    found = set()
    for raw, abbr in STATE_MAP.items():
        if re.search(rf"\b{re.escape(raw)}\b", t):
            found.add(abbr)
    return found


def normalize_user_citizenship(value):
    s = clean_text(value)
    if "us_citizen" in s or "u.s. citizen" in s or "us citizen" in s:
        return "us_citizen"
    if "permanent" in s or "green card" in s:
        return "permanent_resident"
    if "internation" in s or "f1" in s or "visa" in s or "non-us" in s:
        return "international"
    if "other" in s:
        return "other"
    return s


def scholarship_citizenship_allows_user(user_citizenship, scholarship_requirement):
    req = clean_text(scholarship_requirement)
    if not req or not user_citizenship:
        return True

    allowed = set()
    if "u.s. citizen" in req or "us citizen" in req:
        allowed.add("us_citizen")
    if "permanent resident" in req or "green card" in req:
        allowed.add("permanent_resident")
    if "international" in req or "f1" in req or "non-us" in req:
        allowed.add("international")
    if "other" in req:
        allowed.add("other")

    if not allowed:
        return True

    return user_citizenship in allowed


def get_user_education_bucket(user_row):
    education = clean_text(user_row[USER_COLS["education"]])
    standing = clean_text(user_row[USER_COLS["standing"]])

    if "high" in education:
        return "high_school", standing
    if "undergrad" in education or standing in {"freshman", "sophomore", "junior", "senior"}:
        return "undergrad", standing
    if "graduate" in education or standing in {"graduate", "masters", "phd"}:
        return "graduate", standing

    return "", standing


def grade_level_match(user_row, scholarship_grade_text):
    g = clean_text(scholarship_grade_text)

    if not g or "all grade" in g or "all students" in g:
        return True

    user_bucket, user_standing = get_user_education_bucket(user_row)

    if user_bucket == "high_school":
        if not any(k in g for k in ["high school", "high sch"]):
            return False
        years = {"freshman", "sophomore", "junior", "senior"}
        mentioned = [y for y in years if y in g]
        return user_standing in mentioned if mentioned else True

    if user_bucket == "undergrad":
        if not any(k in g for k in ["college", "undergrad", "undergraduate", "university"]):
            return False
        years = {"freshman", "sophomore", "junior", "senior"}
        mentioned = [y for y in years if y in g]
        return user_standing in mentioned if mentioned else True

    if user_bucket == "graduate":
        return any(k in g for k in ["graduate", "grad", "master", "phd", "doctoral"])

    return True


MAJOR_GROUPS = {
    "engineering": ["engineering", "mechanical", "electrical", "civil", "chemical", "biomedical", "industrial", "aerospace"],
    "computer": ["computer", "software", "cyber", "informatics", "information technology", "data science"],
    "business": ["business", "finance", "accounting", "marketing", "management", "economics"],
    "education": ["education", "teacher", "teaching"],
    "psychology": ["psychology", "psych"],
    "biology": ["biology", "biological", "biochem", "biochemistry"],
    "medicine_health": ["medicine", "medical", "health", "nursing", "dentistry", "public health"],
    "architecture": ["architecture"],
    "agriculture": ["agriculture", "agricultural"],
    "foreign_language": ["foreign language", "spanish", "french", "german", "arabic", "linguistics"],
    "literature": ["literature", "english", "writing"],
    "visual_arts": ["visual", "performing", "art", "music", "dance", "theatre", "theater", "film"],
    "law": ["law", "legal", "pre-law", "prelaw"],
}


def canonical_major_groups(text):
    s = clean_text(text)
    matched = set()
    for group, keywords in MAJOR_GROUPS.items():
        if any(k in s for k in keywords):
            matched.add(group)
    return matched


def academic_match(user_major, scholarship_academic):
    sch = clean_text(scholarship_academic)
    usr = clean_text(user_major)

    if not sch or not usr:
        return True
    if any(x in sch for x in ["all majors", "any major", "open to all", "all fields"]):
        return True

    sch_groups = canonical_major_groups(sch)
    usr_groups = canonical_major_groups(usr)

    if not sch_groups or not usr_groups:
        return True

    return len(sch_groups.intersection(usr_groups)) > 0


def gpa_match(user_gpa_value, scholarship_min_gpa_value):
    user_gpa = to_float(user_gpa_value)
    min_gpa = to_float(scholarship_min_gpa_value)

    if min_gpa is None or user_gpa is None:
        return True

    return user_gpa >= min_gpa


def state_match(user_state_value, scholarship_state_value):
    req = clean_text(scholarship_state_value)
    if not req:
        return True

    user_state = normalize_state(user_state_value)
    if not user_state:
        return True

    required_states = extract_states(req)
    if not required_states:
        return True

    return user_state in required_states


def background_match(user_row, scholarship_background):
    bg = clean_text(scholarship_background)
    if not bg:
        return True

    first_gen = normalize_bool(user_row[USER_COLS["first_gen"]])
    military = normalize_bool(user_row[USER_COLS["military"]])
    has_disability = not is_nullish(user_row[USER_COLS["disability"]])
    income = clean_text(user_row[USER_COLS["income"]])

    if "first gen" in bg or "first-generation" in bg:
        if first_gen is False:
            return False

    if any(k in bg for k in ["military", "veteran", "service member"]):
        if military is False:
            return False

    if "disab" in bg:
        if not has_disability:
            return False

    if "low income" in bg:
        if income in {"100k_150k", "over_150k"}:
            return False

    return True


# =========================
# LOAD DATA FROM SUPABASE
# =========================
users = fetch_all_rows(USERS_TABLE)
scholarships = fetch_all_rows(SCHOLARSHIPS_TABLE)

users = users.replace(["NULL", "null", "None", "none", ""], pd.NA)
scholarships = scholarships.replace(["NULL", "null", "None", "none", ""], pd.NA)

eligible_rows = []

for _, user in users.iterrows():
    for _, sch in scholarships.iterrows():
        user_cit = normalize_user_citizenship(user[USER_COLS["citizenship"]])

        is_eligible = (
            scholarship_citizenship_allows_user(user_cit, sch[SCH_COLS["citizenship"]])
            and grade_level_match(user, sch[SCH_COLS["grade_level"]])
            and gpa_match(user[USER_COLS["gpa"]], sch[SCH_COLS["minimum_gpa"]])
            and state_match(user[USER_COLS["state"]], sch[SCH_COLS["state_residency"]])
            and academic_match(user[USER_COLS["major"]], sch[SCH_COLS["academic"]])
            and background_match(user, sch[SCH_COLS["other_background"]])
        )

        if is_eligible:
            eligible_rows.append({
                "user_id": user[USER_COLS["id"]],
                "user_name": user[USER_COLS["name"]],
                "scholarship_uuid": sch[SCH_COLS["uuid"]],
            })

# =========================
# WRITE RESULTS TO SUPABASE
# =========================
clear_output_table(OUTPUT_TABLE)
insert_in_batches(OUTPUT_TABLE, eligible_rows, batch_size=500)

print("Done.")
print(f"Users loaded: {len(users)}")
print(f"Scholarships loaded: {len(scholarships)}")
print(f"Eligible pairs inserted: {len(eligible_rows)}")
print(f"Inserted into Supabase table: {OUTPUT_TABLE}")
print("Output columns: user_id, user_name, scholarship_uuid")