🧠 Chat with PDFs — Fullstack Project (Backend-Only, LLM-Ready)

This project provides a robust, scalable backend for a "Chat with PDFs" application. It enables users to upload PDF documents, extract their content, convert it into vector embeddings using a local LLM, and then facilitate conversational querying against that content. Designed with a focus on distributed systems, microservices, and event-driven architecture, this backend is ready for integration into larger AI-augmented systems.

📦 Features
REST API: Secure and efficient RESTful endpoints for PDF uploads and conversational queries.

Object Storage Integration: Seamlessly stores uploaded PDFs in an S3-compatible object storage solution (MinIO for local development, easily adaptable for AWS S3).

Metadata Management: Utilizes PostgreSQL with Prisma ORM for structured storage of project metadata.

Asynchronous Processing: Leverages BullMQ (powered by Redis) for robust background job queuing, ensuring non-blocking PDF processing and optimal API responsiveness.

Vector Embeddings: Generates high-quality vector embeddings from PDF content using a dedicated Python microservice powered by sentence-transformers (all-MiniLM-L6-v2 model), stored efficiently in PostgreSQL via pgvector.

Local LLM Integration: Integrates with Ollama for local, privacy-preserving LLM inference, enabling conversational querying capabilities.

Dockerized Development: Provides a fully containerized development environment with docker-compose, simplifying setup and ensuring consistency across environments.

Admin UI: Includes pgAdmin for easy database inspection and management during development.

🛠️ Tech Stack

API Server

 - Node.js, Express, Prisma, TypeScript

Queue

 - BullMQ (Redis)

Database

 - PostgreSQL, pgvector

Embedding Generator

 - Python + Sentence-Transformers

Local LLM Runtime

 - Ollama

Object Storage

 - S3-compatible (MinIO for local)

Containerization

 - Docker, Docker Compose

Database Admin UI

 - pgAdmin

📁 Project Structure
.
├── docker-compose.yml
├── app/
│   ├── prisma/                  # Prisma schema and migrations
│   ├── src/
│   │   ├── app.ts              # Express server entrypoint
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Core business logic and integrations
│   │   ├── workers/            # BullMQ worker implementations
│   │   └── utils/              # Utility functions (e.g., streaming parser)
│   └── package.json
├── embedding-service/           # Python microservice for embeddings
│   ├── main.py
│   └── requirements.txt
├── uploads/                     # Local MinIO or object storage uploads (for dev)
└── README.md

🗃️ Database Models
The database schema is managed with Prisma ORM, ensuring type-safe interactions and robust migrations.

Project
Represents an uploaded PDF document and its processing status.

model Project {
  id          String        @id @default(uuid())
  title       String
  description String
  status      ProjectStatus @default(CREATING)
  fileUrl     String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  embeddings  Embedding[]
}

enum ProjectStatus {
  CREATING
  CREATED
  FAILED
}

Embedding
Stores the vector embeddings generated from the PDF content, linked to its parent Project.

