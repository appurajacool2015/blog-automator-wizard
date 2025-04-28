/**
 * Homepage component that provides the main interface for:
 * - Selecting categories
 * - Viewing and reordering channels within categories (via drag and drop)
 * - Browsing videos within channels
 * - Viewing video content and transcripts
 * 
 * Features:
 * - Responsive design with separate mobile and desktop layouts
 * - State management for selected category/channel/video
 * - Panel-based navigation for mobile view
 */
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
import DraggableChannelList from '@/components/DraggableChannelList';

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
            <DraggableChannelList 
              categoryName={selectedCategoryId} 
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
  const renderMobileLayout = () => (
    <div className="h-[calc(100vh-120px)]">
      {activePanel === 'categories' && (
        <div className="mb-4">
          <CategoryDropdown onCategorySelected={handleCategorySelected} selectedCategoryId={selectedCategoryId} />
        </div>
      )}
      
      {activePanel === 'channels' && selectedCategoryId && (
        <DraggableChannelList 
          categoryName={selectedCategoryId} 
          onChannelSelected={handleChannelSelected} 
        />
      )}
      
      {activePanel === 'videos' && selectedChannelId && (
        <VideoList 
          channelId={selectedChannelId} 
          onVideoSelected={handleVideoSelected} 
        />
      )}
      
      {activePanel === 'content' && selectedVideoId && (
        <VideoContent videoId={selectedVideoId} />
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Blog Automator Wizard</h1>
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
      
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default Index;
