'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  BarChart3,
  MoreVertical,
  Eye,
  EyeOff,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
  Offer,
  OfferType,
  OfferStatus,
  OfferScope,
  getOfferTypeLabel,
  getOfferStatusLabel,
  getOfferStatusColor,
  getOfferTypeColor,
  getOfferScopeLabel,
  OfferOverview,
  OfferStats,
} from '../../../lib/offer-types';
import {
  getOffers,
  deleteOffer,
  updateOfferStatus,
  getOfferStatsOverview,
  getOfferStats,
} from '../../../lib/offer-api';
import { useAuth } from '../../../contexts/auth-context';
import CreateOfferModal from '../../../components/create-offer-modal';
import EditOfferModal from '../../../components/edit-offer-modal';
import { useRouter } from 'next/navigation';

export default function OffersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OfferOverview | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OfferStatus>(OfferStatus.ACTIVE);
  const [offerStats, setOfferStats] = useState<OfferStats | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchOffers();
    fetchOverview();
  }, [user, currentPage, typeFilter, statusFilter, scopeFilter]);

  useEffect(() => {
    // Filter offers based on search query
    if (searchQuery) {
      const filtered = offers.filter(
        (offer) =>
          offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOffers(filtered);
    } else {
      setFilteredOffers(offers);
    }
  }, [searchQuery, offers]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await getOffers({
        page: currentPage,
        limit: 10,
        type: typeFilter !== 'all' ? (typeFilter as OfferType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as OfferStatus) : undefined,
        scope: scopeFilter !== 'all' ? (scopeFilter as OfferScope) : undefined,
      });

      setOffers(response.data);
      setFilteredOffers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await getOfferStatsOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const handleEdit = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowEditModal(true);
  };

  const handleDelete = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedOffer) return;

    try {
      setActionLoading(true);
      await deleteOffer(selectedOffer.id);
      setShowDeleteDialog(false);
      fetchOffers();
      fetchOverview();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      alert(error.message || 'Failed to delete offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = (offer: Offer, status: OfferStatus) => {
    setSelectedOffer(offer);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOffer) return;

    try {
      setActionLoading(true);
      await updateOfferStatus(selectedOffer.id, newStatus);
      setShowStatusDialog(false);
      fetchOffers();
      fetchOverview();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewStats = async (offer: Offer) => {
    try {
      setSelectedOffer(offer);
      const response = await getOfferStats(offer.id);
      setOfferStats(response.data);
      setShowStatsDialog(true);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      alert(error.message || 'Failed to fetch stats');
    }
  };

  const getActionButtons = (offer: Offer) => {
    const actions = [];

    if (offer.status === OfferStatus.ACTIVE) {
      actions.push(
        <DropdownMenuItem onClick={() => handleStatusChange(offer, OfferStatus.PAUSED)}>
          <Pause className="h-4 w-4 mr-2" />
          Pause Offer
        </DropdownMenuItem>
      );
    } else if (offer.status === OfferStatus.PAUSED || offer.status === OfferStatus.DRAFT) {
      actions.push(
        <DropdownMenuItem onClick={() => handleStatusChange(offer, OfferStatus.ACTIVE)}>
          <Play className="h-4 w-4 mr-2" />
          Activate Offer
        </DropdownMenuItem>
      );
    } else if (offer.status === OfferStatus.EXPIRED) {
      actions.push(
        <DropdownMenuItem onClick={() => handleStatusChange(offer, OfferStatus.ACTIVE)}>
          <Play className="h-4 w-4 mr-2" />
          Reactivate Offer
        </DropdownMenuItem>
      );
    }

    actions.push(
      <DropdownMenuItem onClick={() => handleViewStats(offer)}>
        <BarChart3 className="h-4 w-4 mr-2" />
        View Statistics
      </DropdownMenuItem>
    );

    return actions;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (offer: Offer) => {
    return new Date(offer.endDate) < new Date();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen from-emerald-50 via-teal-50 to-green-50 bg-gradient-to-br p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offers Management</h1>
            <p className="text-gray-600 mt-1">Create and manage discount offers</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="p-4 border-emerald-200">
              <div className="text-2xl font-bold text-gray-900">{overview.total}</div>
              <div className="text-sm text-gray-600">Total Offers</div>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50">
              <div className="text-2xl font-bold text-emerald-600">{overview.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </Card>
            <Card className="p-4 border-gray-200">
              <div className="text-2xl font-bold text-gray-700">{overview.draft}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50">
              <div className="text-2xl font-bold text-amber-600">{overview.scheduled}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </Card>
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="text-2xl font-bold text-red-600">{overview.expired}</div>
              <div className="text-sm text-gray-600">Expired</div>
            </Card>
            <Card className="p-4 border-purple-200 bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((overview.active / (overview.total || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Active Rate</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6 border-emerald-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search offers by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-300">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={OfferType.PERCENTAGE}>{getOfferTypeLabel(OfferType.PERCENTAGE)}</SelectItem>
                <SelectItem value={OfferType.FIXED}>{getOfferTypeLabel(OfferType.FIXED)}</SelectItem>
                <SelectItem value={OfferType.FREE_DELIVERY}>{getOfferTypeLabel(OfferType.FREE_DELIVERY)}</SelectItem>
                <SelectItem value={OfferType.BUY_ONE_GET_ONE}>{getOfferTypeLabel(OfferType.BUY_ONE_GET_ONE)}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={OfferStatus.ACTIVE}>{getOfferStatusLabel(OfferStatus.ACTIVE)}</SelectItem>
                <SelectItem value={OfferStatus.DRAFT}>{getOfferStatusLabel(OfferStatus.DRAFT)}</SelectItem>
                <SelectItem value={OfferStatus.PAUSED}>{getOfferStatusLabel(OfferStatus.PAUSED)}</SelectItem>
                <SelectItem value={OfferStatus.SCHEDULED}>{getOfferStatusLabel(OfferStatus.SCHEDULED)}</SelectItem>
                <SelectItem value={OfferStatus.EXPIRED}>{getOfferStatusLabel(OfferStatus.EXPIRED)}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-300">
                <SelectValue placeholder="Filter by scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value={OfferScope.PUBLIC}>{getOfferScopeLabel(OfferScope.PUBLIC)}</SelectItem>
                <SelectItem value={OfferScope.RESTAURANT}>{getOfferScopeLabel(OfferScope.RESTAURANT)}</SelectItem>
                <SelectItem value={OfferScope.OUTLET}>{getOfferScopeLabel(OfferScope.OUTLET)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Offers List */}
        <Card className="border-emerald-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading offers...</div>
          ) : filteredOffers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No offers found matching your search.' : 'No offers yet. Create your first offer!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Offer Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Code</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Value</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Validity</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Usage</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer, index) => (
                    <tr key={offer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">{offer.name}</div>
                          {offer.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{offer.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{offer.code}</code>
                      </td>
                      <td className="p-4">
                        <Badge className={getOfferTypeColor(offer.type)}>{getOfferTypeLabel(offer.type)}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {offer.type === OfferType.PERCENTAGE && (
                            <span>{offer.percentageValue}% off</span>
                          )}
                          {offer.type === OfferType.FIXED && (
                            <span>₹{offer.fixedAmountValue} off</span>
                          )}
                          {offer.type === OfferType.FREE_DELIVERY && (
                            <span>Free Delivery</span>
                          )}
                          {offer.type === OfferType.BUY_ONE_GET_ONE && (
                            <span>BOGO</span>
                          )}
                        </div>
                        {offer.maxDiscountAmount && (
                          <div className="text-xs text-gray-500">Max: ₹{offer.maxDiscountAmount}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge className={getOfferStatusColor(offer.status)}>
                          {getOfferStatusLabel(offer.status)}
                        </Badge>
                        {isExpired(offer) && offer.status !== OfferStatus.EXPIRED && (
                          <div className="text-xs text-red-500 mt-1">Expired</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="h-3 w-3" />
                            {formatDate(offer.startDate)}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(offer.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="text-gray-900">{offer.currentUses || 0} used</div>
                          {offer.maxUses && (
                            <div className="text-gray-500">of {offer.maxUses}</div>
                          )}
                          {!offer.maxUses && (
                            <div className="text-gray-500">unlimited</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(offer)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {getActionButtons(offer)}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(offer)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Offer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-emerald-200"
            >
              Previous
            </Button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages} ({total} offers)
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-emerald-200"
            >
              Next
            </Button>
          </div>
        )}
      </motion.div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchOffers();
          fetchOverview();
        }}
      />

      {/* Edit Offer Modal */}
      <EditOfferModal
        open={showEditModal}
        offer={selectedOffer}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOffer(null);
          fetchOffers();
          fetchOverview();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedOffer?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Offer Status</DialogTitle>
            <DialogDescription>
              Change status of &quot;{selectedOffer?.name}&quot; to &quot;{getOfferStatusLabel(newStatus)}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={actionLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              {actionLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Statistics</DialogTitle>
            <DialogDescription>{selectedOffer?.name}</DialogDescription>
          </DialogHeader>
          {offerStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">{offerStats.totalUses}</div>
                  <div className="text-sm text-gray-600">Total Uses</div>
                </Card>
                <Card className="p-4 border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{offerStats.uniqueCustomers}</div>
                  <div className="text-sm text-gray-600">Unique Customers</div>
                </Card>
                <Card className="p-4 border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">₹{offerStats.totalDiscountGiven}</div>
                  <div className="text-sm text-gray-600">Total Discount</div>
                </Card>
                <Card className="p-4 border-teal-200">
                  <div className="text-2xl font-bold text-teal-600">₹{offerStats.averageOrderValue}</div>
                  <div className="text-sm text-gray-600">Avg Order Value</div>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3 border-blue-200 bg-blue-50">
                  <div className="text-lg font-bold text-blue-600">{offerStats.usesLast7Days}</div>
                  <div className="text-xs text-gray-600">Last 7 Days</div>
                </Card>
                <Card className="p-3 border-green-200 bg-green-50">
                  <div className="text-lg font-bold text-green-600">{offerStats.usesLast30Days}</div>
                  <div className="text-xs text-gray-600">Last 30 Days</div>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)} className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
