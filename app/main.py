from app.embedding_engine import retrieve
from app.debate import debate
from app.synthesizer import synthesize
from rich.console import Console
from rich.panel import Panel

console = Console()

console.print("[bold cyan]🧠 FounderOS – Explainable Multi-Agent Mode[/bold cyan]")
console.print("Type 'exit' to quit.\n")

while True:
    q = console.input("[bold green]> [/bold green]")
    if q.lower() == "exit":
        break

    evidence = retrieve(q)
    arguments = debate(evidence, q)

    for name, report in arguments.items():
        console.print(Panel(report, title=name))

    final = synthesize(arguments, q)
    console.print(Panel(final, title="Final Decision", style="bold yellow"))
