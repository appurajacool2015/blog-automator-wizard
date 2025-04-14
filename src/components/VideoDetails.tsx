import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VideoDetails as VideoDetailsType } from "@/types";
import { useState, useEffect } from "react";
import { fetchVideoDetails } from "@/utils/youtubeService";

interface VideoDetailsProps {
  videoId: string;
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ videoId }) => {
  const [videoDetails, setVideoDetails] = useState<VideoDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchVideoDetails(videoId);
        setVideoDetails(details);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load video details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadVideoDetails();
  }, [videoId]);

  const clearTranscriptCache = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/transcript-cache', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear cache');
      }
      
      toast.success('Transcript cache cleared successfully');
      // Reload video details to fetch fresh transcript
      const details = await fetchVideoDetails(videoId);
      setVideoDetails(details);
    } catch (error) {
      console.error('Error clearing transcript cache:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear transcript cache');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading transcript...</div>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-destructive">Error</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearTranscriptCache}
          >
            Clear Cache & Retry
          </Button>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Transcript</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearTranscriptCache}
          >
            Clear Cache
          </Button>
        </div>
        {videoDetails?.transcript ? (
          <p className="text-sm text-muted-foreground">{videoDetails.transcript}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No transcript available in English or Hindi for this video.
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoDetails; 