model Embedding {
  id        String   @id @default(uuid())
  content   String
  vector    Vector   @db.Vector(384) // Stores 384-dimensional vectors from Sentence Transformers
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

🔄 Workflow Summary
This project implements an event-driven design where PDF processing is decoupled from the initial upload request via a message queue, enhancing scalability and resilience.

User Uploads PDF: A user initiates a PDF upload via the REST API endpoint.

API Ingestion: The API server stores project metadata in PostgreSQL and uploads the raw PDF file to MinIO (or AWS S3).

Job Queuing: An asynchronous job is immediately pushed to BullMQ (Redis) for background processing. The API responds with a 202 Accepted to the client.

Worker Processing: A dedicated BullMQ worker polls for new jobs, fetches the project details from the DB, and downloads the PDF from object storage.

Embedding Generation: The worker sends the extracted text content to the Python embedding microservice. This service uses sentence-transformers to generate vector embeddings.

Embedding Storage: The embedding vectors are returned to the worker, which then saves them to PostgreSQL (via pgvector) and updates the project status to CREATED.

Conversational Query: When a user asks a question, the system:

Generates an embedding for the user's question.

Performs a vector similarity search within the PostgreSQL database to retrieve the most relevant content embeddings.

Constructs a prompt with the retrieved context and the user's question.

Sends this enriched prompt to the Ollama LLM for a response.

Streams the LLM's response back to the user, potentially using a TypeScript parser to accumulate chunks into a human-readable format.

🧠 Sequence Diagram
sequenceDiagram
  participant Client
  participant AppServer
  participant MinIO
  participant DB
  participant BullMQ
  participant Worker
  participant EmbeddingService
  participant Ollama

  Client->>AppServer: POST /projects (PDF upload)
  AppServer->>MinIO: Upload file
  AppServer->>DB: Create project record
  AppServer->>BullMQ: Add job to queue
  AppServer-->>Client: Return 202 Accepted

  Worker->>BullMQ: Poll for new job
  Worker->>DB: Fetch project
  Worker->>MinIO: Download file
  Worker->>EmbeddingService: Send file/text for embeddings
  EmbeddingService-->>Worker: Return embedding vectors
  Worker->>DB: Save embeddings, update project status

  Client->>AppServer: POST /projects/:id/chat (Ask question)
  AppServer->>DB: Search via pgvector (for context)
  AppServer->>Ollama: Send context + query
  Ollama-->>AppServer: Stream response
  AppServer-->>Client: Stream readable response

🚀 Setup & Run (Docker)
This project is designed for easy local development using Docker Compose.

Clone the Repository:

git clone https://github.com/yourname/chat-with-pdfs-backend
cd chat-with-pdfs-backend

Start Docker Services:
This command builds and starts all necessary services (Node.js App Server, PostgreSQL, Redis, MinIO, PgAdmin).

docker-compose up --build

Once services are up, you can access them at:

App Server: http://localhost:3000

PgAdmin: http://localhost:5050

MinIO: http://localhost:9001 (Default credentials: minioadmin/minioadmin)

Run Prisma Migrations:
Navigate into the app directory and apply the database migrations. This sets up the Project and Embedding tables.

cd app
npx prisma migrate dev --name init
npx prisma generate
cd .. # Go back to root directory

Install Python Embedding Service Dependencies:
Navigate into the embedding-service directory and install the required Python packages.

cd embedding-service
pip install -r requirements.txt

Run the Python Embedding Service:
Start the microservice that will generate embeddings.

python main.py

Run Ollama:
Ensure Ollama is running locally and you have a model downloaded (e.g., llama3).

ollama run llama3

📬 API Endpoints
1. Upload Project (PDF)
Uploads a PDF file along with its metadata. The processing of the PDF into embeddings happens asynchronously in the background.

Endpoint: POST /api/projects

Content-Type: multipart/form-data

Body:

title: (string) Title of the project/document.

description: (string) Description of the project/document.

file: (file) The PDF file to upload.

Response (202 Accepted):

{
  "id": "uuid-of-new-project",
  "status": "CREATING"
}

2. Get Project Status
Retrieves the current status of a PDF processing project.

Endpoint: GET /api/projects/:id

Response (200 OK):

{
  "id": "uuid-of-project",
  "title": "My Research Paper",
  "description": "A paper on distributed systems.",
  "status": "CREATED", // or "CREATING", "FAILED"
  "fileUrl": "minio-url-to-file",
  "createdAt": "2023-10-27T10:00:00Z",
  "updatedAt": "2023-10-27T10:05:00Z"
}

3. Get Chat Response (Conversational Query)
Submits a question related to a processed PDF and receives a conversational response generated by the LLM based on the document's content.

Endpoint: POST /api/projects/:id/chat

Content-Type: application/json

Body:

{
  "question": "What are the main findings discussed in this document?"
}

Response (200 OK):

{
  "response": "Based on the document, the main findings highlight..." // Streamed response
}

🧪 Testing
Postman/Insomnia: Use tools like Postman or Insomnia to simulate file uploads (POST /api/projects) and test chat requests (POST /api/projects/:id/chat).

Database Inspection: Verify background processing and embedding creation by inspecting the PostgreSQL database via PgAdmin at http://localhost:5050. Check the Project and Embedding tables.

Logs: Monitor the Docker container logs (docker-compose logs -f) for insights into the BullMQ worker, embedding service, and LLM interactions.

✅ To-Do
User Authentication: Implement robust user authentication and authorization mechanisms.

Frontend Development: Build a responsive and intuitive frontend (e.g., using React + TypeScript + Tailwind CSS) to provide a complete user experience.

Streaming Chat UI: Enhance the chat endpoint to provide a real-time streaming experience for LLM responses.

Error Handling & Resilience: Add comprehensive retry mechanisms, timeouts, and advanced error handling for external service calls (embedding service, Ollama, MinIO).

Vector Indexing: Evaluate and implement vector indexes (e.g., HNSW or IVFFlat) in pgvector for improved performance on large datasets.

Observability: Integrate logging, tracing, and metrics for better system monitoring.

📝 License
This project is licensed under the MIT License.