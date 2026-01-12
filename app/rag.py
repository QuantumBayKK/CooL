import faiss
import os
import pickle
from sentence_transformers import SentenceTransformer

INDEX_PATH = "app/index.faiss"
META_PATH = "app/meta.pkl"

model = SentenceTransformer("all-MiniLM-L6-v2")

def build_index(chunks):
    embeddings = model.encode(chunks)
    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(embeddings)

    with open(META_PATH, "wb") as f:
        pickle.dump(chunks, f)

    faiss.write_index(index, INDEX_PATH)

def retrieve_context(query, k=4):
    if not os.path.exists(INDEX_PATH):
        return ""

    index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, "rb") as f:
        chunks = pickle.load(f)

    q_emb = model.encode([query])
    _, ids = index.search(q_emb, k)

    return "\n".join(chunks[i] for i in ids[0])
