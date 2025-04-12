
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
import { Trash, Edit, Folder } from "lucide-react";
import { getCategories, deleteCategory, updateCategory } from '@/utils/dataService';
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
    const fetchCategories = () => {
      const categoriesList = getCategories();
      setCategories(categoriesList);
      
      // Select the first category if none is selected
      if (categoriesList.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesList[0].id);
        onCategorySelected?.(categoriesList[0].id);
      }
    };
    
    fetchCategories();
  }, [refreshTrigger, onCategorySelected, selectedCategoryId]);

  const handleDelete = (id: string) => {
    try {
      const success = deleteCategory(id);
      
      if (success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        
        // Update the categories list
        setCategories(getCategories());
        
        // If the deleted category was selected, select the first available one
        if (id === selectedCategoryId) {
          const remainingCategories = getCategories();
          if (remainingCategories.length > 0) {
            setSelectedCategoryId(remainingCategories[0].id);
            onCategorySelected?.(remainingCategories[0].id);
          } else {
            setSelectedCategoryId(null);
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editingCategory) return;
    
    try {
      const updatedCategory = { ...editingCategory, name: editName.trim() };
      updateCategory(updatedCategory);
      
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      
      setCategories(getCategories());
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
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                {editingCategory?.id === category.id ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
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
                  <div 
                    className={`flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
                      category.id === selectedCategoryId ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder size={18} className="text-brand-blue" />
                      <span>{category.name}</span>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
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
                                This will delete the category and all associated channels.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(category.id)}
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

export default CategoryList;
