#!/data/data/com.termux/files/usr/bin/python3
import requests
import json
import schedule
import time
import os
from datetime import datetime

# Cargar .env manualmente
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

APIFY_TOKEN = os.getenv('APIFY_TOKEN', '')
CF_API_TOKEN = os.getenv('CF_API_TOKEN', '')
CF_ACCOUNT_ID = os.getenv('CF_ACCOUNT_ID', '')
CF_NAMESPACE_ID = os.getenv('CF_NAMESPACE_ID', '')
USERNAME = 'baxto.style'

print(f"APIFY_TOKEN loaded: {'Yes' if APIFY_TOKEN else 'No'}")

KV_URL = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_NAMESPACE_ID}/values"

def kv_put(key, value):
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    url = f"{KV_URL}/{key}"
    data = {"value": json.dumps(value)}
    try:
        r = requests.put(url, headers=headers, json=data, timeout=30)
        return r.status_code == 200
    except Exception as e:
        print(f"KV error: {e}")
        return False

def fetch():
    print(f"[{datetime.now()}] TIK-READ: Fetching...")
    
    if not APIFY_TOKEN:
        print("✗ APIFY_TOKEN not set!")
        kv_put("tiktok:status", "error: APIFY_TOKEN missing")
        return
    
    try:
        # Endpoint run-sync-get-dataset-items
        url = f"https://api.apify.com/v2/actors/clockworks~tiktok-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}"
        
        # Input para el actor
        payload = {
            "profiles": ["baxto.style"],
            "resultsPerPage": 30,
            "maxRequestRetries": 3
        }
        
        print(f"Calling Apify run-sync...")
        r = requests.post(url, json=payload, timeout=120)
        data = r.json()
        
        if isinstance(data, dict) and 'error' in data:
            print(f"Apify error: {data['error']}")
            kv_put("tiktok:status", f"apify_error: {json.dumps(data['error'])}")
            return
            
        if not isinstance(data, list):
            print(f"Unexpected format: {type(data)} - {str(data)[:200]}")
            kv_put("tiktok:status", f"format_error: {type(data).__name__}")
            return
        
        print(f"✓ Got {len(data)} items from Apify")
        
        posts = []
        for item in data:
            if not isinstance(item, dict):
                continue
            posts.append({
                "id": item.get("id"),
                "url": item.get("url"),
                "caption": item.get("text", ""),
                "views": item.get("playCount", 0),
                "likes": item.get("diggCount", 0),
                "comments": item.get("commentCount", 0),
                "shares": item.get("shareCount", 0),
                "hashtags": item.get("hashtags", []),
                "music": item.get("musicMeta", {}).get("musicName", "") if item.get("musicMeta") else "",
                "posted": item.get("createTimeISO"),
                "source": "apify"
            })
        
        keywords = ["precio", "cita", "info", "duele", "cover", "costo", "agenda", "cuanto", "reservar"]
        leads = []
        for item in data:
            if not isinstance(item, dict):
                continue
            for comment in item.get("comments", []) or []:
                if not isinstance(comment, dict):
                    continue
                text = comment.get("text", "").lower()
                if any(k in text for k in keywords):
                    leads.append({
                        "post_id": item.get("id"),
                        "comment": text,
                        "author": comment.get("author", ""),
                        "time": comment.get("createTimeISO")
                    })
        
        metrics = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "username": USERNAME,
            "source": "apify",
            "status": "ok",
            "posts": posts,
            "leads": leads,
            "total_views": sum(p["views"] for p in posts),
            "total_likes": sum(p["likes"] for p in posts),
            "total_comments": sum(p["comments"] for p in posts),
            "posts_count": len(posts),
            "leads_count": len(leads)
        }
        
        kv_put("tiktok:latest", metrics)
        kv_put("tiktok:status", "ok")
        kv_put("tiktok:updated", metrics["timestamp"])
        
        print(f"✓ Saved: {len(posts)} posts, {len(leads)} leads, {metrics['total_views']} views")
        
    except Exception as e:
        kv_put("tiktok:status", f"error: {str(e)}")
        print(f"✗ Error: {e}")

schedule.every(6).hours.do(fetch)

fetch()

print("TIK-READ ELITE PRO 2026. Ctrl+C para detener.")
while True:
    schedule.run_pending()
    time.sleep(60)
