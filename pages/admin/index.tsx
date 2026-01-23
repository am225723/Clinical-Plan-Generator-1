import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '../_app';
import { requireAdmin } from '@/lib/auth';
import { Profile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { LogOut, Plus, Settings, Users, Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPageProps {
  user: any;
  profile: Profile;
}

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  disabled: boolean;
  created_at: string;
}

export default function AdminDashboard({ user, profile }: AdminPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [editFormData, setEditFormData] = useState({ full_name: '', disabled: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({ title: 'Success', description: 'User created successfully' });
      setCreateDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.id, ...editFormData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      toast({ title: 'Success', description: 'User updated successfully' });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update user', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const openEditDialog = (userItem: UserWithProfile) => {
    setSelectedUser(userItem);
    setEditFormData({ full_name: userItem.full_name || '', disabled: userItem.disabled });
    setEditDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif font-bold text-xl text-slate-800">
            GoldStandard<span className="text-blue-600">Clinical</span>
            <Badge variant="secondary" className="ml-3">Admin</Badge>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} data-testid="button-signout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> User Management
                  </CardTitle>
                  <CardDescription>Create and manage doctor accounts</CardDescription>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-user">
                      <Plus className="h-4 w-4 mr-2" /> Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateUser}>
                      <DialogHeader>
                        <DialogTitle>Create New Doctor</DialogTitle>
                        <DialogDescription>Add a new doctor to the system</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            data-testid="input-create-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password (optional)</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Leave blank for auto-generated"
                            data-testid="input-create-password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            data-testid="input-create-fullname"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting} data-testid="button-submit-create">
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userItem) => (
                        <TableRow key={userItem.id} data-testid={`row-user-${userItem.id}`}>
                          <TableCell className="font-medium">{userItem.full_name || '-'}</TableCell>
                          <TableCell>{userItem.email || userItem.id}</TableCell>
                          <TableCell>
                            <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                              {userItem.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={userItem.disabled ? 'destructive' : 'outline'}>
                              {userItem.disabled ? 'Disabled' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(userItem)}
                              disabled={userItem.id === user.id}
                              data-testid={`button-edit-${userItem.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditUser}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    data-testid="input-edit-fullname"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="disabled">Disable Account</Label>
                  <Switch
                    id="disabled"
                    checked={editFormData.disabled}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, disabled: checked })}
                    data-testid="switch-disabled"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} data-testid="button-submit-edit">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: any) => {
  return requireAdmin(ctx);
};
