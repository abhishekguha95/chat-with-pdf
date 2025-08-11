# Import necessary modules for FastAPI web framework, error handling, data validation, and sentence transformers
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# Initialize FastAPI application instance
app = FastAPI()
# Load pre-trained sentence transformer model for text embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')


# Define request model using Pydantic for input validation
class TextRequest(BaseModel):
    texts: list[str]  # Accept a list of strings to be embedded


# Define POST endpoint to generate embeddings for input texts
@app.post("/embed")
def embed_texts(request: TextRequest):
    try:
        # Convert input texts to numerical embeddings and return as Python list
        embeddings = model.encode(request.texts, convert_to_numpy=True).tolist()
        return {"embeddings": embeddings}
    except Exception as e:
        # Handle any errors during embedding generation and return HTTP 500 error
        raise HTTPException(status_code=500, detail=str(e))
