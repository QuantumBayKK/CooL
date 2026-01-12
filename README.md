# FounderOS 🧠  
Explainable Multi-Agent AI Cofounder System

FounderOS is a local, explainable, multi-agent AI system designed to simulate
founder-level decision making using multiple personas (e.g. Steve Jobs,
Investor, CTO).

Unlike simple chatbots, FounderOS:
- Scrapes public data
- Builds vector embeddings
- Uses retrieval-augmented reasoning (RAG)
- Runs independent persona agents
- Produces transparent, explainable arguments
- Synthesizes a final decision

All inference runs locally using Ollama.

---

## 🧩 Core Components

### 1. Scraper Engine
Scrapes public sources (e.g. Wikipedia) and stores raw text.

### 2. Embedding Engine
Chunks scraped text and builds a FAISS vector index using sentence embeddings.

### 3. Persona Agents
Each persona:
- Receives the same evidence
- Reasons independently
- Produces structured arguments

### 4. Debate Engine
Runs all personas in parallel and collects their reasoning.

### 5. Synthesizer
Analyzes arguments, trade-offs, and produces a final decision.

---

## 📁 Project Structure

FounderOS/
├── app/
│ ├── scraper.py
│ ├── embedding_engine.py
│ ├── agent.py
│ ├── debate.py
│ ├── synthesizer.py
│ ├── main.py
│ └── init.py
│
├── personas/
│ ├── steve_jobs.txt
│ ├── investor.txt
│ └── cto.txt
│
├── data/
│ └── raw/
│
├── run_founderos.bat
├── requirements.txt
└── README.md

yaml
Copy code

---

## ⚙️ Requirements

- Python 3.10+
- Ollama
- Git
- Internet (for scraping & model download)

---

## 🚀 How It Works (Pipeline)

Scrape → Embed → Retrieve → Debate → Synthesize

yaml
Copy code

---

## 🧪 Example Question

profits or product quality – what should be the prime focus?

yaml
Copy code

FounderOS will:
1. Retrieve relevant evidence
2. Let each persona argue independently
3. Show each agent’s reasoning
4. Produce a final decision

---

## ⚠️ Important Notes

- No chain-of-thought leakage
- All reasoning is explicit and explainable
- Designed for extensibility (more personas, memory, voting, UI)

---

## 📜 License

MIT (recommended)