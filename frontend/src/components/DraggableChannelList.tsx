/**
 * DraggableChannelList component - A specialized version of ChannelList for the homepage
 * that provides drag-and-drop reordering functionality without admin features.
 * 
 * Features:
 * - Drag and drop channel reordering with DndKit
 * - Real-time order updates to backend
 * - Visual feedback during drag operations
 * - Touch-friendly with configurable drag constraints
 * - Channel selection for video viewing
 * 
 * Props:
 * - categoryName: ID of the current category
 * - onChannelSelected: Callback when a channel is selected
 */
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
import { useToast } from "@/components/ui/use-toast";
import { Youtube } from "lucide-react";
import { fetchChannels, updateChannelOrder } from '@/utils/apiService';
import { Channel } from '@/types';

// SortableItem component specifically for dragging
const SortableItem = ({ channel, isSelected, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: channel.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none'
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-blue-50 border-blue-300' : ''
      }`}
      onClick={() => !isDragging && onSelect(channel.id)}
    >
      <div className="flex items-center gap-2 flex-1" {...attributes} {...listeners}>
        <Youtube size={16} className="text-red-500" />
        <span className="font-medium select-none">
          {channel.name}
        </span>
      </div>
    </li>
  );
};

const DraggableChannelList = ({ 
  categoryName, 
  onChannelSelected
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Increased distance threshold
        delay: 100,  // Added small delay
        tolerance: 5,
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
        setChannels(channelsList);
        
        if (channelsList.length > 0 && !selectedChannelId) {
          setSelectedChannelId(channelsList[0].id);
          onChannelSelected?.(channelsList[0].id);
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
  }, [categoryName]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event) => {
    setIsDragging(false);
    const { active, over } = event;
    
    if (!active || !over || active.id === over.id || !categoryName) {
      return;
    }

    try {
      const oldIndex = channels.findIndex((item) => item.id === active.id);
      const newIndex = channels.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newChannels = arrayMove(channels, oldIndex, newIndex);
      setChannels(newChannels);
      
      await updateChannelOrder(categoryName, newChannels);
      
      toast({
        title: "Success",
        description: "Channel order updated",
      });
    } catch (error) {
      setChannels(channels);
      toast({
        title: "Error",
        description: "Failed to update channel order",
        variant: "destructive",
      });
    }
  };

  const handleChannelClick = (channelId: string) => {
    if (!isDragging) {
      setSelectedChannelId(channelId);
      onChannelSelected?.(channelId);
    }
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
            onDragStart={handleDragStart}
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

export default DraggableChannelList;