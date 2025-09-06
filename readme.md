# 🧠 Chat with PDFs — Scalable AI Backend

A RAG based backend for conversational querying of PDF documents using local LLMs and vector search. Upload PDFs, extract content, generate embeddings, and chat with your documents—all powered by containerised microservices.

---

## 🚀 Features

-   **PDF Upload & Storage:** Node.js + Expres.js based REST API for PDF uploads, stored in S3-compatible object storage (MinIO/AWS S3).
-   **Metadata & Vector DB:** Project metadata and vector embeddings stored in PostgreSQL with Prisma ORM and pgvector.
-   **Async Processing:** RabbitMQ for asynchronous, scalable PDF processing.
-   **Embeddings Microservice:** Python based service for generating high-quality vector embeddings via sentence-transformers.
-   **Chatting Microservice:** Python-based service for generating queries' embedding and retrieval of similar stored vector embeddings.
-   **Conversational LLM:** Local Ollama integration for privacy-preserving, context-aware chat responses.
-   **Streaming Responses:** Real-time LLM output streaming for responsive chat using gRPC.
-   **Dockerized Dev:** One-command setup with Docker Compose for all services.
-   **Admin Tools:** PgAdmin UI for easy PostgreSQL management. MinIO UI for inspecting uploaded files. RabbitMQ UI for inspecting queue activities.

---

## 🛠️ Tech Stack

-   **Node.js, Express.js** — API Gateway
-   **RabbitMQ** — Message Broker
-   **PostgreSQL + Prisma + pgvector** — Database & vector search
-   **Python + Sentence-Transformers** — Embedding service
-   **Python + gRPC** — Stream Chat responses
-   **MinIO** — S3-compatible object storage
-   **Docker, Docker Compose** — Containerization
-   **Ollama** — Local LLM runtime

---

## 🗃️ Database Models

See [`app-server-nodejs/prisma/schema.prisma`](app-server-nodejs/prisma/schema.prisma) for full schema.

-   **Project:** PDF metadata and status
-   **File:** Uploaded file info
-   **Embedding:** Text chunk + vector embedding (pgvector)

---

## 🔄 Workflow

1. **User uploads PDF** via REST API.
2. **API stores metadata** in PostgreSQL and uploads PDF to MinIO.
3. **Message queued** in RabbitMQ for asynchronous processing.
4. **Python consumer** picks message from queue, downloads file from storage, extracts text, makes chunks, generates and stores embeddings.
6. TODO

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
