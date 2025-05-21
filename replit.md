# AMCP - AI-powered Document Analysis Platform

## Overview

AMCP (AI-powered Document Analysis Platform) is a full-stack web application designed for document management, OCR processing, and AI-powered analysis. The application allows users to upload documents, process them using OCR technology, analyze content with OpenAI GPT-4o, and search documents using both keyword and semantic search capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture:

1. **Frontend**: React-based SPA using Vite as the build tool
2. **Backend**: Express.js server in TypeScript
3. **Database**: PostgreSQL with Drizzle ORM for schema management
4. **Authentication**: Simple username/password authentication mechanism
5. **External Services**: Integration with OpenAI, Google Drive, and Telegram Bot API

The system is built with a clear separation between client and server code, with shared types for consistent data handling. The application leverages modern TypeScript features for type safety throughout the codebase.

## Key Components

### Frontend

1. **UI Framework**: The application uses a component library built with Radix UI and styled using Tailwind CSS. The design system follows the shadcn/ui pattern for consistent styling across components.

2. **State Management**: React Query is used for server state management, handling data fetching, caching, and synchronization with the server.

3. **Routing**: The application uses Wouter for lightweight client-side routing.

4. **Components Structure**:
   - `/components/ui`: Reusable UI components
   - `/components/layout`: Layout components like AppLayout, Sidebar, and Navbar
   - `/components/documents`: Document-specific components
   - `/components/ocr`: OCR-related components

5. **Pages**:
   - Dashboard: Overview of document statistics and recent activities
   - Documents: Document management and upload
   - Search: Keyword and semantic search functionality
   - Analysis: AI analysis of documents
   - OCR: OCR processing interface
   - Settings: External service connections and configuration

### Backend

1. **API Server**: Express.js RESTful API endpoints for document management, OCR processing, and AI analysis.

2. **Storage Service**: A data access layer that handles database operations through Drizzle ORM.

3. **External Service Integrations**:
   - `openaiService`: Integration with OpenAI for text analysis and embeddings
   - `ocrService`: Tesseract.js-based OCR processing
   - `gdriveService`: Google Drive integration for document storage/retrieval
   - `telegramService`: Telegram Bot API for notifications

4. **Database Schema**: PostgreSQL database with the following tables:
   - `users`: User authentication and profile data
   - `documents`: Document metadata and content
   - `analyses`: AI analysis results
   - `activities`: User activity logs

### Shared Components

1. **Types**: Shared TypeScript interfaces for consistent data structures between frontend and backend.

2. **Database Schema**: Defined using Drizzle ORM with PostgreSQL-specific column types, including vector storage for embeddings.

## Data Flow

1. **Document Upload**:
   - User uploads a document through the UI
   - The document is temporarily stored on the server
   - Metadata is recorded in the database
   - OCR processing is triggered if applicable
   - Optional notification is sent through Telegram

2. **OCR Processing**:
   - The server processes the document with Tesseract.js
   - Extracted text is stored in the database
   - Document status is updated
   - Optional notification is sent

3. **AI Analysis**:
   - User requests analysis of a document
   - Server sends document content to OpenAI's GPT-4o
   - Analysis result is stored in the database
   - Result is returned to the frontend
   - Optional notification is sent

4. **Semantic Search**:
   - User enters a query
   - Query is converted to an embedding vector via OpenAI
   - Vector similarity search is performed against document vectors
   - Results are returned to the frontend

## External Dependencies

### APIs and Services

1. **OpenAI API**: Used for document analysis with GPT-4o and generating embeddings for semantic search.

2. **Google Drive API**: Integration for storing and retrieving documents from Google Drive.

3. **Telegram Bot API**: Used for sending notifications about document processing and analysis.

### Key Libraries

1. **Frontend**:
   - React: UI framework
   - @tanstack/react-query: Server state management
   - wouter: Client-side routing
   - shadcn/ui components: UI component library based on Radix UI
   - Tailwind CSS: Utility-first CSS framework

2. **Backend**:
   - Express.js: Web server framework
   - Drizzle ORM: SQL query builder and ORM
   - multer: File upload handling
   - Tesseract.js: OCR processing
   - OpenAI SDK: OpenAI API integration
   - Google APIs: Google Drive integration

## Deployment Strategy

The application is configured for deployment on Replit with the following considerations:

1. **Development Mode**:
   - Uses Vite's development server with hot module replacement
   - Server API endpoints are proxied to the frontend
   - Debug tooling and error overlays are enabled

2. **Production Mode**:
   - Frontend is built using Vite's production build
   - Server files are bundled with esbuild
   - Static assets are served by the Express server
   - Environment variables control API keys and configuration

3. **Database**:
   - Uses PostgreSQL as the database
   - Configured to work with Neon Serverless PostgreSQL
   - Environment variables for database connection

4. **Environment Variables**:
   - `DATABASE_URL`: Connection string for PostgreSQL database
   - `OPENAI_API_KEY`: OpenAI API key for AI services
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google API credentials
   - `TELEGRAM_BOT_TOKEN`: Token for Telegram Bot API

## Getting Started

To run the application locally:

1. Ensure you have Node.js and npm installed
2. Set up a PostgreSQL database and update the `DATABASE_URL` environment variable
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`

For database schema updates:
- Use `npm run db:push` to update the schema in the database

For production builds:
- Use `npm run build` to create production bundles
- Use `npm run start` to start the production server