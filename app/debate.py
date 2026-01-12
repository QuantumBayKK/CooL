from app.agent import run_agent
from pathlib import Path

PERSONAS = {
    "Steve Jobs": "personas/steve_jobs.txt",
    "Investor": "personas/investor.txt",
    "CTO": "personas/cto.txt",
}

def load_persona(path):
    return Path(path).read_text(encoding="utf-8")

def debate(evidence, question):
    outputs = {}
    for name, path in PERSONAS.items():
        persona = load_persona(path)
        outputs[name] = run_agent(name, persona, evidence, question)
    return outputs
