
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Video } from '@/types';
import { getVideosByChannel } from '@/utils/dataService';
import { fetchChannelVideos } from '@/utils/youtubeService';
import { Loader2 } from 'lucide-react';

interface VideoListProps {
  channelId?: string;
  onVideoSelected?: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ channelId, onVideoSelected }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) {
      setVideos([]);
      setSelectedVideoId(null);
      return;
    }
    
    const loadVideos = async () => {
      setLoading(true);
      
      try {
        // First check if we have videos in local storage
        let videosList = getVideosByChannel(channelId);
        
        // If we have no videos or fewer than 50, fetch from API
        if (videosList.length === 0) {
          const fetchedVideos = await fetchChannelVideos(channelId);
          videosList = fetchedVideos;
        }
        
        setVideos(videosList);
        
        // Select the first video if available
        if (videosList.length > 0 && !selectedVideoId) {
          setSelectedVideoId(videosList[0].videoId);
          onVideoSelected?.(videosList[0].videoId);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadVideos();
  }, [channelId, onVideoSelected, selectedVideoId]);

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId);
    onVideoSelected?.(videoId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Videos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : !channelId ? (
          <p className="text-gray-500 text-center py-4">Select a channel first</p>
        ) : videos.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No videos found for this channel</p>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div 
                key={video.videoId}
                className={`video-item flex p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
                  video.videoId === selectedVideoId ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => handleVideoClick(video.videoId)}
              >
                <div className="w-1/3 mr-3">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-auto rounded-md"
                  />
                </div>
                <div className="w-2/3">
                  <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoList;
