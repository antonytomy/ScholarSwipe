import re
from typing import List, Set

def extract_links_from_pdf(pdf_file_path: str) -> List[str]:
    """Extract all HTTP/HTTPS links from a PDF file"""
    links = set()  # Use set to avoid duplicates
    
    try:
        with open(pdf_file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
            
            # Pattern to match /URI (https://...) format
            uri_pattern = r'/URI\s*\(\s*(https?://[^)]+)\s*\)'
            
            # Find all matches
            matches = re.findall(uri_pattern, content, re.IGNORECASE)
            
            for match in matches:
                # Clean up the URL (remove any extra characters)
                url = match.strip()
                if url.startswith(('http://', 'https://')):
                    links.add(url)
            
            print(f"Found {len(matches)} total URI matches")
            
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return []
    
    return list(links)

def save_links_to_file(links: List[str], output_file: str):
    """Save extracted links to a text file"""
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            for link in sorted(links):  # Sort for better organization
                file.write(f"{link}\n")
        
        print(f"Saved {len(links)} unique links to {output_file}")
        
    except Exception as e:
        print(f"Error saving links: {e}")

def main():
    """Extract links from scholarships.pdf and save to scholarships.txt"""
    pdf_file = "scholarships.pdf"
    output_file = "scholarships.txt"
    
    print(f"Extracting links from {pdf_file}...")
    
    # Extract links
    links = extract_links_from_pdf(pdf_file)
    
    if links:
        print(f"Found {len(links)} unique scholarship links:")
        
        # Show first few links as examples
        for i, link in enumerate(links[:5]):
            print(f"  {i+1}. {link}")
        
        if len(links) > 5:
            print(f"  ... and {len(links) - 5} more")
        
        # Save to file
        save_links_to_file(links, output_file)
        
        print(f"\n✅ Successfully extracted {len(links)} scholarship links!")
        print(f"Links saved to: {output_file}")
        
    else:
        print("❌ No links found in the PDF")

if __name__ == '__main__':
    main()
