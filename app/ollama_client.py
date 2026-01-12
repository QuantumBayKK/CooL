import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "mistral:latest"

def chat(prompt: str) -> str:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }

    r = requests.post(OLLAMA_URL, json=payload, timeout=300)
    r.raise_for_status()

    return r.json()["response"]
