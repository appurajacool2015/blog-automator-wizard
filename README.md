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
- A YouTube Data API key (required for fetching videos and channel data)
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
   - You'll need to obtain a YouTube Data API key from the [Google Cloud Console](https://console.cloud.google.com/)
   - Once you have your API key, update it in `src/utils/youtubeService.ts`

2. WordPress Integration:
   - To configure WordPress posting, update the settings in `src/scripts/cronJob.js`
   - Set your WordPress site URL, username, and application password for your coolestmags.xyz account

### Using the Application

1. Start by navigating to the `/admin` page to add categories and channels
2. On the home page, browse categories from the dropdown and select a category to view its channels
3. Click on a channel to view the latest 50 videos from that channel
4. Select a video to view its transcript and summary in the right panel
5. Generate blog posts with the "Generate Blog Post" button
6. The application will automatically store all data in your browser's local storage

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

### Monitoring and Troubleshooting the Cron Job

#### Checking Cron Job Status

- Check the logs in `logs/cron.log` (Linux/Mac) or in the Task Scheduler history (Windows)
- Use the following command to see if your cron job is scheduled correctly:
  ```sh
  crontab -l
  ```

#### Common Issues and Solutions

1. **Cron job not running:**
   - Check if Node.js is properly installed and accessible in your PATH
   - Verify the paths in your cron configuration
   - Make sure the script has execution permissions

2. **Script errors:**
   - Check the logs for error messages
   - Ensure all required dependencies are installed
   - Verify API keys are correct and have necessary permissions

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

# To remove all cron jobs if you need to start fresh
crontab -r
```

**Windows:**
1. Open Task Scheduler
2. Find your "Blog Automator" task
3. Right-click and select "Run" to run it immediately
4. Check "Enable" if it's disabled
5. To recreate the task, delete it first, then follow the setup steps again

## WordPress Integration

The application is configured to post blog content to your WordPress site at coolestmags.xyz:

1. Set up the WordPress REST API credentials in `src/scripts/cronJob.js`
2. The cron job will automatically post new content daily
3. Each blog post will follow the format `StockName_ChannelName_YoutubeVideoId`
4. The application uses WordPress REST API to post content, requiring:
   - WordPress username
   - Application password (created in WordPress admin)
   - Site URL (coolestmags.xyz)

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Axios for API requests

## Adding More Features

To extend this application:

1. Add user authentication to protect the admin area
2. Implement more advanced NLP for better summaries
3. Add analytics to track blog post performance
4. Integrate with social media platforms for sharing

## Deployment

To deploy this project:

1. Simply open [Lovable](https://lovable.dev/projects/9fedb541-a6bc-48c2-81db-0c5f9a42d057) and click on Share -> Publish.
2. For the cron job to work in production, you'll need to set it up on your hosting server.

## Custom Domain

Yes, you can connect a custom domain to your Lovable project!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
