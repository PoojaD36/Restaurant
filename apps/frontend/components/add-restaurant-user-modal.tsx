'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Loader2, UserPlus, X } from 'lucide-react';
import { addUserToRestaurant, getRestaurantUsers } from '../lib/restaurants-api';
import { getAllUsers } from '../lib/users-api';
import type { RestaurantListItem, RestaurantUser } from '../lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/auth-context';

interface AddRestaurantUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurant: RestaurantListItem;
}

export function AddRestaurantUserModal({
  open,
  onClose,
  onSuccess,
  restaurant,
}: AddRestaurantUserModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [currentUsers, setCurrentUsers] = useState<RestaurantUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadAvailableUsers();
      loadCurrentUsers();
      setSelectedUserId('');
      setError('');
    }
  }, [open, restaurant.id]);

  const loadAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await getAllUsers(1, 100);
      // Filter out SUPER_ADMIN and users who are already in this restaurant
      const filtered = response.data.filter(
        (u) => u.role !== 'SUPER_ADMIN' && u.role !== 'RESTAURANT_ADMIN'
      );
      setAvailableUsers(filtered);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCurrentUsers = async () => {
    try {
      const response = await getRestaurantUsers(restaurant.id);
      setCurrentUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load restaurant users:', err);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await addUserToRestaurant(restaurant.id, { userId: parseInt(selectedUserId) });
      onSuccess();
      setSelectedUserId('');
      loadCurrentUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user to restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this restaurant?`)) return;

    setIsLoading(true);
    setError('');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restaurant.id}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      onSuccess();
      loadCurrentUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CHEF':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELIVERY_AGENT':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'Manager';
      case 'CHEF':
        return 'Chef';
      case 'DELIVERY_AGENT':
        return 'Delivery Agent';
      default:
        return role;
    }
  };

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'RESTAURANT_ADMIN';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-orange-500" />
            Manage Restaurant Users
          </DialogTitle>
          <DialogDescription>
            Add or remove users from <strong>{restaurant.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current Users */}
          <div className="space-y-2">
            <Label>Current Users ({currentUsers.length})</Label>
            <div className="border border-orange-100 rounded-lg p-3 bg-slate-50 max-h-40 overflow-y-auto">
              {currentUsers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">No users added yet</p>
              ) : (
                <div className="space-y-2">
                  {currentUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between bg-white p-2 rounded border border-orange-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {u.firstName} {u.lastName || ''}
                        </span>
                        <Badge variant="outline" className={getRoleBadgeColor(u.role)}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(u.id, `${u.firstName} ${u.lastName || ''}`)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add New User */}
          {canManage && (
            <div className="space-y-2">
              <Label htmlFor="user-select">Add User</Label>
              {isLoadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No available users. Create users (Manager, Chef, Delivery Agent) first.
                </p>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName || ''} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddUser}
                    disabled={!selectedUserId || isLoading}
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
