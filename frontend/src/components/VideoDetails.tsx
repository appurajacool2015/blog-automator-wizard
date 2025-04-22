import { VideoDetails as VideoDetailsType } from "@/types";
import { useState, useEffect } from "react";
import { fetchVideoDetails } from "@/utils/youtubeService";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface VideoDetailsProps {
  videoId: string;
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ videoId }) => {
  const [videoDetails, setVideoDetails] = useState<VideoDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };
    loadVideoDetails();
  }, [videoId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!videoDetails) {
    return <div>No video details available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={videoDetails.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          style={{ border: 'none' }}
        />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{videoDetails.title}</h2>
        <div className="relative">
          <p className={`text-gray-600 ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
            {videoDetails.description}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-1 flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            {isDescriptionExpanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoDetails; 