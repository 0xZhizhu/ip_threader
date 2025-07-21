import json
import time
import os

# In a real app, this would scan the web. For our POC, it just simulates a finding.
def scan_for_ip(token_id):
    print(f"Scanning for derivatives of Token ID: {token_id}...")
    # Simulate finding a match for token ID 2 (your second minted token)
    if token_id == 2: # <--- CHANGED TO TARGET TOKEN ID 2
        print("Match found!")
        return True
    return False

def update_status_file(token_id, match_found):
    status = {"tokenId": token_id, "matchFound": match_found, "lastScanned": int(time.time())}
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'status.json')
    
    with open(output_path, 'w') as f:
        json.dump(status, f, indent=2) 
    print(f"status.json updated at: {output_path}")

if __name__ == "__main__":
    # We will simulate scanning for Token ID 2 for the demo
    token_to_scan = 2 # <--- CHANGED TO TARGET TOKEN ID 2
    found = scan_for_ip(token_to_scan)
    update_status_file(token_to_scan, found)