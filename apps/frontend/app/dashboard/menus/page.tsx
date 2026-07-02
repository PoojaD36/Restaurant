'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { getAllMenus, deleteMenu, getMenuById } from '../../../lib/menus-api';
import { useAuth } from '../../../contexts/auth-context';
import { CreateMenuModal } from '../../../components/create-menu-modal';
import { EditMenuModal } from '../../../components/edit-menu-modal';
import { CreateCategoryModal } from '../../../components/create-category-modal';
import { EditCategoryModal } from '../../../components/edit-category-modal';
import { CreateMenuItemModal } from '../../../components/create-menu-item-modal';
import { EditMenuItemModal } from '../../../components/edit-menu-item-modal';
import { ModifierManagement } from '../../../components/modifier-management';
import type { MenuListItem, Menu, MenuCategory, MenuItem } from '../../../lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Loader2, Trash2, Plus, List, Beef, ChevronRight, ChevronDown, UtensilsCrossed, Edit, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

export default function MenusPage() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MenuListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuListItem | null>(null);
  const [selectedMenuDetail, setSelectedMenuDetail] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMenuForCategory, setSelectedMenuForCategory] = useState<number | null>(null);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedMenuForItem, setSelectedMenuForItem] = useState<number | null>(null);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState<number | null>(null);

  // Edit menu modal
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [selectedMenuForEdit, setSelectedMenuForEdit] = useState<MenuListItem | null>(null);

  // Edit category modal
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<MenuCategory | null>(null);

  // Edit item modal
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<MenuItem | null>(null);

  // Modifier management modal
  const [showModifierManagement, setShowModifierManagement] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'RESTAURANT_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadMenus();
  }, [currentPage]);

  const loadMenus = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAllMenus(currentPage, 10);
      if (response.success && response.data) {
        setMenus(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || 0);
      } else {
        setError(response.message || 'Failed to load menus');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuCreated = () => {
    loadMenus();
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;

    setIsDeleting(true);
    setError('');
    try {
      const response = await deleteMenu(selectedMenu.id);
      if (response.success) {
        setShowDeleteConfirm(false);
        setSelectedMenu(null);
        loadMenus();
      } else {
        setError(response.message || 'Failed to delete menu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenuExpansion = async (menuId: number) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
      setSelectedMenuDetail(null);
    } else {
      newExpanded.add(menuId);
      // Load menu details
      try {
        const response = await getMenuById(menuId);
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      } catch (err) {
        console.error('Failed to load menu details:', err);
      }
    }
    setExpandedMenus(newExpanded);
  };

  const handleAddCategory = (menuId: number) => {
    setSelectedMenuForCategory(menuId);
    setShowCategoryModal(true);
  };

  const handleAddItem = (menuId: number, categoryId: number) => {
    setSelectedMenuForItem(menuId);
    setSelectedCategoryForItem(categoryId);
    setShowItemModal(true);
  };

  const handleCategoryAdded = () => {
    loadMenus();
    // Reload the expanded menu details
    if (selectedMenuForCategory && expandedMenus.has(selectedMenuForCategory)) {
      getMenuById(selectedMenuForCategory).then((response) => {
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      });
    }
  };

  const handleItemAdded = () => {
    loadMenus();
    // Reload the expanded menu details
    if (selectedMenuForItem && expandedMenus.has(selectedMenuForItem)) {
      getMenuById(selectedMenuForItem).then((response) => {
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      });
    }
  };

  const handleEditMenu = (menu: MenuListItem) => {
    setSelectedMenuForEdit(menu);
    setShowEditMenuModal(true);
  };

  const handleMenuEdited = () => {
    loadMenus();
    setShowEditMenuModal(false);
  };

  const handleEditCategory = (menuId: number, category: MenuCategory) => {
    setSelectedMenuForCategory(menuId);
    setSelectedCategoryForEdit(category);
    setShowEditCategoryModal(true);
  };

  const handleCategoryEdited = () => {
    if (selectedMenuForCategory && expandedMenus.has(selectedMenuForCategory)) {
      getMenuById(selectedMenuForCategory).then((response) => {
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      });
    }
    setShowEditCategoryModal(false);
  };

  const handleEditItem = (menuId: number, item: MenuItem) => {
    setSelectedMenuForItem(menuId);
    setSelectedItemForEdit(item);
    setShowEditItemModal(true);
  };

  const handleItemEdited = () => {
    if (selectedMenuForItem && expandedMenus.has(selectedMenuForItem)) {
      getMenuById(selectedMenuForItem).then((response) => {
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      });
    }
    setShowEditItemModal(false);
  };

  const handleManageModifiers = (menuId: number, item: MenuItem) => {
    setSelectedMenuForItem(menuId);
    setSelectedItemForModifiers(item);
    setShowModifierManagement(true);
  };

  const handleModifiersUpdated = () => {
    if (selectedMenuForItem && expandedMenus.has(selectedMenuForItem)) {
      getMenuById(selectedMenuForItem).then((response) => {
        if (response.success && response.data) {
          setSelectedMenuDetail(response.data);
        }
      });
    }
    setShowModifierManagement(false);
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Manage Menus
            </h2>
            <p className="text-slate-600">Create and manage restaurant menus with categories and items.</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Menu
            </Button>
          )}
        </div>

        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
              All Menus
            </CardTitle>
            <CardDescription>Total menus: {totalItems}</CardDescription>
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
            ) : menus.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No menus found. Create your first menu to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {menus.map((menu) => (
                  <div key={menu.id} className="border border-emerald-100 rounded-lg overflow-hidden bg-white">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50 transition-colors"
                      onClick={() => toggleMenuExpansion(menu.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded-lg">
                          <UtensilsCrossed className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{menu.name}</h3>
                          <p className="text-sm text-slate-500">
                            {menu.restaurant?.name} • {menu.categoryCount} categories
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={menu.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={menu.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-500'}
                        >
                          {menu.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMenu(menu);
                          }}
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMenu(menu);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {expandedMenus.has(menu.id) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expandedMenus.has(menu.id) && selectedMenuDetail && (
                      <div className="border-t border-emerald-100 p-4 bg-emerald-50/50">
                        {selectedMenuDetail.categories && selectedMenuDetail.categories.length > 0 ? (
                          <div className="space-y-4">
                            {selectedMenuDetail.categories.map((category: MenuCategory) => (
                              <div key={category.id} className="bg-white rounded-lg p-4 border border-emerald-100">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <List className="h-4 w-4 text-emerald-500" />
                                    <h4 className="font-semibold">{category.name}</h4>
                                    <Badge variant="outline">{category.items?.length || 0} items</Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditCategory(menu.id, category)}
                                      className="h-7 text-slate-600 hover:text-slate-800"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddItem(menu.id, category.id)}
                                      className="h-7"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Item
                                    </Button>
                                  </div>
                                </div>
                                {category.items && category.items.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {category.items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                        {item.imageUrl && (
                                          <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-12 h-12 rounded object-cover"
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{item.name}</p>
                                          <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500">${Number(item.basePrice).toFixed(2)}</p>
                                            <div className="flex gap-1">
                                              {item.isVegetarian && (
                                                <span className="text-xs" title="Vegetarian">🥬</span>
                                              )}
                                              {item.isSpicy && (
                                                <span className="text-xs" title="Spicy">🌶️</span>
                                              )}
                                            </div>
                                          </div>
                                          {item.modifiers && item.modifiers.length > 0 && (
                                            <p className="text-xs text-emerald-500">{item.modifiers.length} modifier{item.modifiers.length > 1 ? 's' : ''}</p>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditItem(menu.id, item)}
                                            className="h-7 w-7 p-0"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleManageModifiers(menu.id, item)}
                                            className="h-7 w-7 p-0"
                                            title="Manage modifiers"
                                          >
                                            <Layers className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => handleAddCategory(menu.id)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Category
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-500">
                            <p className="mb-3">No categories yet. Add your first category to start building the menu.</p>
                            <Button
                              variant="outline"
                              onClick={() => handleAddCategory(menu.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Category
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/90 backdrop-blur p-4 rounded-lg border border-emerald-100 shadow-lg">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({totalItems} total menus)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <CreateMenuModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleMenuCreated}
        />

        <EditMenuModal
          open={showEditMenuModal}
          onClose={() => setShowEditMenuModal(false)}
          onSuccess={handleMenuEdited}
          menuId={selectedMenuForEdit?.id || 0}
          initialName={selectedMenuForEdit?.name || ''}
          initialDescription={selectedMenuForEdit?.description}
          initialStatus={selectedMenuForEdit?.status || 'ACTIVE'}
        />

        <CreateCategoryModal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={handleCategoryAdded}
          menuId={selectedMenuForCategory || 0}
        />

        <EditCategoryModal
          open={showEditCategoryModal}
          onClose={() => setShowEditCategoryModal(false)}
          onSuccess={handleCategoryEdited}
          menuId={selectedMenuForCategory || 0}
          categoryId={selectedCategoryForEdit?.id || 0}
          initialName={selectedCategoryForEdit?.name || ''}
          initialDisplayOrder={selectedCategoryForEdit?.displayOrder || 0}
        />

        <CreateMenuItemModal
          open={showItemModal}
          onClose={() => setShowItemModal(false)}
          onSuccess={handleItemAdded}
          menuId={selectedMenuForItem || 0}
          categoryId={selectedCategoryForItem || 0}
        />

        <EditMenuItemModal
          open={showEditItemModal}
          onClose={() => setShowEditItemModal(false)}
          onSuccess={handleItemEdited}
          menuId={selectedMenuForItem || 0}
          itemData={selectedItemForEdit || {
            id: 0,
            categoryId: 0,
            name: '',
            basePrice: 0,
            isVegetarian: false,
            isSpicy: false,
            status: 'AVAILABLE',
            modifiers: [],
            createdAt: '',
            updatedAt: '',
          }}
        />

        <ModifierManagement
          open={showModifierManagement}
          onClose={() => setShowModifierManagement(false)}
          onSuccess={handleModifiersUpdated}
          menuId={selectedMenuForItem || 0}
          itemData={selectedItemForModifiers || {
            id: 0,
            categoryId: 0,
            name: '',
            basePrice: 0,
            isVegetarian: false,
            isSpicy: false,
            status: 'AVAILABLE',
            modifiers: [],
            createdAt: '',
            updatedAt: '',
          }}
        />

        <Dialog open={showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Menu
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedMenu?.name}</strong>? This will also delete all categories and items in this menu. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteMenu} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Menu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
