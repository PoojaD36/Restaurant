'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { getAllRestaurants, deleteRestaurant, getRestaurantById } from '../../../lib/restaurants-api';
import type { RestaurantListItem, RestaurantDetail } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Building2, MapPin, Users, Loader2, Trash2, UserPlus, Edit } from 'lucide-react';
import { CreateRestaurantModal } from '../../../components/create-restaurant-modal';
import { AddRestaurantUserModal } from '../../../components/add-restaurant-user-modal';
import { EditRestaurantModal } from '../../../components/edit-restaurant-modal';
import { useAuth } from '../../../contexts/auth-context';

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function RestaurantsListPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantListItem | null>(null);
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] = useState<RestaurantDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_ADMIN';

  useEffect(() => {
    loadRestaurants();
  }, [currentPage, user?.role]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAllRestaurants(currentPage, 10);
      setRestaurants(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRestaurants(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddUserModal = (restaurant: RestaurantListItem) => {
    setSelectedRestaurant(restaurant);
    setShowAddUserModal(true);
  };

  const handleCloseAddUserModal = () => {
    setSelectedRestaurant(null);
    setShowAddUserModal(false);
  };

  const handleRestaurantCreated = () => {
    loadRestaurants();
  };

  const handleUserAdded = () => {
    loadRestaurants();
  };

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;

    setIsDeleting(true);
    setError('');
    try {
      await deleteRestaurant(selectedRestaurant.id);
      setShowDeleteConfirm(false);
      setSelectedRestaurant(null);
      loadRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete restaurant');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteConfirm = (restaurant: RestaurantListItem) => {
    if (user?.role !== 'SUPER_ADMIN') return;
    setSelectedRestaurant(restaurant);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setSelectedRestaurant(null);
    setShowDeleteConfirm(false);
  };

  const handleOpenEditModal = async (restaurant: RestaurantListItem) => {
    try {
      const response = await getRestaurantById(restaurant.id);
      if (response.success && response.data) {
        setSelectedRestaurantDetail(response.data);
        setShowEditModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant details');
    }
  };

  const handleCloseEditModal = () => {
    setSelectedRestaurantDetail(null);
    setShowEditModal(false);
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'RESTAURANT_ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
              {user?.role === 'RESTAURANT_ADMIN' ? 'My Restaurants' : 'Manage Restaurants'}
            </h2>
            <p className="text-slate-600">
              {user?.role === 'RESTAURANT_ADMIN'
                ? 'View and manage your assigned restaurants.'
                : 'View and manage all restaurants in the system.'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg shadow-red-500/30"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create Restaurant
            </Button>
          )}
        </div>

        <Card className="border-orange-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              {user?.role === 'RESTAURANT_ADMIN' ? 'My Restaurants' : 'All Restaurants'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              Total restaurants: {totalRestaurants}
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
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No restaurants found. Create your first restaurant to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-orange-100">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Slug</TableHead>
                      <TableHead className="font-semibold">Outlets</TableHead>
                      <TableHead className="font-semibold">Users</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants.map((restaurant) => (
                      <TableRow key={restaurant.id} className="border-orange-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {restaurant.logo && (
                              <img
                                src={restaurant.logo}
                                alt={restaurant.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            {restaurant.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-mono text-sm">
                          {restaurant.slug}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="h-3 w-3" />
                            {restaurant.outletsCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Users className="h-3 w-3" />
                            {restaurant.usersCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[restaurant.status]}>
                            {restaurant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(restaurant.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAddUserModal(restaurant)}
                                className="text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                                title="Add User"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(restaurant)}
                                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                title="Edit Restaurant"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {user?.role === 'SUPER_ADMIN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteConfirm(restaurant)}
                                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                                title="Delete Restaurant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
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
          <div className="flex items-center justify-between bg-white/90 backdrop-blur p-4 rounded-lg border border-orange-100 shadow-lg">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({totalRestaurants} total restaurants)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-orange-200 text-slate-700 hover:bg-orange-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-orange-200 text-slate-700 hover:bg-orange-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create Restaurant Modal */}
        <CreateRestaurantModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRestaurantCreated}
        />

        {/* Add User Modal */}
        {selectedRestaurant && (
          <AddRestaurantUserModal
            open={showAddUserModal}
            onClose={handleCloseAddUserModal}
            onSuccess={handleUserAdded}
            restaurant={selectedRestaurant}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={handleCloseDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Restaurant
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedRestaurant?.name}</strong>? This will also delete all outlets and users associated with this restaurant. This action cannot be undone.
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
                onClick={handleDeleteRestaurant}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Restaurant'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Restaurant Modal */}
        <EditRestaurantModal
          open={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleRestaurantCreated}
          restaurant={selectedRestaurantDetail}
        />
      </div>
    </ProtectedRoute>
  );
}
