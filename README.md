
# Blog Automator Wizard - YouTube to WordPress Blog Automation

This application automatically fetches videos from YouTube channels and generates blog posts to be published on WordPress. It provides a responsive user interface for managing categories, channels, and videos, as well as for viewing video transcripts and summaries.

## Project info

**URL**: https://lovable.dev/projects/9fedb541-a6bc-48c2-81db-0c5f9a42d057

## Features

- Category and channel management
- YouTube video browsing and playback
- Automated transcript fetching
- Automated summary generation
- Blog post generation
- WordPress integration
- Scheduled automation via cron jobs

## Setup Instructions

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A YouTube Data API key (already included in the application)
- WordPress site with REST API access (for publishing blog posts)

### Installation

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Configuration

1. YouTube API:
   - The application already includes a YouTube API key
   - If you need to use your own key, update it in `src/utils/youtubeService.ts`

2. WordPress Integration:
   - To configure WordPress posting, update the settings in `src/scripts/cronJob.js`
   - Set your WordPress site URL, username, and application password

### Using the Application

1. Start by navigating to the `/admin` page to add categories and channels
2. On the home page, browse categories and channels to view videos
3. Select a video to view its transcript and summary
4. Generate blog posts with the "Generate Blog Post" button

## Setting Up the Cron Job

The application includes a cron job script that can be scheduled to run automatically to fetch new videos and generate blog posts.

### On Linux/Mac (Using Crontab)

1. Make the script executable:
   ```sh
   chmod +x src/scripts/cronJob.js
   ```

2. Open your crontab configuration:
   ```sh
   crontab -e
   ```

3. Add a line to run the script daily at midnight:
   ```
   0 0 * * * cd /path/to/your/project && node src/scripts/cronJob.js >> logs/cron.log 2>&1
   ```

4. Save and exit

### On Windows (Using Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name it "Blog Automator" and click Next
4. Select "Daily" and click Next
5. Set the start time to midnight and click Next
6. Select "Start a Program" and click Next
7. In the Program/script field, enter: `node`
8. In the Add arguments field, enter: `src/scripts/cronJob.js`
9. In the Start in field, enter your project directory path
10. Click Next and then Finish

### Monitoring the Cron Job

- Check the logs in `logs/cron.log` (Linux/Mac) or in the Task Scheduler history (Windows)
- If the cron job stops working:
  1. Check if Node.js is properly installed
  2. Verify the paths in your cron configuration
  3. Make sure the script has execution permissions
  4. Check for errors in the log file

### Restarting the Cron Job

If the cron job fails or needs to be restarted:

**Linux/Mac:**
```sh
# Check if the cron service is running
service cron status

# Start cron service if it's not running
sudo service cron start

# Edit crontab if needed
crontab -e
```

**Windows:**
1. Open Task Scheduler
2. Find your "Blog Automator" task
3. Right-click and select "Run" to run it immediately
4. Check "Enable" if it's disabled

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

To deploy this project:

1. Simply open [Lovable](https://lovable.dev/projects/9fedb541-a6bc-48c2-81db-0c5f9a42d057) and click on Share -> Publish.
2. For the cron job to work in production, you'll need to set it up on your hosting server.

## Custom Domain

Yes, you can connect a custom domain to your Lovable project!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
