'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { getAllUsers } from '../../../lib/users-api';
import type { UserListItem, UserRole } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Mail, Phone, Users, Loader2 } from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESTAURANT_ADMIN: 'Restaurant Admin',
  MANAGER: 'Manager',
  CHEF: 'Chef',
  DELIVERY_AGENT: 'Delivery Agent',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
};

export default function UsersListPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            Manage Users
          </h2>
          <p className="text-slate-600">
            View and manage all users in the system.
          </p>
        </div>

        <Card className="border-orange-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              All Users
            </CardTitle>
            <CardDescription className="text-slate-600">
              Total users: {users.length}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No users found. Create your first user to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-orange-100">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-orange-50">
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName || ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {user.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[user.status]}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
