
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash, Edit, Youtube } from "lucide-react";
import { fetchChannels, deleteChannel, addChannel } from '@/utils/apiService';
import { Channel } from '@/types';
import { Input } from '@/components/ui/input';

interface ChannelListProps {
  categoryId?: string;
  onChannelSelected?: (channelId: string) => void;
  refreshTrigger?: number;
  isAdmin?: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  categoryId, 
  onChannelSelected,
  refreshTrigger = 0,
  isAdmin = false 
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editName, setEditName] = useState('');
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!categoryId) {
      setChannels([]);
      return;
    }
    
    const loadChannels = async () => {
      try {
        const channelsList = await fetchChannels(categoryId);
        setChannels(channelsList);
        
        // Select the first channel if none is selected and we have channels
        if (channelsList.length > 0 && !selectedChannelId) {
          setSelectedChannelId(channelsList[0].id);
          onChannelSelected?.(channelsList[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch channels",
          variant: "destructive",
        });
      }
    };
    
    loadChannels();
  }, [categoryId, refreshTrigger, onChannelSelected, selectedChannelId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteChannel(id);
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
      
      // Update the channels list
      if (categoryId) {
        const updatedChannels = await fetchChannels(categoryId);
        setChannels(updatedChannels);
        
        // If the deleted channel was selected, select the first available one
        if (id === selectedChannelId) {
          if (updatedChannels.length > 0) {
            setSelectedChannelId(updatedChannels[0].id);
            onChannelSelected?.(updatedChannels[0].id);
          } else {
            setSelectedChannelId(null);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
    setEditYoutubeId(channel.youtubeId);
  };

  const handleSaveEdit = async () => {
    if (!editingChannel || !categoryId) return;
    
    try {
      // Delete the old channel and create a new one
      await deleteChannel(editingChannel.id);
      await addChannel(editYoutubeId.trim(), editName.trim(), categoryId);
      
      toast({
        title: "Success",
        description: "Channel updated successfully",
      });
      
      // Update the channels list
      const updatedChannels = await fetchChannels(categoryId);
      setChannels(updatedChannels);
      setEditingChannel(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update channel",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingChannel(null);
  };

  const handleChannelClick = (channelId: string) => {
    setSelectedChannelId(channelId);
    onChannelSelected?.(channelId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {!categoryId ? (
          <p className="text-gray-500 text-center py-4">Select a category first</p>
        ) : channels.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No channels found in this category</p>
        ) : (
          <ul className="space-y-2">
            {channels.map((channel) => (
              <li key={channel.id}>
                {editingChannel?.id === channel.id && isAdmin ? (
                  <div className="space-y-2 p-2 border rounded-md">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Channel Name"
                      className="mb-2"
                    />
                    <Input
                      value={editYoutubeId}
                      onChange={(e) => setEditYoutubeId(e.target.value)}
                      placeholder="YouTube Channel ID"
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} className="flex-1">Save</Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
                      channel.id === selectedChannelId ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Youtube size={16} className="text-red-500" />
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(channel);
                        }}>
                          <Edit size={16} />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash size={16} className="text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the channel and any associated data.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(channel.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelList;
