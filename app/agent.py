from app.ollama_client import chat

def run_agent(name, persona_text, evidence, question):
    prompt = f"""
You are acting as {name}.

{persona_text}

You must produce an explicit reasoning report.
Do NOT reveal hidden chain-of-thought.
Instead, present your reasoning in the following structure.

EVIDENCE (facts you rely on):
- cite relevant points from the evidence

ASSUMPTIONS:
- list assumptions you are making

ARGUMENT:
- your main reasoning and stance

COUNTERPOINTS CONSIDERED:
- what opposing views exist and why you reject them

CONCLUSION:
- your final recommendation

Evidence available:
{chr(10).join(evidence)}

Question:
{question}
"""

    return chat(prompt)
