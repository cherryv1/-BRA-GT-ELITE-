import os, requests, json
from datetime import datetime

def fetch():
    token = os.getenv('APIFY_TOKEN')
    cf_token = os.getenv('CF_API_TOKEN')
    cf_acc = os.getenv('CF_ACCOUNT_ID')
    cf_ns = os.getenv('CF_NAMESPACE_ID')
    
    if not all([token, cf_token, cf_acc, cf_ns]):
        print("✗ Missing secrets")
        return

    try:
        url = f"https://api.apify.com/v2/actors/clockworks~tiktok-scraper/run-sync-get-dataset-items?token={token}"
        r = requests.post(url, json={"profiles": ["baxto.style"], "resultsPerPage": 30}, timeout=120)
        data = r.json()
        
        posts = [{"views": int(i.get("playCount") or 0)} for i in data if isinstance(i, dict)]
        metrics = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "posts_count": len(posts),
            "total_views": sum(p["views"] for p in posts),
            "status": "ok"
        }
        
        headers = {"Authorization": f"Bearer {cf_token}", "Content-Type": "application/json"}
        kv_url = f"https://api.cloudflare.com/client/v4/accounts/{cf_acc}/storage/kv/namespaces/{cf_ns}/values/tiktok:latest"
        requests.put(kv_url, headers=headers, json={"value": json.dumps(metrics)}, timeout=30)
        print(f"✓ Success: {len(posts)} posts, {metrics['total_views']} views")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    fetch()
