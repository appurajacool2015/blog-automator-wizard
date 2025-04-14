# Blog Automator Wizard

A tool to automatically generate blog posts from YouTube videos.

## Features

- Fetch videos from YouTube channels
- Generate transcripts using AI
- Create blog posts automatically
- WordPress integration
- Scheduled updates

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- YouTube API key
- WordPress API credentials

## Project Structure

```
blog-automator-wizard/
├── frontend/              # React frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
│
├── backend/              # Node.js backend server
│   ├── src/              # Source code
│   ├── data/             # Data storage
│   │   ├── channels.json # Channel configurations
│   │   └── cache/        # Cache directory
│   │       └── transcripts.json # Cached transcripts
│   └── package.json      # Backend dependencies
│
└── README.md            # Project documentation
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blog-automator-wizard.git
cd blog-automator-wizard
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd frontend
npm install
npm install -D @vitejs/plugin-react-swc  # Required for Vite React development

# Install backend dependencies
cd ../backend
npm install
```

3. Create a `.env` file in the backend directory with your API keys:
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
```

## Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Access the application at `http://localhost:5173`

## Cleaning Up and Reinstalling Dependencies

If you need to clean up and reinstall all dependencies:

```bash
# Remove all node_modules directories
rm -rf node_modules frontend/node_modules backend/node_modules

# Reinstall all dependencies
cd frontend && npm install && npm install -D @vitejs/plugin-react-swc && cd ../backend && npm install
```

## Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
cd backend
npm start
```

## Configuration

- Edit `backend/data/channels.json` to add your YouTube channels
- Configure WordPress settings in the frontend
- Set up cron jobs for automatic updates

## License

MIT
