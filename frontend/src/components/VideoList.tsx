import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Video } from '@/types';
import { getVideosByChannel, saveVideos } from '@/utils/dataService';
import { fetchChannelVideos } from '@/utils/youtubeService';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast";

interface VideoListProps {
  channelId?: string;
  onVideoSelected?: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ channelId, onVideoSelected }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadVideos = async (forceRefresh = false) => {
    console.log('loadVideos called with channelId:', channelId, 'forceRefresh:', forceRefresh);
    setError(null);
    
    if (!channelId) {
      setVideos([]);
      setSelectedVideoId(null);
      return;
    }

    setLoading(true);
    
    try {
      let videosList;
      
      if (forceRefresh) {
        setRefreshing(true);
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/videos/channel/${channelId}/cache`);
          console.log('Cache cleared successfully');
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      }

      // Always try to fetch from API
      try {
        console.log('Fetching videos from API for channel:', channelId);
        videosList = await fetchChannelVideos(channelId);
        console.log('Videos fetched successfully:', videosList);
      } catch (error) {
        console.error('Error fetching videos:', error);
        if (error instanceof Error) {
          setError(error.message);
          toast({
            title: "Error fetching videos",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      setVideos(videosList);
      
      if (videosList.length > 0 && !selectedVideoId) {
        setSelectedVideoId(videosList[0].videoId);
        onVideoSelected?.(videosList[0].videoId);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [channelId]);

  const handleRefresh = () => {
    loadVideos(true);
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId);
    onVideoSelected?.(videoId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Videos</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Videos</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadVideos(true)}
              className="mt-2"
            >
              Try Again
            </Button>
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
