import type {
  ApiResponse,
  PaginatedResponse,
  MenuListItem,
  Menu,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateModifierGroupRequest,
  CreateModifierOptionRequest,
  SetOutletPricingRequest,
  OutletPricing,
  PublicMenu,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// ==================== MENU CRUD ====================

export async function createMenu(data: CreateMenuRequest): Promise<ApiResponse<null>> {
  return request('/menus/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllMenus(
  page: number = 1,
  limit: number = 10,
  restaurantId?: number,
): Promise<PaginatedResponse<MenuListItem>> {
  const url = restaurantId
    ? `/menus/list?page=${page}&limit=${limit}&restaurantId=${restaurantId}`
    : `/menus/list?page=${page}&limit=${limit}`;
  return request(url);
}

export async function getMenuById(id: number): Promise<ApiResponse<Menu>> {
  return request(`/menus/${id}`);
}

export async function updateMenu(id: number, data: UpdateMenuRequest): Promise<ApiResponse<null>> {
  return request(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMenu(id: number): Promise<ApiResponse<null>> {
  return request(`/menus/${id}`, {
    method: 'DELETE',
  });
}

// ==================== CATEGORY CRUD ====================

export async function createCategory(menuId: number, data: CreateCategoryRequest): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  menuId: number,
  categoryId: number,
  name: string,
  displayOrder?: number,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, displayOrder }),
  });
}

export async function deleteCategory(menuId: number, categoryId: number): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

// ==================== MENU ITEM CRUD ====================

export async function createMenuItem(
  menuId: number,
  categoryId: number,
  data: CreateMenuItemRequest,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/categories/${categoryId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMenuItem(
  menuId: number,
  itemId: number,
  data: UpdateMenuItemRequest,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMenuItem(menuId: number, itemId: number): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/items/${itemId}`, {
    method: 'DELETE',
  });
}

// ==================== MODIFIER GROUP CRUD ====================

export async function createModifierGroup(
  menuId: number,
  itemId: number,
  data: CreateModifierGroupRequest,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/items/${itemId}/modifiers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModifierGroup(
  menuId: number,
  modifierId: number,
  name: string,
  minSelect?: number,
  maxSelect?: number,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/modifiers/${modifierId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, minSelect, maxSelect }),
  });
}

export async function deleteModifierGroup(menuId: number, modifierId: number): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/modifiers/${modifierId}`, {
    method: 'DELETE',
  });
}

// ==================== MODIFIER OPTION CRUD ====================

export async function createModifierOption(
  menuId: number,
  modifierId: number,
  data: CreateModifierOptionRequest,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/modifiers/${modifierId}/options`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModifierOption(
  menuId: number,
  modifierId: number,
  optionId: number,
  name: string,
  priceAdjustment: number,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/modifiers/${modifierId}/options/${optionId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, priceAdjustment }),
  });
}

export async function deleteModifierOption(
  menuId: number,
  modifierId: number,
  optionId: number,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/modifiers/${modifierId}/options/${optionId}`, {
    method: 'DELETE',
  });
}

// ==================== OUTLET PRICING ====================

export async function setOutletPricing(
  menuId: number,
  outletId: number,
  data: SetOutletPricingRequest,
): Promise<ApiResponse<null>> {
  return request(`/menus/${menuId}/outlets/${outletId}/pricing`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOutletPricing(menuId: number, outletId: number): Promise<ApiResponse<OutletPricing[]>> {
  return request(`/menus/${menuId}/outlets/${outletId}/pricing`);
}

// ==================== IMAGE UPLOAD ====================

export async function uploadMenuImage(file: File): Promise<ApiResponse<{ imageUrl: string }>> {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/menus/upload-image`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export async function listMenuImages(
  folder: string = 'menu-items',
  limit: number = 100,
  offset: number = 0,
): Promise<ApiResponse<{ files: Array<{ name: string; url: string; size: number }>; total: number }>> {
  return request(`/menus/images?folder=${folder}&limit=${limit}&offset=${offset}`);
}

export async function deleteMenuImage(imageUrl: string): Promise<ApiResponse<null>> {
  return request('/menus/images', {
    method: 'DELETE',
    body: JSON.stringify({ imageUrl }),
  });
}

// ==================== PUBLIC ENDPOINTS ====================

export async function getPublicMenuByOutlet(outletId: number): Promise<ApiResponse<PublicMenu>> {
  return request(`/public/menus/outlet/${outletId}`);
}

export async function getPublicMenuByRestaurant(restaurantId: number): Promise<ApiResponse<PublicMenu>> {
  return request(`/public/menus/restaurant/${restaurantId}`);
}
