import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const isUserAdmin = (user: any) => !!user?.user_roles?.some((r: any) => r.role === 'admin');
  const [isAdminChecked, setIsAdminChecked] = useState(false);

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      return profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      }));
    },
  });

  const [query, setQuery] = useState('');
  const filteredUsers = (users || []).filter((u: any) => {
    const hay = `${u.email || ''} ${u.full_name || ''}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const addAdminRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role granted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to grant admin role'),
  });

  const removeAdminRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').delete().match({ user_id: userId, role: 'admin' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role revoked');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to revoke admin role'),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">User Management</h1>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>All Users</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.user_roles?.map((role: any, idx: number) => (
                          <Badge key={idx} variant={role.role === 'admin' ? 'default' : 'secondary'}>
                            {role.role}
                          </Badge>
                        ))}
                        {(!user.user_roles || user.user_roles.length === 0) && (
                          <Badge variant="secondary">customer</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog open={open && selectedUser?.id === user.id} onOpenChange={(o) => { setOpen(o); if (!o) setSelectedUser(null); }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsAdminChecked(isUserAdmin(user));
                                setOpen(true);
                              }}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage {user.email}</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center justify-between py-4">
                              <div>
                                <p className="font-medium">Admin Access</p>
                                <p className="text-sm text-muted-foreground">Allow this user to access the admin dashboard</p>
                              </div>
                              <Switch
                                checked={isAdminChecked}
                                onCheckedChange={(val) => setIsAdminChecked(val)}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  if (!selectedUser) return;
                                  try {
                                    const uid = selectedUser.id;
                                    // Remove roles
                                    const { error: rolesErr } = await supabase.from('user_roles').delete().match({ user_id: uid });
                                    if (rolesErr) throw rolesErr;
                                    // Remove profile
                                    const { error: profErr } = await supabase.from('profiles').delete().match({ id: uid });
                                    if (profErr) throw profErr;
                                    toast.success('User removed');
                                    setOpen(false);
                                    setSelectedUser(null);
                                    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                                  } catch (e: any) {
                                    toast.error(e?.message || 'Failed to remove user');
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setOpen(false);
                                  setSelectedUser(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (!selectedUser) return;
                                  try {
                                    if (isAdminChecked && !isUserAdmin(selectedUser)) {
                                      await addAdminRole.mutateAsync(selectedUser.id);
                                    } else if (!isAdminChecked && isUserAdmin(selectedUser)) {
                                      await removeAdminRole.mutateAsync(selectedUser.id);
                                    }
                                    setOpen(false);
                                    setSelectedUser(null);
                                  } catch {}
                                }}
                                disabled={addAdminRole.isPending || removeAdminRole.isPending}
                              >
                                Save
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
