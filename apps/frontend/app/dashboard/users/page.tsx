'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { getAllUsers } from '../../../lib/users-api';
import type { UserListItem, UserRole } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Mail, Phone, Users, Loader2, Key, UserPlus, Pencil, Trash2, Filter, X } from 'lucide-react';
import { ChangePasswordModal } from '../../../components/change-password-modal';
import { CreateUserModal } from '../../../components/create-user-modal';
import { EditUserModal } from '../../../components/edit-user-modal';
import { deleteUser } from '../../../lib/users-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

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
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadUsers(isInitialLoad);
  }, [currentPage, roleFilter, statusFilter]);

  const loadUsers = async (showInitialLoader = false) => {
    if (showInitialLoader) {
      setIsLoading(true);
    } else {
      setIsFiltering(true);
    }
    setError('');
    try {
      const response = await getAllUsers(
        currentPage,
        10,
        roleFilter || undefined,
        statusFilter || undefined
      );
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalUsers(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
      setIsInitialLoad(false);
    }
  };

  const handleOpenChangePasswordModal = (user: UserListItem) => {
    setSelectedUser(user);
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setSelectedUser(null);
    setShowChangePasswordModal(false);
  };

  const handleOpenEditModal = (user: UserListItem) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUser(null);
    setShowEditUserModal(false);
  };

  const handleUserCreated = () => {
    setIsInitialLoad(true);
    loadUsers(true);
  };

  const handleUserUpdated = () => {
    setIsInitialLoad(true);
    loadUsers(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    setError('');
    try {
      await deleteUser(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      setIsInitialLoad(true);
      loadUsers(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteConfirm = (user: UserListItem) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setSelectedUser(null);
    setShowDeleteConfirm(false);
  };

  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Manage Users
            </h2>
            <p className="text-slate-600">
              View and manage all users in the system.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateUserModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              All Users
            </CardTitle>
            <CardDescription className="text-slate-600">
              Total users: {totalUsers}
            </CardDescription>
          </CardHeader>

          {/* Filters */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="role-filter" className="text-sm text-slate-600">Role:</label>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="role-filter" className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="RESTAURANT_ADMIN">Restaurant Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="CHEF">Chef</SelectItem>
                    <SelectItem value="DELIVERY_AGENT">Delivery Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="status-filter" className="text-sm text-slate-600">Status:</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="status-filter" className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(roleFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoleFilter('');
                    setStatusFilter('');
                    setCurrentPage(1);
                  }}
                  className="text-slate-600 hover:text-emerald-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
              <div className="relative">
                <div className={`overflow-x-auto transition-opacity duration-200 ${isFiltering ? 'opacity-40' : 'opacity-100'}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-emerald-100">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Phone</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-emerald-50">
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
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
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
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(user)}
                                className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                                title="Edit User"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenChangePasswordModal(user)}
                                className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                                title="Change Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteConfirm(user)}
                                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {isFiltering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-emerald-100 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-slate-600 font-medium">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/90 backdrop-blur p-4 rounded-lg border border-emerald-100 shadow-lg">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({totalUsers} total users)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-emerald-200 text-slate-700 hover:bg-emerald-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-emerald-200 text-slate-700 hover:bg-emerald-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          open={showChangePasswordModal}
          onClose={handleCloseChangePasswordModal}
          userId={selectedUser?.id}
          userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : undefined}
        />

        {/* Create User Modal */}
        <CreateUserModal
          open={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={handleUserCreated}
        />

        {/* Edit User Modal */}
        {selectedUser && (
          <EditUserModal
            open={showEditUserModal}
            onClose={handleCloseEditModal}
            onSuccess={handleUserUpdated}
            user={selectedUser}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={handleCloseDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : 'this user'}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCloseDeleteConfirm}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
