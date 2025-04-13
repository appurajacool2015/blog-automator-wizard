
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash, Edit, Folder } from "lucide-react";
import { fetchCategories, deleteCategory, createCategory, updateCategory } from '@/utils/apiService';
import { Category } from '@/types';
import { Input } from '@/components/ui/input';

interface CategoryListProps {
  onCategorySelected?: (categoryId: string) => void;
  refreshTrigger?: number;
  isAdmin?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({ 
  onCategorySelected, 
  refreshTrigger = 0, 
  isAdmin = false 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesList = await fetchCategories();
        setCategories(categoriesList);
        
        // Select the first category if none is selected
        if (categoriesList.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(categoriesList[0].id);
          onCategorySelected?.(categoriesList[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        });
      }
    };
    
    loadCategories();
  }, [refreshTrigger, onCategorySelected, selectedCategoryId]);

  const handleDelete = async (name: string) => {
    try {
      await deleteCategory(name);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      // Refresh the categories list
      const categoriesList = await fetchCategories();
      setCategories(categoriesList);
      
      // If the deleted category was selected, select the first available one
      if (name === selectedCategoryId) {
        if (categoriesList.length > 0) {
          setSelectedCategoryId(categoriesList[0].id);
          onCategorySelected?.(categoriesList[0].id);
        } else {
          setSelectedCategoryId(null);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    
    try {
      await updateCategory(editingCategory.name, editName.trim());
      
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      
      const categoriesList = await fetchCategories();
      setCategories(categoriesList);
      setEditingCategory(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    onCategorySelected?.(categoryId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No categories found</p>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedCategoryId || undefined}
              onValueChange={handleCategoryClick}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <Folder size={18} className="text-brand-blue" />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && selectedCategoryId && (
              <div className="flex justify-end gap-2">
                {editingCategory ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(categories.find(c => c.id === selectedCategoryId)!)}
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600">
                          <Trash size={16} className="mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the category and all associated channels.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                              const category = categories.find(c => c.id === selectedCategoryId);
                              if (category) handleDelete(category.name);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryList;
