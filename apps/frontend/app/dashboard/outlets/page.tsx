'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { getAllOutlets, deleteOutlet } from '../../../lib/outlets-api';
import { getMyRestaurants } from '../../../lib/restaurants-api';
import type { OutletListItem, Restaurant } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { MapPin, Loader2, Trash2, Phone, Mail, Clock, Building2, Users, Pencil } from 'lucide-react';
import { CreateOutletModal } from '../../../components/create-outlet-modal';
import { AddOutletUserModal } from '../../../components/add-outlet-user-modal';
import { EditOutletModal } from '../../../components/edit-outlet-modal';
import { useAuth } from '../../../contexts/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
  CLOSED: 'bg-red-100 text-red-700 border-red-200',
};

export default function OutletsListPage() {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<OutletListItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<OutletListItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOutlets, setTotalOutlets] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_ADMIN';

  useEffect(() => {
    loadRestaurants();
  }, [user]);

  useEffect(() => {
    loadOutlets();
  }, [currentPage, selectedRestaurant]);

  const loadRestaurants = async () => {
    if (user?.role === 'SUPER_ADMIN') {
      try {
        const response = await getMyRestaurants();
        setRestaurants(response.data || []);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      }
    }
  };

  const loadOutlets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const restaurantId = selectedRestaurant !== 'all' ? parseInt(selectedRestaurant) : undefined;
      const response = await getAllOutlets(currentPage, 10, restaurantId);
      setOutlets(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalOutlets(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutletCreated = () => {
    loadOutlets();
  };

  const handleDeleteOutlet = async () => {
    if (!selectedOutlet) return;

    setIsDeleting(true);
    setError('');
    try {
      await deleteOutlet(selectedOutlet.id);
      setShowDeleteConfirm(false);
      setSelectedOutlet(null);
      loadOutlets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete outlet');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteConfirm = (outlet: OutletListItem) => {
    if (!canDelete) return;
    setSelectedOutlet(outlet);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setSelectedOutlet(null);
    setShowDeleteConfirm(false);
  };

  const handleOpenUserModal = (outlet: OutletListItem) => {
    setSelectedOutlet(outlet);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setSelectedOutlet(null);
    setShowUserModal(false);
  };

  const handleOpenEditModal = (outlet: OutletListItem) => {
    setSelectedOutlet(outlet);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setSelectedOutlet(null);
    setShowEditModal(false);
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'RESTAURANT_ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {user?.role === 'RESTAURANT_ADMIN' ? 'My Outlets' : 'Manage Outlets'}
            </h2>
            <p className="text-slate-600">
              {user?.role === 'RESTAURANT_ADMIN'
                ? 'View and manage outlets for your restaurants.'
                : 'View and manage all restaurant outlets.'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Create Outlet
            </Button>
          )}
        </div>

        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                {user?.role === 'RESTAURANT_ADMIN' ? 'My Outlets' : 'All Outlets'}
              </div>
              {user?.role === 'SUPER_ADMIN' && restaurants.length > 0 && (
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Restaurants</SelectItem>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardTitle>
            <CardDescription className="text-slate-600">
              Total outlets: {totalOutlets}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : outlets.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No outlets found. Create your first outlet to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-100">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Restaurant</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Hours</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      {canDelete && <TableHead className="font-semibold">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outlets.map((outlet) => (
                      <TableRow key={outlet.id} className="border-emerald-50">
                        <TableCell className="font-medium">{outlet.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Building2 className="h-3 w-3" />
                            {outlet.restaurant.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            <div>{outlet.city}, {outlet.state}</div>
                            <div className="text-xs text-slate-500">{outlet.country}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {outlet.phone && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Phone className="h-3 w-3" />
                                {outlet.phone}
                              </div>
                            )}
                            {outlet.email && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Mail className="h-3 w-3" />
                                {outlet.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Clock className="h-3 w-3" />
                            {outlet.openingTime && outlet.closingTime
                              ? `${outlet.openingTime} - ${outlet.closingTime}`
                              : 'Not set'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[outlet.status]}>
                            {outlet.status}
                          </Badge>
                        </TableCell>
                        {canDelete && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(outlet)}
                                className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                                title="Edit Outlet"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenUserModal(outlet)}
                                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                title="Manage Users"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteConfirm(outlet)}
                                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                                title="Delete Outlet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/90 backdrop-blur p-4 rounded-lg border border-emerald-100 shadow-lg">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({totalOutlets} total outlets)
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

        {/* Create Outlet Modal */}
        <CreateOutletModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleOutletCreated}
        />

        {/* Edit Outlet Modal */}
        <EditOutletModal
          open={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleOutletCreated}
          outletId={selectedOutlet?.id || null}
        />

        {/* Outlet User Management Modal */}
        <AddOutletUserModal
          open={showUserModal}
          onClose={handleCloseUserModal}
          onSuccess={handleOutletCreated}
          outlet={selectedOutlet}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={handleCloseDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Outlet
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedOutlet?.name}</strong>? This action cannot be undone.
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
                onClick={handleDeleteOutlet}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Outlet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
