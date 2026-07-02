'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Layers, Plus, Edit, Trash2, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import {
  deleteModifierGroup,
  deleteModifierOption,
} from '@/lib/menus-api';
import { CreateModifierGroupModal } from '@/components/create-modifier-group-modal';
import { EditModifierGroupModal } from '@/components/edit-modifier-group-modal';
import { CreateModifierOptionModal } from '@/components/create-modifier-option-modal';
import { EditModifierOptionModal } from '@/components/edit-modifier-option-modal';
import type { MenuItem, ModifierGroup, ModifierOption } from '@/lib/types';

interface ModifierManagementProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId: number;
  itemData: MenuItem;
}

export function ModifierManagement({
  open,
  onClose,
  onSuccess,
  menuId,
  itemData,
}: ModifierManagementProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // 'group-{id}' or 'option-{id}'
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);
  const [createOptionModalOpen, setCreateOptionModalOpen] = useState(false);
  const [editOptionModalOpen, setEditOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ModifierOption | null>(null);
  const [error, setError] = useState('');

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this modifier group? All options will also be deleted.')) {
      return;
    }

    setIsDeleting(`group-${groupId}`);
    setError('');

    try {
      const response = await deleteModifierGroup(menuId, groupId);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to delete modifier group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete modifier group');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteOption = async (groupId: number, optionId: number) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return;
    }

    setIsDeleting(`option-${optionId}`);
    setError('');

    try {
      const response = await deleteModifierOption(menuId, groupId, optionId);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to delete option');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete option');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditGroupModal = (group: ModifierGroup) => {
    setSelectedGroup(group);
    setEditGroupModalOpen(true);
  };

  const openCreateOptionModal = (groupId: number) => {
    setSelectedGroup(itemData.modifiers.find((g) => g.id === groupId) || null);
    setCreateOptionModalOpen(true);
  };

  const openEditOptionModal = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedGroup(group);
    setSelectedOption(option);
    setEditOptionModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Layers className="h-5 w-5 text-emerald-500" />
              Manage Modifiers
            </DialogTitle>
            <DialogDescription>
              Manage modifier groups and options for <strong>{itemData.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Add Modifier Group Button */}
            <Button
              onClick={() => setCreateGroupModalOpen(true)}
              className="w-full border-dashed border-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Modifier Group
            </Button>

            {/* Modifier Groups List */}
            {itemData.modifiers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No modifier groups yet</p>
                <p className="text-sm">Add a modifier group to start customizing this item</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itemData.modifiers.map((group) => (
                  <div
                    key={group.id}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          {expandedGroups.has(group.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-sm">{group.name}</div>
                          <div className="text-xs text-slate-500">
                            {group.type === 'SINGLE' ? 'Single selection' : 'Multiple selection'}
                            {group.required && ' • Required'}
                            {' • '}Min: {group.minSelect}, Max: {group.maxSelect}
                            {group.options.length > 0 && ` • ${group.options.length} options`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditGroupModal(group)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={isDeleting === `group-${group.id}`}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          {isDeleting === `group-${group.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Options */}
                    {expandedGroups.has(group.id) && (
                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase">Options</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCreateOptionModal(group.id)}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        {group.options.length === 0 ? (
                          <div className="text-center py-4 text-slate-400 text-sm">
                            No options added yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {group.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded border"
                              >
                                <div className="flex items-center gap-2">
                                  {option.isDefault && (
                                    <CheckCircle className="h-3 w-3 text-teal-500" />
                                  )}
                                  <div>
                                    <span className="text-sm font-medium">{option.name}</span>
                                    {option.priceAdjustment > 0 && (
                                      <span className="text-xs text-slate-500 ml-2">
                                        +${option.priceAdjustment.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditOptionModal(group, option)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteOption(group.id, option.id)}
                                    disabled={isDeleting === `option-${option.id}`}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  >
                                    {isDeleting === `option-${option.id}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Modals */}
      {selectedGroup && (
        <>
          <EditModifierGroupModal
            open={editGroupModalOpen}
            onClose={() => {
              setEditGroupModalOpen(false);
              setSelectedGroup(null);
            }}
            onSuccess={() => {
              setEditGroupModalOpen(false);
              setSelectedGroup(null);
              onSuccess();
            }}
            menuId={menuId}
            groupData={selectedGroup}
          />

          <CreateModifierOptionModal
            open={createOptionModalOpen}
            onClose={() => {
              setCreateOptionModalOpen(false);
              setSelectedGroup(null);
            }}
            onSuccess={() => {
              setCreateOptionModalOpen(false);
              setSelectedGroup(null);
              onSuccess();
            }}
            menuId={menuId}
            modifierId={selectedGroup.id}
          />

          {selectedOption && (
            <EditModifierOptionModal
              open={editOptionModalOpen}
              onClose={() => {
                setEditOptionModalOpen(false);
                setSelectedGroup(null);
                setSelectedOption(null);
              }}
              onSuccess={() => {
                setEditOptionModalOpen(false);
                setSelectedGroup(null);
                setSelectedOption(null);
                onSuccess();
              }}
              menuId={menuId}
              modifierId={selectedGroup.id}
              optionData={selectedOption}
            />
          )}
        </>
      )}

      <CreateModifierGroupModal
        open={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onSuccess={() => {
          setCreateGroupModalOpen(false);
          onSuccess();
        }}
        menuId={menuId}
        itemId={itemData.id}
      />
    </>
  );
}
