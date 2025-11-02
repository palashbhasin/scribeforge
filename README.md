# ScribeForge 🔨

An AI-powered writing organizer that helps organize your texts and identifies characters and their traits using ChatGPT.

## Features

- **📚 Project Management**: Create and manage multiple writing projects
- **🤖 AI Agent**: Dump text and let AI organize it into chapters automatically
- **👥 Character Identification**: AI automatically detects and catalogs characters with their traits
- **✍️ Writing Space**: Clean, distraction-free writing environment
- **🎨 Beautiful UI**: Warm, forge-themed design with orange accents

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create a Project**: Click "New Project" to start organizing your work
2. **Add Content**: Use the AI Agent sidebar to paste your text
3. **Organize**: Click "Organize Text" to automatically split into chapters
4. **View Characters**: Characters are automatically identified and shown in the Characters sidebar
5. **Write**: Click on any chapter to start writing or editing

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- OpenAI API

## Environment Variables

The `.env.local` file contains your OpenAI API key and is already configured.
