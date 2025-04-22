# Blog Automator Wizard

A tool to automatically generate blog posts from YouTube videos.

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- YouTube API key
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blog-automator-wizard.git
cd blog-automator-wizard
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend (.env.development)
PORT=3005
NODE_ENV=development
YOUTUBE_API_KEY=your_youtube_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:3005

# Frontend (.env)
VITE_API_URL=http://localhost:3005
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3005

## Project Structure

```
blog-automator-wizard/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── videos.js      # Video-related endpoints
│   │   │   ├── channels.js    # Channel management
│   │   │   ├── categories.js  # Category management
│   │   │   └── transcript.js  # Transcript handling
│   │   ├── cache.js           # Video cache management
│   │   ├── transcriptCache.js # Transcript caching
│   │   ├── summaryCache.js    # Summary caching
│   │   └── server.js          # Express server setup
│   ├── data/                  # Data storage
│   │   ├── cache/            # Cache files
│   │   │   ├── transcripts.json
│   │   │   └── summaries.json
│   │   └── channels.json     # Channel data
│   ├── .env.development      # Development environment variables
│   └── package.json
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Admin.tsx    # Admin dashboard
│   │   │   ├── CategoryList.tsx
│   │   │   ├── ChannelList.tsx
│   │   │   ├── VideoContent.tsx
│   │   │   └── VideoDetails.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Index.tsx    # Main page
│   │   │   └── Admin.tsx    # Admin page
│   │   ├── utils/           # Utility functions
│   │   │   ├── apiService.ts
│   │   │   ├── dataService.ts
│   │   │   └── youtubeService.ts
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
└── README.md
```

## Features

- **Video Processing**
  - Fetch video details from YouTube API
  - Extract transcripts from videos
  - Generate summaries using AI
  - Cache transcripts and summaries for efficiency

- **Channel Management**
  - Add/remove channels
  - Organize channels by categories
  - Cache channel videos

- **Admin Dashboard**
  - Manage channels and categories
  - Clear caches
  - Monitor system status

## API Endpoints

### Videos
- `GET /api/videos/:videoId` - Get video details, transcript, and summary
- `GET /api/videos/channel/:channelId` - Get videos for a channel
- `DELETE /api/videos/channel/:channelId/cache` - Clear video cache for a channel
- `DELETE /api/videos/:videoId/summary-cache` - Clear summary cache for a video
- `DELETE /api/videos/summary-cache` - Clear all summary cache

### Transcripts
- `GET /api/transcript/:videoId` - Get video transcript
- `DELETE /api/transcript/cache` - Clear transcript cache

### Channels
- `GET /api/channels` - Get all channels
- `GET /api/channels?category=name` - Get channels by category
- `PUT /api/channels/:channelId` - Add/update a channel
- `DELETE /api/channels/:channelId` - Remove a channel

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

## Development

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Production

### Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
