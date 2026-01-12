from sentence_transformers import SentenceTransformer
import faiss, pickle
from pathlib import Path

MODEL = SentenceTransformer("all-MiniLM-L6-v2")
INDEX_PATH = Path("app/vector.index")
META_PATH = Path("app/vector_meta.pkl")

def chunk(text, size=400):
    words = text.split()
    for i in range(0, len(words), size):
        yield " ".join(words[i:i+size])

def build_from_files(files):
    chunks = []
    for f in files:
        text = Path(f).read_text(encoding="utf-8")
        chunks.extend(list(chunk(text)))

    embeddings = MODEL.encode(chunks)
    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(embeddings)

    faiss.write_index(index, str(INDEX_PATH))
    pickle.dump(chunks, open(META_PATH, "wb"))

    print(f"Indexed {len(chunks)} chunks.")

def retrieve(query, k=6):
    if not INDEX_PATH.exists() or not META_PATH.exists():
        print("[WARN] No vector index found. Returning empty context.")
        return []

    index = faiss.read_index(str(INDEX_PATH))
    chunks = pickle.load(open(META_PATH, "rb"))

    q_emb = MODEL.encode([query])
    _, ids = index.search(q_emb, k)

    return [chunks[i] for i in ids[0]]
