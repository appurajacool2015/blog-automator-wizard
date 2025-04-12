
import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories } from '@/utils/dataService';
import { Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface CategoryDropdownProps {
  selectedCategoryId?: string;
  onCategorySelected: (categoryId: string) => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ selectedCategoryId, onCategorySelected }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    const categoryList = getCategories();
    setCategories(categoryList);
    
    // If we have categories but none is selected, select the first one
    if (categoryList.length > 0 && !selectedCategoryId) {
      onCategorySelected(categoryList[0].id);
    }
  }, [selectedCategoryId, onCategorySelected]);

  const handleCategoryChange = (value: string) => {
    onCategorySelected(value);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <Select 
          value={selectedCategoryId} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Categories</SelectLabel>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default CategoryDropdown;
