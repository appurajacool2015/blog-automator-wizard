
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import ChannelList from '@/components/ChannelList';
import VideoList from '@/components/VideoList';
import VideoContent from '@/components/VideoContent';
import { fetchCategories } from '@/utils/apiService';
import { useIsMobile } from '@/hooks/use-mobile';
import CategoryDropdown from '@/components/CategoryDropdown';

const Index = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(undefined);
  const [activePanel, setActivePanel] = useState<'categories' | 'channels' | 'videos' | 'content'>('categories');
  const isMobile = useIsMobile();

  // Check if we have categories on initial load and select the first one
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await fetchCategories();
        if (categories.length > 0) {
          setSelectedCategoryId(categories[0].id);
        } else {
          console.log('No categories found. You might want to add some in the Admin panel.');
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleCategorySelected = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedChannelId(undefined);
    setSelectedVideoId(undefined);
    if (isMobile) {
      setActivePanel('channels');
    }
  };

  const handleChannelSelected = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedVideoId(undefined);
    if (isMobile) {
      setActivePanel('videos');
    }
  };

  const handleVideoSelected = (videoId: string) => {
    setSelectedVideoId(videoId);
    if (isMobile) {
      setActivePanel('content');
    }
  };

  const handleBackClick = () => {
    switch (activePanel) {
      case 'channels':
        setActivePanel('categories');
        break;
      case 'videos':
        setActivePanel('channels');
        break;
      case 'content':
        setActivePanel('videos');
        break;
      default:
        break;
    }
  };

  // Desktop layout
  const renderDesktopLayout = () => (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
      <div className="col-span-3">
        <div className="mb-4">
          <CategoryDropdown onCategorySelected={handleCategorySelected} selectedCategoryId={selectedCategoryId} />
        </div>
        
        <div className="h-[calc(100%-80px)]">
          {selectedCategoryId && (
            <ChannelList 
              categoryId={selectedCategoryId} 
              onChannelSelected={handleChannelSelected} 
            />
          )}
        </div>
      </div>
      <div className="col-span-4">
        <VideoList channelId={selectedChannelId} onVideoSelected={handleVideoSelected} />
      </div>
      <div className="col-span-5">
        <VideoContent videoId={selectedVideoId} />
      </div>
    </div>
  );

  // Mobile layout
  const renderMobileLayout = () => {
    switch (activePanel) {
      case 'categories':
        return (
          <div className="h-full">
            <CategoryDropdown onCategorySelected={handleCategorySelected} selectedCategoryId={selectedCategoryId} />
          </div>
        );
      case 'channels':
        return (
          <div className="h-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4" 
              onClick={handleBackClick}
            >
              Back to Categories
            </Button>
            <ChannelList 
              categoryId={selectedCategoryId} 
              onChannelSelected={handleChannelSelected} 
            />
          </div>
        );
      case 'videos':
        return (
          <div className="h-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4" 
              onClick={handleBackClick}
            >
              Back to Channels
            </Button>
            <VideoList 
              channelId={selectedChannelId} 
              onVideoSelected={handleVideoSelected} 
            />
          </div>
        );
      case 'content':
        return (
          <div className="h-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="mb-4" 
              onClick={handleBackClick}
            >
              Back to Videos
            </Button>
            <VideoContent videoId={selectedVideoId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-brand-blue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Blog Automator Wizard</h1>
            <p className="text-sm text-gray-200">
              YouTube to WordPress Blog Automation
            </p>
          </div>
          <Link to="/admin">
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <Settings size={16} />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </main>
    </div>
  );
};

export default Index;
