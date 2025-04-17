# Blog Automator Wizard

A powerful tool that helps you convert YouTube videos into blog posts automatically. The application fetches video transcripts, generates summaries, and creates blog-ready content.

## Features

- **Video Content Management**
  - Fetch and display YouTube video details
  - View video transcripts with timestamp formatting
  - Generate AI-powered summaries of video content
  - Clear transcript cache for fresh content

- **Channel Management**
  - Add and manage YouTube channels
  - Organize channels by categories
  - Update channel names and categories
  - Delete channels

- **Blog Generation**
  - Convert video content into blog posts
  - AI-powered content transformation
  - Customizable blog post structure

## Tech Stack

- **Frontend**
  - React with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - Shadcn UI components
  - React Query for data fetching
  - React Router for navigation

- **Backend**
  - Node.js with Express
  - TypeScript
  - File-based data storage
  - CORS enabled for frontend communication

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- YouTube API key (for video fetching)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd blog-automator-wizard
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

4. Create environment files:
   - Frontend: Create `.env` in the frontend directory
   - Backend: Create `.env` in the backend directory

5. Start the development servers:
   - Frontend: `npm run dev` (runs on port 5173)
   - Backend: `npm run dev` (runs on port 3005)

## Troubleshooting

### Transcript Issues

If you see "No transcript available" for a video:

1. **Check Video Captions**: Ensure the YouTube video has captions available. Not all videos have captions.

2. **Clear Transcript Cache**: 
   - Click the "Clear Transcript Cache" button in the video content panel
   - This will force a fresh fetch of the transcript
   - The cache is stored for 24 hours by default

3. **Supported Languages**: 
   - The application currently supports English (en) and Hindi (hi) captions
   - If the video has captions in other languages, they won't be fetched

4. **Video Restrictions**:
   - Private or restricted videos may not have accessible captions
   - Some videos may have disabled captions

### Cache Management

- Transcripts are cached for 24 hours to improve performance
- You can manually clear the cache using the "Clear Transcript Cache" button
- The cache is stored in `backend/data/cache/transcripts.json`

## Project Structure

```
blog-automator-wizard/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── backend/
│   ├── src/
│   │   ├── data/          # Data storage
│   │   ├── routes/        # API routes
│   │   └── server.ts      # Express server
│   └── package.json       # Backend dependencies
│
└── README.md
```

## API Endpoints

### Backend API (Port 3005)

- `GET /api/videos/:videoId` - Fetch video details
- `GET /api/transcript/:videoId` - Get video transcript
- `DELETE /api/transcript-cache` - Clear transcript cache
- `GET /api/channels` - Get all channels
- `POST /api/channels` - Add a new channel
- `PUT /api/channels/:channelId` - Update a channel
- `DELETE /api/channels/:channelId` - Delete a channel
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add a new category
- `DELETE /api/categories/:categoryId` - Delete a category

## Development

### Frontend Development

The frontend is built with React and TypeScript, using Vite as the build tool. Key features include:

- Component-based architecture
- Type-safe development with TypeScript
- Responsive design with Tailwind CSS
- Modern UI components from Shadcn
- Efficient state management with React Query

### Backend Development

The backend is a Node.js Express server with TypeScript support. Features include:

- RESTful API endpoints
- File-based data storage
- CORS configuration for frontend access
- Error handling and logging
- Type-safe development

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YouTube API for video content access
- OpenAI for AI-powered content generation
- The open-source community for various tools and libraries
