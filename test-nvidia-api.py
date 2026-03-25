#!/usr/bin/env python3
"""
Test NVIDIA API key connectivity
"""

import os
import requests
import json

# Read API key from .env.local
api_key = None
base_url = None
model = None

try:
    with open('.env.local', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if key == 'OPENAI_API_KEY':
                        api_key = value
                    elif key == 'OPENAI_BASE_URL':
                        base_url = value
                    elif key == 'OPENAI_MODEL':
                        model = value
except Exception as e:
    print(f"❌ Error reading .env.local: {e}")
    exit(1)

print(f"🔍 Checking NVIDIA API configuration...")
print(f"API Key: {api_key[:20]}...{api_key[-5:] if api_key else '(none)'}")
print(f"Base URL: {base_url}")
print(f"Model: {model}")
print()

if not api_key or not base_url:
    print("❌ Missing configuration!")
    exit(1)

# Test request
url = f"{base_url}/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}
data = {
    "model": model,
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hello in Traditional Chinese"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
}

print("🚀 Sending test request to NVIDIA API...")
print()

try:
    response = requests.post(url, headers=headers, json=data, timeout=30)
    print(f"📡 Response status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        print(f"✅ API call SUCCESSFUL!")
        print(f"💬 Response: {content}")
        print()
        print("🎉 NVIDIA API key is working correctly!")
    else:
        print(f"❌ API call failed with status {response.status_code}")
        print(f"Response: {response.text}")

except requests.exceptions.Timeout:
    print("❌ Request timed out after 30 seconds")
except Exception as e:
    print(f"❌ Error: {e}")
