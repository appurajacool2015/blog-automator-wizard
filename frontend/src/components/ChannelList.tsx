import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { fetchChannels, deleteChannel, updateChannel, updateChannelOrder } from '@/utils/apiService';
import { Channel } from '@/types';

// SortableItem component
const SortableItem = ({ channel, isSelected, onSelect, isAdmin, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: channel.id,
    data: channel
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e) => {
    // Only handle click if it's not a drag operation
    if (!isDragging) {
      onSelect(channel.id);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-blue-50 border-blue-300' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 flex-1">
        <Youtube size={16} className="text-red-500" />
        <span className="font-medium select-none">
          {channel.name}
        </span>
      </div>
      {isAdmin && (
        <div 
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost" onClick={(e) => {
            e.stopPropagation();
            onEdit(channel);
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
                  onClick={() => onDelete(channel.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </li>
  );
};

const ChannelList = ({ 
  categoryName, 
  onChannelSelected,
  refreshTrigger = 0,
  isAdmin = false 
}) => {
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [editingChannel, setEditingChannel] = useState(null);
  const [editName, setEditName] = useState('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Configure the drag activation constraints
      activationConstraint: {
        // Only start dragging after moving 8px
        distance: 8,
        // Require the pointer to be pressed for 250ms before dragging starts
        delay: 250,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!categoryName) {
      setChannels([]);
      return;
    }
    
    const loadChannels = async () => {
      try {
        const channelsList = await fetchChannels(categoryName);
        // Add categoryName to each channel
        const channelsWithCategory = channelsList.map(channel => ({
          ...channel,
          categoryName
        }));
        setChannels(channelsWithCategory);
        
        if (channelsWithCategory.length > 0 && !selectedChannelId) {
          setSelectedChannelId(channelsWithCategory[0].id);
          onChannelSelected?.(channelsWithCategory[0].id);
        }
      } catch (error) {
        console.error('Error loading channels:', error);
        toast({
          title: "Error",
          description: "Failed to fetch channels",
          variant: "destructive",
        });
      }
    };
    
    loadChannels();
  }, [categoryName, refreshTrigger]);

  const handleDragEnd = async (event) => {
    console.log('Drag end event:', event);
    const { active, over } = event;
    
    if (!active || !over || active.id === over.id || !categoryName) {
      return;
    }

    try {
      const oldIndex = channels.findIndex((item) => item.id === active.id);
      const newIndex = channels.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find channel indices', { oldIndex, newIndex, active, over });
        return;
      }

      // Add categoryName to each channel before reordering
      const channelsWithCategory = channels.map(channel => ({
        ...channel,
        categoryName
      }));

      const newChannels = arrayMove(channelsWithCategory, oldIndex, newIndex);
      console.log('New channel order:', newChannels);
      
      // Update UI immediately for better UX
      setChannels(newChannels);
      
      // Make API call
      console.log('Updating channel order for category:', categoryName);
      await updateChannelOrder(categoryName, newChannels);
      
      toast({
        title: "Success",
        description: "Channel order updated",
      });
    } catch (error) {
      console.error('Error updating channel order:', error);
      // Revert to original order on error
      setChannels(channels);
      toast({
        title: "Error",
        description: "Failed to update channel order",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteChannel(id);
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
      
      // Update the channels list
      if (categoryName) {
        const updatedChannels = await fetchChannels(categoryName);
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

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
  };

  const handleSaveEdit = async () => {
    if (!editingChannel || !categoryName) return;
    
    try {
      await updateChannel(editingChannel.id, editName.trim(), categoryName);
      
      toast({
        title: "Success",
        description: "Channel updated successfully",
      });
      
      // Update the channels list
      const updatedChannels = await fetchChannels(categoryName);
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

  const handleChannelClick = (channelId) => {
    console.log('Channel clicked:', channelId);
    setSelectedChannelId(channelId);
    // Pass the channel ID which is the YouTube channel ID
    onChannelSelected?.(channelId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {!categoryName ? (
          <p className="text-gray-500 text-center py-4">Select a category first</p>
        ) : channels.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No channels found in this category</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={channels.map(channel => channel.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {channels.map((channel) => (
                  <SortableItem
                    key={channel.id}
                    channel={channel}
                    isSelected={channel.id === selectedChannelId}
                    onSelect={handleChannelClick}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelList;
