import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user?.id,
            full_name: fullName.trim(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Display */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="p-3 bg-muted rounded-md text-muted-foreground">
                  {user?.email}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      type="text"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveName}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          fetchUserProfile();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-foreground">
                      {fullName || 'Not set'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium mb-2">User ID</label>
                <div className="p-3 bg-muted rounded-md text-muted-foreground text-sm break-all">
                  {user?.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
