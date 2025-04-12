
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
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Content</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : !videoId ? (
          <p className="text-gray-500 text-center py-4">Select a video first</p>
        ) : !details ? (
          <p className="text-gray-500 text-center py-4">No details available for this video</p>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{details.title}</h3>
              <div className="flex justify-center mt-2">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="max-w-full rounded-lg shadow-md"
                ></iframe>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <BookText size={16} />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex items-center gap-2">
                  <FileText size={16} />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="blog" className="flex items-center gap-2" disabled={!blogContent}>
                  <FileOutput size={16} />
                  Blog Post
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="p-4 bg-gray-50 rounded-md mt-4 max-h-[300px] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {formatSummary(details.summary)}
                </div>
              </TabsContent>
              <TabsContent value="transcript" className="p-4 bg-gray-50 rounded-md mt-4 max-h-[300px] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {formatTranscript(details.transcript)}
                </div>
              </TabsContent>
              <TabsContent value="blog" className="p-4 bg-gray-50 rounded-md mt-4 max-h-[300px] overflow-y-auto">
                {blogContent ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {blogContent}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Generate a blog post first</p>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleGenerateBlogPost} 
                disabled={generatingBlog}
                className="flex items-center gap-2"
              >
                {generatingBlog && <Loader2 className="h-4 w-4 animate-spin" />}
                {generatingBlog ? 'Generating...' : 'Generate Blog Post'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoContent;
