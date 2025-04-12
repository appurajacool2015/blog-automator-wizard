
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addChannel, getCategories } from '@/utils/dataService';
import { Category } from '@/types';

interface ChannelFormProps {
  onChannelAdded: () => void;
}

const ChannelForm: React.FC<ChannelFormProps> = ({ onChannelAdded }) => {
  const [channelName, setChannelName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim() || !channelId.trim() || !categoryId) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addChannel(channelName.trim(), channelId.trim(), categoryId);
      setChannelName('');
      setChannelId('');
      toast({
        title: "Success",
        description: "Channel added successfully",
      });
      onChannelAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add channel",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-md border">
      <h3 className="text-lg font-medium">Add New Channel</h3>
      
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          disabled={isSubmitting}
        />
        
        <Input
          type="text"
          placeholder="Channel ID (e.g., UCvJJ_dzjViJCoLf5uKUTwoA)"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={isSubmitting}
        />
        
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button type="submit" className="w-full" disabled={isSubmitting || categories.length === 0}>
          {isSubmitting ? 'Adding...' : 'Add Channel'}
        </Button>
        
        {categories.length === 0 && (
          <p className="text-sm text-red-500">Please add at least one category first</p>
        )}
      </div>
    </form>
  );
};

export default ChannelForm;
