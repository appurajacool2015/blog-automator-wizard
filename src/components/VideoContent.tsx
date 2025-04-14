import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoDetails } from '@/types';
import { getVideoDetails } from '@/utils/dataService';
import { fetchVideoDetails, generateBlogPost } from '@/utils/youtubeService';
import { Loader2, FileText, BookText, FileOutput } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import VideoDetailsComponent from './VideoDetails';

interface VideoContentProps {
  videoId?: string;
}

const VideoContent: React.FC<VideoContentProps> = ({ videoId }) => {
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoId) {
      setDetails(null);
      setBlogContent(null);
      return;
    }
    
    const loadDetails = async () => {
      setLoading(true);
      
      try {
        // First check if we have details in local storage
        let videoDetails = getVideoDetails(videoId);
        
        // If not, fetch from API
        if (!videoDetails) {
          videoDetails = await fetchVideoDetails(videoId);
        }
        
        setDetails(videoDetails);
      } catch (error) {
        console.error('Error loading video details:', error);
        toast({
          title: "Error",
          description: "Failed to load video details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDetails();
  }, [videoId, toast]);

  const formatTranscript = (transcript: string) => {
    const lines = transcript.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => {
      // Match timestamp pattern [00:00:00] or [00:00]
      const timestampMatch = line.match(/^\[([\d:]+)\]/);
      if (timestampMatch) {
        const timestamp = timestampMatch[0];
        const text = line.replace(timestamp, '').trim();
        return (
          <p key={index} className="mb-2">
            <span className="text-gray-500 font-mono text-xs mr-2">{timestamp}</span>
            {text}
          </p>
        );
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  const formatSummary = (summary: string) => {
    const lines = summary.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => {
      // Check if line starts with a number followed by a period (like "1.")
      if (line.match(/^\d+\.\s/)) {
        return <li key={index} className="mb-2">{line}</li>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  const formatBlogContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => {
      // Check for headings (lines that end with a colon)
      if (line.endsWith(':')) {
        return <h3 key={index} className="text-lg font-semibold mb-2">{line}</h3>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  const handleGenerateBlogPost = async () => {
    if (!videoId || !details) return;
    
    setGeneratingBlog(true);
    setBlogContent(null);
    
    try {
      // In a real application, you would get the stock name and channel name from the UI
      // For now, we'll use placeholders
      const stockName = "Sample Stock";
      const channelName = "Sample Channel";
      
      const blog = await generateBlogPost(videoId, stockName, channelName);
      setBlogContent(blog);
      setActiveTab('blog');
      
      toast({
        title: "Success",
        description: "Blog post generated successfully",
      });
    } catch (error) {
      console.error('Error generating blog post:', error);
      toast({
        title: "Error",
        description: "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setGeneratingBlog(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Video Content</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : videoId ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">
                  <BookText className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="blog">
                  <FileOutput className="h-4 w-4 mr-2" />
                  Blog
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                {details?.summary ? (
                  <div className="prose prose-sm max-w-none">
                    {formatSummary(details.summary)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No summary available.</p>
                )}
              </TabsContent>
              
              <TabsContent value="transcript" className="mt-4">
                <VideoDetailsComponent videoId={videoId} />
              </TabsContent>
              
              <TabsContent value="blog" className="mt-4">
                {blogContent ? (
                  <div className="prose prose-sm max-w-none">
                    {formatBlogContent(blogContent)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate a blog post from the video content.
                    </p>
                    <Button 
                      onClick={handleGenerateBlogPost}
                      disabled={generatingBlog}
                    >
                      {generatingBlog ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Blog Post'
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a video to view its content.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoContent;
