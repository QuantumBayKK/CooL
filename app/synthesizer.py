from app.ollama_client import chat

def synthesize(arguments, question):
    compiled = "\n\n".join(
        f"{name} REPORT:\n{arg}" for name, arg in arguments.items()
    )

    prompt = f"""
You are the final decision maker.

You are given structured reasoning reports from multiple experts.

Your task:
1. Summarize each position
2. Identify agreements and disagreements
3. Explain trade-offs
4. Make a final decision with justification

Expert Reports:
{compiled}

Question:
{question}

Output structure:
- Summary of Positions
- Key Trade-offs
- Final Decision
- Why this decision was chosen
"""

    return chat(prompt)
