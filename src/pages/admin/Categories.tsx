import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCategories() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        // Check if category name or slug already exists
        const { data: existingCategory } = await supabase
          .from('product_categories')
          .select('id')
          .or(`name.eq.${formData.name.trim()},slug.eq.${formData.slug.trim()}`)
          .single();

        if (existingCategory) {
          throw new Error('A category with this name or slug already exists');
        }

        const { error } = await supabase.from('product_categories').insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        is_active: true,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if any products are using this category
      const { data: productsUsingCategory } = await supabase
        .from('products')
        .select('id, name')
        .eq('category_id', categoryId);

      if (productsUsingCategory && productsUsingCategory.length > 0) {
        const productNames = productsUsingCategory.map(p => p.name).join(', ');
        throw new Error(`Cannot delete category. It is being used by ${productsUsingCategory.length} product(s): ${productNames}`);
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active,
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      is_active: true,
    });
  };

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={handleCancel} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>

          <h1 className="text-3xl font-bold mb-8">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="URL-friendly identifier"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used in URLs. Auto-generated from name but can be customized.
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description (optional)"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={createCategoryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createCategoryMutation.mutate()}
                  disabled={createCategoryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createCategoryMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category) => {
              const CategoryIcon = getCategoryIcon(category.name);
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CategoryIcon className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              category.is_active ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                        className="h-8 w-8"
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.description ? (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(category.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {categories && categories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground mb-4">No categories found</div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
