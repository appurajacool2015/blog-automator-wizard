
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import CategoryForm from '@/components/CategoryForm';
import ChannelForm from '@/components/ChannelForm';
import CategoryList from '@/components/CategoryList';
import ChannelList from '@/components/ChannelList';
import { initializeWithExampleData } from '@/utils/dataService';

const Admin = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('categories');

  const handleCategoryAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChannelAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCategorySelected = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleInitializeData = () => {
    initializeWithExampleData();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
            <Button variant="outline" size="sm" onClick={handleInitializeData}>
              Initialize Example Data
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="mr-2 h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your YouTube channels, categories, and automation settings
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <CategoryForm onCategoryAdded={handleCategoryAdded} />
              </div>
              <div className="md:col-span-2">
                <CategoryList 
                  refreshTrigger={refreshTrigger} 
                  isAdmin={true} 
                  onCategorySelected={handleCategorySelected}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="channels" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <ChannelForm onChannelAdded={handleChannelAdded} />
              </div>
              <div className="md:col-span-2">
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Category Selection</h3>
                  <CategoryList 
                    refreshTrigger={refreshTrigger} 
                    onCategorySelected={handleCategorySelected}
                  />
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Channels in Selected Category</h3>
                    <ChannelList 
                      categoryId={selectedCategoryId} 
                      refreshTrigger={refreshTrigger}
                      isAdmin={true}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
