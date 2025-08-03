# 🧠 Chat with PDFs — Scalable AI Backend

A fullstack backend for conversational querying of PDF documents using local LLMs and vector search. Upload PDFs, extract content, generate embeddings, and chat with your documents—all powered by microservices, event-driven architecture, and containerization.

---

## 🚀 Features

-   **PDF Upload & Storage:** Secure REST API for PDF uploads, stored in S3-compatible object storage (MinIO/AWS S3).
-   **Metadata & Vector DB:** Project metadata and vector embeddings managed in PostgreSQL with Prisma ORM and pgvector.
-   **Async Processing:** BullMQ (Redis) queues for non-blocking, scalable PDF processing.
-   **Embeddings Microservice:** Python FastAPI service generates high-quality vector embeddings via sentence-transformers.
-   **Conversational LLM:** Local Ollama integration for privacy-preserving, context-aware chat responses.
-   **Streaming Responses:** Real-time LLM output streaming for responsive chat UX.
-   **Dockerized Dev:** One-command setup with Docker Compose for all services.
-   **Admin Tools:** PgAdmin UI for easy DB inspection.

---

## 🛠️ Tech Stack

-   **Node.js, Express, Prisma** — API server
-   **BullMQ (Redis)** — Job queue
-   **PostgreSQL + pgvector** — Database & vector search
-   **Python + FastAPI + Sentence-Transformers** — Embedding service
-   **Ollama** — Local LLM runtime
-   **MinIO** — S3-compatible object storage
-   **Docker, Docker Compose** — Containerization
-   **PgAdmin** — DB admin UI

---

## 🗃️ Database Models

See [`backend-nodejs/prisma/schema.prisma`](backend-nodejs/prisma/schema.prisma) for full schema.

-   **Project:** PDF metadata and status
-   **File:** Uploaded file info
-   **Embedding:** Text chunk + vector embedding (pgvector)

---

## 🔄 Workflow

1. **User uploads PDF** via REST API.
2. **API stores metadata** in PostgreSQL and uploads PDF to MinIO.
3. **Job queued** in BullMQ for background processing.
4. **Worker extracts text** from PDF, sends to embedding microservice.
5. **Embeddings stored** in PostgreSQL (pgvector).
6. **User asks question:** API generates embedding for query, finds relevant chunks via vector search, sends context to Ollama, streams LLM response.

---

## ⚡ Development Setup

1. **Clone the repository:**

    ```sh
    git clone https://github.com/yourname/chat-with-pdf.git
    cd chat-with-pdf
    ```

2. **Start all services with Docker Compose:**

    ```sh
    docker-compose up --build
    ```

3. **Run database migrations:**
    ```sh
    cd backend-nodejs
    npx prisma migrate dev --name init
    npx prisma generate
    ```

---

📬 API Endpoints
1. Upload PDF
```
POST /projects
Form-data: title, description, file (PDF)
Response: { projectId, status }
```

2. Project Status
```
GET /projects/:id
Response: Project metadata & status
```

3. Chat with PDF
```
POST /projects/:id/chat
Body: { question: "..." }
Response: { response: "..." } (streamed)
```