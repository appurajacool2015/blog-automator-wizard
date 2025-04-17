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

interface VideoListProps {
  channelId?: string;
  onVideoSelected?: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ channelId, onVideoSelected }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadVideos = async (forceRefresh = false) => {
    if (!channelId) {
      setVideos([]);
      setSelectedVideoId(null);
      return;
    }

    setLoading(true);
    
    try {
      // If force refresh is true, clear both backend and local storage cache
      if (forceRefresh) {
        setRefreshing(true);
        try {
          // Clear backend cache
          await axios.delete(`http://localhost:3004/api/videos/${channelId}/cache`);
          
          // Clear local storage for this channel's videos
          const allVideos = getVideosByChannel(''); // Get all videos
          const filteredVideos = allVideos.filter(v => v.channelId !== channelId);
          localStorage.setItem('blog-automator-videos', JSON.stringify(filteredVideos));
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      }

      // Always fetch fresh videos from API when refreshing
      if (forceRefresh) {
        const fetchedVideos = await fetchChannelVideos(channelId);
        setVideos(fetchedVideos);
        
        // Select the first video if available
        if (fetchedVideos.length > 0 && !selectedVideoId) {
          setSelectedVideoId(fetchedVideos[0].videoId);
          onVideoSelected?.(fetchedVideos[0].videoId);
        }
      } else {
        // For initial load, check local storage first
        let videosList = getVideosByChannel(channelId);
        
        // If no videos in local storage, fetch from API
        if (videosList.length === 0) {
          videosList = await fetchChannelVideos(channelId);
        }
        
        setVideos(videosList);
        
        // Select the first video if available
        if (videosList.length > 0 && !selectedVideoId) {
          setSelectedVideoId(videosList[0].videoId);
          onVideoSelected?.(videosList[0].videoId);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [channelId, onVideoSelected, selectedVideoId]);

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
