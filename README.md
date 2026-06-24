# Restaurant Project - Development Context

> **Last Updated:** 2026-06-24 (Customer Address Management, Order Module, Auth Implementation)
> **Purpose:** Living documentation for project context, architecture, and task tracking

---

## Project Overview

A **full-stack food delivery and restaurant management system** built with:
- **Backend:** NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion
- **Monorepo:** Turborepo + pnpm workspaces

### Tech Stack Details

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend Framework | NestJS | ^11.1.27 |
| Frontend Framework | Next.js | 16.2.9 |
| Database ORM | Prisma | ^7.8.0 |
| Database | PostgreSQL (Neon) | - |
| Auth | JWT + Passport | - |
| Password Hashing | bcrypt | ^6.0.0 |
| Build Tool | Turborepo | ^2.9.18 |
| Package Manager | pnpm | 9.0.0 |
| Animations | Framer Motion | ^11.18.0 |
| Node Version | >=18 | - |
| Runtime | tsx | ^4.22.4 (seeds) |

---

## Project Structure

```
d:\restaurant/
├── apps/
│   ├── backend/                 # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Database seeder (Super Admin)
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module (admin users)
│   │   │   │   ├── guards/     # JWTAuthGuard, RolesGuard
│   │   │   │   ├── strategies/ # JWT strategy
│   │   │   │   ├── decorators/ # @Roles() decorator
│   │   │   │   ├── dto/        # Data transfer objects
│   │   │   │   ├── interfaces/ # JwtPayload interface
│   │   │   │   └── constants/  # Auth constants
│   │   │   ├── customer-module/    # Customer authentication & management
│   │   │   │   ├── guards/         # Customer JWT auth guard
│   │   │   │   ├── strategies/     # Customer JWT strategy
│   │   │   │   ├── dto/            # Customer DTOs (register, login, address)
│   │   │   │   ├── interfaces/     # Customer JWT payload interface
│   │   │   │   ├── constants/      # Customer auth constants
│   │   │   │   ├── customer-module.controller.ts
│   │   │   │   ├── customer-module.service.ts
│   │   │   │   └── customer-module.module.ts
│   │   │   ├── common/         # Shared DTOs, interfaces, services
│   │   │   │   ├── dto/        # Common DTOs (PaginationDto)
│   │   │   │   ├── interfaces/ # Response interfaces (ApiResponse, PaginatedResponse)
│   │   │   │   ├── geocoding.service.ts # Geocoding with Nominatim API
│   │   │   │   └── common.module.ts
│   │   │   ├── database/       # Prisma service & module
│   │   │   ├── user-module/    # User management module
│   │   │   ├── restaurant-module/  # Restaurant management module
│   │   │   ├── outlet-module/      # Outlet management module
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── .env                # Backend environment variables
│   │   └── package.json
│   │
│   └── frontend/               # Next.js App
│       ├── app/
│       │   ├── layout.tsx       # Root layout with AuthProvider and CustomerAuthProvider
│       │   ├── page.tsx         # Root redirect to /customer
│       │   ├── customer/        # Customer-facing pages
│       │   │   ├── page.tsx     # Browse outlets with geolocation
│       │   │   └── menu/[outletId]/page.tsx # Menu browsing with cart
│       │   ├── admin/
│       │   │   └── login/
│       │   │       └── page.tsx # Admin login page
│       │   └── dashboard/
│       │       ├── layout.tsx   # Dashboard layout with sidebar navigation
│       │       ├── page.tsx     # Dashboard home
│       │       ├── users/       # Users list page (Super Admin only)
│       │       ├── restaurants/ # Restaurants list page (Super Admin, Restaurant Admin)
│       │       └── outlets/     # Outlets list page (Super Admin, Restaurant Admin)
│       ├── components/
│       │   ├── ui/             # shadcn/ui components (Button, Card, Input, Sheet, etc.)
│       │   ├── protected-route.tsx
│       │   ├── customer-auth-sheet.tsx  # Bottom slide-up for customer auth
│       │   ├── change-password-modal.tsx
│       │   ├── create-user-modal.tsx
│       │   ├── edit-user-modal.tsx
│       │   ├── create-restaurant-modal.tsx
│       │   ├── add-restaurant-user-modal.tsx
│       │   ├── create-outlet-modal.tsx
│       │   └── add-outlet-user-modal.tsx
│       ├── contexts/
│       │   ├── auth-context.tsx       # Admin auth state management
│       │   ├── customer-auth-context.tsx  # Customer auth state management
│       │   ├── cart-context.tsx       # Shopping cart state management
│       │   └── location-context.tsx   # Customer location state
│       ├── lib/
│       │   ├── types.ts            # TypeScript types (admin)
│       │   ├── customer-types.ts   # TypeScript types (customer)
│       │   ├── menu-types.ts       # Menu browsing types
│       │   ├── cart-types.ts       # Shopping cart types
│       │   ├── location-utils.ts  # Distance calculation (Haversine)
│       │   ├── auth-api.ts         # API functions for auth
│       │   ├── customer-api.ts     # API functions for customers
│       │   ├── public-api.ts       # Public API (outlets, menus)
│       │   ├── users-api.ts        # API functions for users
│       │   ├── restaurants-api.ts  # API functions for restaurants
│       │   └── outlets-api.ts      # API functions for outlets
│       ├── .env.local              # API URL configuration
│       └── package.json
│
├── packages/
│   ├── eslint-config/          # Shared ESLint config
│   ├── typescript-config/      # Shared TSConfig
│   └── ui/                     # Shared UI components
│
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## Database Schema (Prisma)

### User Management

**Models:**
- `User` - System users with roles (SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, CHEF, DELIVERY_AGENT)
- `UserPassword` - User credentials with security features (lockout, refresh tokens)
- `Restaurant` - Restaurant entities
- `RestaurantUser` - Junction table for User-Restaurant relationships
- `Outlet` - Physical restaurant locations with **required** latitude/longitude (auto-geocoded from address)
- `OutletUser` - Junction table for User-Outlet relationships
- `Customer` - End customers
- `CustomerPassword` - Customer credentials
- `CustomerAddress` - Customer delivery addresses with **required** latitude/longitude (auto-geocoded from address)

### Menu Management

**Models:**
- `Menu` - Restaurant-level menus with categories and outlet-specific pricing
- `MenuCategory` - Menu categories (e.g., Appetizers, Main Course, Desserts)
- `MenuItem` - Individual menu items with images, pricing, dietary info
- `MenuItemOutletPricing` - Outlet-specific pricing overrides for menu items
- `ModifierGroup` - Modifier groups (e.g., Size, Add-ons) with SINGLE/MULTIPLE selection types
- `ModifierOption` - Individual modifier options with price adjustments

**Important:** Outlet and CustomerAddress latitude/longitude fields are **optional** and automatically calculated from addresses using the GeocodingService (Nominatim API). If geocoding fails, coordinates remain null without blocking address creation.

**Key Enums:**
- `UserRole`: SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, CHEF, DELIVERY_AGENT
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED
- `RestaurantStatus`: ACTIVE, INACTIVE
- `OutletStatus`: ACTIVE, INACTIVE, CLOSED
- `CustomerStatus`: ACTIVE, INACTIVE, BLOCKED
- `MenuStatus`: ACTIVE, INACTIVE
- `MenuItemStatus`: AVAILABLE, UNAVAILABLE
- `ModifierType`: SINGLE (one option), MULTIPLE (multiple options)

---

## Current Implementation Status

### Backend (NestJS)

| Module | Status | Notes |
|--------|--------|-------|
| App Module | ✅ Complete | ConfigModule, PrismaModule, RestaurantModule, OutletModule, CustomerModule, MenuModule, StorageModule, OrderModule, NotificationsModule imported |
| Auth Module | ✅ Complete | JWT auth, role-based guards, decorators (for admin users) |
| Customer Module | ✅ Complete | Customer auth, profile, address management with auto-geocoding |
| User Module | ✅ Complete | Full CRUD operations for users |
| Restaurant Module | ✅ Complete | Restaurant CRUD with user assignment via RestaurantUser junction, auto-adds Admin/Manager to outlets |
| Outlet Module | ✅ Complete | Outlet CRUD with restaurant relationships, user management with role-based auto-assignment, public endpoint for customer browsing, auto-geocoding |
| Menu Module | ✅ Complete | Restaurant-level menus with categories, items, modifiers, and outlet-specific pricing |
| Order Module | ✅ Complete | Order creation, customer order history, order cancellation, delivery address snapshot, WebSocket notifications |
| Storage Module | ✅ Complete | Supabase storage service for image uploads |
| Notifications Module | ✅ Complete | WebSocket gateway for real-time order notifications to restaurant admins/managers |
| Common Module | ✅ Complete | GeocodingService with Nominatim API, shared DTOs and interfaces |
| Database Module | ✅ Complete | Global PrismaModule with adapter |
| Prisma Schema | ✅ Complete | Full schema with relations including OutletUser junction, Customer with CustomerAddress, Menu models, Order models, required lat/lng |
| Database Seeder | ✅ Complete | Creates Super Admin via npm run seed |

**Port:** 3001 (configurable via `PORT` env var)

**Super Admin Credentials (from seeder):**
- Email: `superadmin@restaurant.com`
- Password: `Admin@123`

### Frontend (Next.js)

| Feature | Status | Notes |
|---------|--------|-------|
| App Structure | ✅ Complete | Layout with AuthProvider, CustomerAuthProvider, CartProvider, LocationProvider, NotificationProvider |
| Routing Structure | ✅ Complete | Separate routes for admin and customer portals with /customer/menu/[outletId], /customer/checkout |
| Root Page | ✅ Complete | Redirects to /customer by default |
| Admin Login | ✅ Complete | Dedicated /admin/login page for admin authentication |
| Customer Portal | ✅ Complete | /customer page with geolocation permission prompt, distance-based outlet sorting, manual location entry |
| Customer Menu Browsing | ✅ Complete | /customer/menu/[outletId] with categories, items, modifiers, add to cart, cart drawer |
| Checkout Page | ✅ Complete | /customer/checkout with address selection, order summary, place order |
| Shopping Cart | ✅ Complete | CartContext with localStorage persistence, quantity controls, modifier support |
| Location Features | ✅ Complete | Browser geolocation API, distance calculation (Haversine), manual address geocoding, distance badges |
| Admin Dashboard | ✅ Complete | Protected dashboard with sidebar navigation (collapsible), notification bell |
| Authentication | ✅ Complete | Login, logout, JWT handling (admin users) |
| Customer Authentication | ✅ Complete | Customer registration, login, profile management |
| Customer Auth Sheet | ✅ Complete | Responsive dialog modal for sign-in/sign-up (centered on desktop, bottom sheet on mobile) |
| Real-time Notifications | ✅ Complete | WebSocket-based order notifications for restaurant admins/managers with bell icon and notification panel |
| User Management | ✅ Complete | Users list, create, edit, delete, change password |
| Restaurant Management | ✅ Complete | Restaurants list, create (SUPER_ADMIN), add/remove users (SUPER_ADMIN, RESTAURANT_ADMIN) |
| Outlet Management | ✅ Complete | Outlets list, create with restaurant filter, user management (SUPER_ADMIN, RESTAURANT_ADMIN) |
| Outlet User Management | ✅ Complete | Manage outlet users with role-based auto-assignment modal |
| Menu Management | ✅ Complete | Restaurant-level menus with categories, items, modifiers, image uploads, outlet pricing |
| Restaurant Admin Access | ✅ Complete | RESTAURANT_ADMIN can view assigned restaurants, manage users, create outlets, menus |
| Auth Context | ✅ Complete | State management with useAuth hook |
| Customer Auth Context | ✅ Complete | State management with useCustomerAuth hook |
| Cart Context | ✅ Complete | Shopping cart state management with useCart hook |
| Location Context | ✅ Complete | Customer location state management with useLocation hook |
| Protected Routes | ✅ Complete | ProtectedRoute component with role check and multiple role support |
| UI Components | ✅ Complete | shadcn/ui components installed (Button, Card, Input, Sheet, Dialog, Badge, etc.) |
| Theme System | ✅ Complete | Orange/Amber theme (light mode only) |
| Address Selector | ✅ Complete | Component for selecting/managing delivery addresses |
| Address Form | ✅ Complete | Modal for adding/editing customer addresses |
| Order Summary | ✅ Complete | Component displaying cart items, subtotal, delivery fee, total |
| Order API | ✅ Complete | API functions for createOrder, getMyOrders, getOrderById, cancelOrder |

### Routing Structure

The application uses separate routing for admin and customer portals:

| Path | Purpose | Authentication |
|------|---------|----------------|
| `/` | Root redirect → `/customer` | Public |
| `/customer` | Customer portal - browse outlets with geolocation, distance sorting | Customer JWT (optional for browsing, required for ordering) |
| `/customer/menu/[outletId]` | Menu browsing page with categories, items, modifiers, add to cart | Public (cart requires customer auth for checkout) |
| `/admin/login` | Admin login page | Public (redirects to `/dashboard` after login) |
| `/dashboard` | Admin dashboard with all management features | Admin JWT required |

**Benefits:**
- Clear separation between admin and customer-facing interfaces
- Professional URLs (e.g., `/admin/login` for admin authentication)
- No shared landing page - each audience has their dedicated entry point
- Easy to extend (e.g., `/admin/settings`, `/customer/orders`)

---

## Customer Portal Features

The `/customer` page provides a Zomato-inspired, modern food delivery experience for browsing and ordering from outlets.

### Visual Design (Zomato-Inspired)
- **Clean & Minimal**: White background with subtle gray accents
- **Professional Layout**: Horizontal restaurant cards with image thumbnails
- **Responsive Design**: Optimized for all screen sizes (mobile, tablet, desktop)
- **Light Mode**: Clean theme optimized for readability

### Key Components
- **Sticky Header**: Brand logo, GPS location detection, login/signup buttons
- **Breadcrumb Navigation**: Home / India / City / Restaurants hierarchy
- **Tabbed Navigation**: Dining Out / Delivery tabs with active state styling
- **Filters Section**: Chip-style filters (Rating 4.0+, Offers, Open Now, Free Delivery)
- **Restaurant List**: Horizontal cards with image, rating badge, cuisines, location, cost
- **Explore Options**: Popular cuisines and restaurant types near you
- **Footer**: Multi-column layout with About, For Restaurants, Learn More, Social Links
- **Auth Modal**: Centered dialog for sign-in/sign-up (480px max-width on desktop)

### Restaurant Card Layout
Each restaurant card features:
- **Left**: Restaurant image thumbnail (64x40 on mobile, 256px on desktop)
- **Right**: Restaurant name with rating badge (green/white)
  - Cuisines (e.g., "North Indian, Chinese, Fast Food")
  - Location with distance badge (e.g., "594 m")
  - Opening hours status
  - Cost for two (e.g., "₹350 for two")
  - Order Now button

### Animations (Framer Motion)
- **Header Animation**: Slide-down effect on page load
- **Restaurant Cards**: Staggered fade-in with slide-up animation (0.05s delay per card)
- **Hover Effects**: Scale, shadow transitions on interactive elements
- **Auth Sheet**: Smooth slide-in/out transitions
- **Filter Chips**: Active state with color transitions

### Filter System
- **Filter Options**:
  - Rating: 4.0+ (high-rated restaurants)
  - Offers (restaurants with active offers)
  - Open Now (currently open restaurants)
  - Free Delivery (no delivery fee)
- **Toggle Behavior**: Click to activate/deactivate filters
- **Visual Feedback**: Active filters shown in orange, inactive in gray

### Explore Section
- **Popular Cuisines**: 12 cuisine types (Beverages, Burger, Chinese, Coffee, etc.)
- **Restaurant Types**: Dhabas, Quick Bites, Sweet Shops, Casual Dining, Fine Dining
- **Interactive Chips**: Hover effects with orange accent color

### Theme System
- **Color Palette**: Orange/amber primary colors, white/gray background
- **Consistent Branding**: FoodHub logo and gradient accents
- **Professional Typography**: Clear hierarchy with appropriate sizing
- **Responsive Spacing**: Adaptive padding for mobile/tablet/desktop

### Location Features
- **GPS Detection**: "Detect current location" button in header
- **Distance Sorting**: Automatic distance calculation and sorting
- **Location Display**: Current city shown in breadcrumb navigation
- **Distance Badges**: Color-coded distance badges on restaurant cards

---

## API Endpoints

### Authentication

| Endpoint | Method | Auth Required | Role Required | Description |
|----------|--------|---------------|---------------|-------------|
| `/auth/login` | POST | No | - | Login with email/phone |
| `/auth/refresh` | POST | No | - | Refresh access token |
| `/auth/profile` | GET | JWT | - | Get current user |
| `/auth/logout` | POST | JWT | - | Logout user |
| `/auth/admin-only` | GET | JWT | SUPER_ADMIN | Test endpoint for role check |

### User Management

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/users/create` | POST | JWT | SUPER_ADMIN | Create new user | - |
| `/users/list` | GET | JWT | SUPER_ADMIN | Get all users (paginated) | `page`, `limit` |
| `/users/change-password` | POST | JWT | - | Change password | - |
| `/users/profile` | GET | JWT | - | Get user profile | - |
| `/users/:id` | GET | JWT | SUPER_ADMIN | Get user by ID | - |
| `/users/:id` | PUT | JWT | SUPER_ADMIN | Update user | - |
| `/users/:id` | DELETE | JWT | SUPER_ADMIN | Delete user | - |

### Restaurant Management

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/restaurants/create` | POST | JWT | SUPER_ADMIN | Create restaurant with admin | - |
| `/restaurants/list` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get restaurants (paginated) | `page`, `limit` |
| `/restaurants/my-restaurants` | GET | JWT | - | Get user's restaurants | - |
| `/restaurants/:id` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get restaurant by ID | - |
| `/restaurants/:id` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update restaurant | - |
| `/restaurants/:id` | DELETE | JWT | SUPER_ADMIN | Delete restaurant | - |
| `/restaurants/:id/users` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get restaurant users | - |
| `/restaurants/:id/users` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Add user to restaurant | - |
| `/restaurants/:id/users/:userId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Remove user from restaurant | - |

### Outlet Management

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/outlets/create` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Create outlet (auto-adds Admin/Manager) | - |
| `/outlets/list` | GET | JWT | - | Get outlets (paginated) | `page`, `limit`, `restaurantId` |
| `/outlets/restaurant/:restaurantId` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get outlets by restaurant | - |
| `/outlets/:id` | GET | JWT | - | Get outlet by ID | - |
| `/outlets/:id` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update outlet | - |
| `/outlets/:id` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Delete outlet | - |
| `/outlets/:id/users` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get outlet users | - |
| `/outlets/:id/users/available` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get available CHEF/DELIVERY_AGENT | - |
| `/outlets/:id/users` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Add user to outlet (manual) | - |
| `/outlets/:id/users/:userId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Remove user from outlet | - |

### Customer Authentication

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/customers/register` | POST | No | Register new customer (returns tokens) |
| `/customers/login` | POST | No | Login customer with email/phone |
| `/customers/profile` | GET | Customer JWT | Get customer profile with addresses |
| `/customers/profile` | PUT | Customer JWT | Update customer profile |
| `/customers/logout` | POST | Customer JWT | Logout customer |
| `/customers/validate` | GET | Customer JWT | Validate customer token |

### Customer Address Management

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/customers/addresses` | POST | Customer JWT | Add new address (auto-geocodes to required lat/lng) |
| `/customers/addresses/:addressId` | PUT | Customer JWT | Update address (re-geocodes if address changes) |
| `/customers/addresses/:addressId` | DELETE | Customer JWT | Delete address |
| `/customers/addresses/:addressId/default` | POST | Customer JWT | Set default address |

**Note:** Customer addresses require valid latitude/longitude coordinates. Geocoding is performed automatically via Nominatim API. If geocoding fails, the request returns 400 with error message "Unable to geocode address. Please provide a valid address."

### Order Management (Customer)

| Endpoint | Method | Auth Required | Description | Query Params |
|----------|--------|---------------|-------------|--------------|
| `/orders/create` | POST | Customer JWT | Create order from cart | - |
| `/orders/my-orders` | GET | Customer JWT | Get customer's orders (paginated) | `page`, `limit` |
| `/orders/:id` | GET | Customer JWT | Get order by ID | - |
| `/orders/:id/cancel` | POST | Customer JWT | Cancel pending order | - |

**Order Creation Request Body:**
```json
{
  "outletId": 1,
  "addressId": 1,
  "items": [
    {
      "menuItemId": 1,
      "name": "Burger",
      "price": 150,
      "quantity": 2,
      "modifiers": [
        {
          "modifierGroupId": 1,
          "modifierGroupName": "Size",
          "type": "SINGLE",
          "selectedOptions": [{"id": 1, "name": "Large", "priceAdjustment": 20}]
        }
      ]
    }
  ]
}
```

**Order Status Flow:** PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED (or CANCELLED)

### Public Outlet Endpoints (No Authentication)

| Endpoint | Method | Auth Required | Description | Query Params |
|----------|--------|---------------|-------------|--------------|
| `/public/outlets/list` | GET | No | Get active outlets with latitude/longitude (public) | `page`, `limit`, `restaurantId` |
| `/public/outlets/:id` | GET | No | Get outlet by ID with latitude/longitude (public) | - |

**Response includes:** `id`, `name`, `description`, `address`, `city`, `state`, `country`, `postalCode`, `phone`, `email`, `latitude`, `longitude`, `status`, `restaurant` |

### Menu Management

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/menus/create` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Create menu for restaurant | - |
| `/menus/list` | GET | JWT | - | Get menus (paginated, filtered by user access) | `page`, `limit`, `restaurantId` |
| `/menus/:id` | GET | JWT | - | Get menu by ID with full details | - |
| `/menus/:id` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update menu | - |
| `/menus/:id` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Delete menu | - |
| `/menus/:id/categories` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Add category to menu | - |
| `/menus/:id/categories/:categoryId` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update category | - |
| `/menus/:id/categories/:categoryId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Delete category | - |
| `/menus/:id/categories/:categoryId/items` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Add item to category | - |
| `/menus/:id/items/:itemId` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Update menu item | - |
| `/menus/:id/items/:itemId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Delete item | - |
| `/menus/:id/items/:itemId/modifiers` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Add modifier group | - |
| `/menus/:id/modifiers/:modifierId` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Update modifier group | - |
| `/menus/:id/modifiers/:modifierId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Delete modifier group | - |
| `/menus/:id/modifiers/:modifierId/options` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Add modifier option | - |
| `/menus/:id/modifiers/:modifierId/options/:optionId` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Update option | - |
| `/menus/:id/modifiers/:modifierId/options/:optionId` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Delete option | - |
| `/menus/:id/outlets/:outletId/pricing` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Set outlet-specific pricing | - |
| `/menus/:id/outlets/:outletId/pricing` | GET | JWT | - | Get outlet pricing for menu | - |
| `/menus/upload-image` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Upload menu image to Supabase | - |

### Public Menu Endpoints (No Authentication)

| Endpoint | Method | Auth Required | Description | Query Params |
|----------|--------|---------------|-------------|--------------|
| `/public/menus/outlet/:outletId` | GET | No | Get public menu with outlet pricing | - |
| `/public/menus/restaurant/:restaurantId` | GET | No | Get public menu for restaurant | - |

### Authentication Flow

1. **Database Seeding:** Run `pnpm run seed` to create Super Admin
2. **Login:** Super Admin logs in via `/auth/login` → receives JWT tokens
3. **Create Users:** Super Admin creates other users via `/users/create`
4. **Role Selection:** Frontend sends role in request body (no defaults)

### WebSocket Notifications

The system includes real-time order notifications for restaurant admins and managers using WebSocket (Socket.io).

**Architecture:**
- **Backend:** NestJS WebSocket Gateway (`notifications.gateway.ts`) with room-based subscriptions
- **Frontend:** React Context Provider with Socket.io client for real-time updates

**Notification Flow:**

1. **Connection:** Restaurant admins/managers connect via WebSocket when logged into dashboard
2. **Auto-Subscription:** Users are automatically subscribed to their assigned restaurant rooms based on JWT token and database relationships
3. **Order Events:** When orders are created/updated/cancelled, the backend emits notifications to relevant restaurant rooms
4. **UI Updates:** Dashboard notification bell shows unread count and displays notifications in a panel

**Notification Types:**
- `order.created` - New order received with customer details, items, and delivery address
- `order.updated` - Order status changed (e.g., confirmed, preparing, ready)
- `order.cancelled` - Order cancelled by customer

**WebSocket Namespace:** `/notifications`

**Room Naming Convention:** `restaurant:{restaurantId}`

**Example Events:**

```typescript
// Backend emits to restaurant room
this.server.to(`restaurant:${restaurantId}`).emit('order.created', {
  orderId: 123,
  outletId: 5,
  outletName: "Downtown Branch",
  status: "PENDING",
  total: 450,
  items: [...],
  deliveryAddress: {...}
});

// Frontend receives and displays notification
notificationSocket.on('order.created', (data) => {
  // Update notification bell and panel
});
```

### Role Permissions

| Feature | SUPER_ADMIN | RESTAURANT_ADMIN | MANAGER | CHEF | DELIVERY_AGENT |
|---------|-------------|-------------------|---------|------|----------------|
| **User Management** |
| Create any user | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update/Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Restaurant Management** |
| Create restaurants | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all restaurants | ✅ | ❌ | ❌ | ❌ | ❌ |
| View assigned restaurants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update restaurant | ✅ | ✅ (own only) | ❌ | ❌ | ❌ |
| Delete restaurant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add users to restaurant | ✅ (any) | ✅ (own only) | ❌ | ❌ | ❌ |
| Remove users from restaurant | ✅ (any) | ✅ (own only) | ❌ | ❌ | ❌ |
| **Outlet Management** |
| Create outlets | ✅ (any) | ✅ (own restaurants) | ❌ | ❌ | ❌ |
| **Menu Management** |
| Create menus | ✅ (any) | ✅ (own restaurants) | ❌ (via assigned restaurants) | ❌ | ❌ |
| View all menus | ✅ | ❌ | ❌ | ❌ | ❌ |
| View assigned menus | ✅ | ✅ (own restaurants) | ✅ (via assigned outlets) | ✅ (via assigned outlets) | ✅ (via assigned outlets) |
| Update/delete menu | ✅ (any) | ✅ (own restaurants) | ❌ | ❌ | ❌ |
| Add categories/items | ✅ (any) | ✅ (own restaurants) | ✅ (own menus) | ❌ | ❌ |
| Upload menu images | ✅ | ✅ (own restaurants) | ✅ (own menus) | ❌ | ❌ |
| Set outlet pricing | ✅ | ✅ (own outlets) | ✅ (own outlets) | ❌ | ❌ |
| **Outlet User Management** |
| View all outlets | ✅ | ❌ | ❌ | ❌ | ❌ |
| View restaurant outlets | ✅ | ✅ (own only) | ❌ | ❌ | ❌ |
| Update outlet | ✅ (any) | ✅ (own restaurants) | ❌ | ❌ | ❌ |
| Delete outlet | ✅ (any) | ✅ (own restaurants) | ❌ | ❌ | ❌ |
| **Outlet User Management** |
| Auto-add to outlet on creation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Auto-add to existing outlets on restaurant assignment | ✅ (Admin/Manager) | ✅ (Admin/Manager) | ❌ | ❌ | ❌ |
| View outlet users | ✅ | ✅ (own only) | ❌ | ❌ | ❌ |
| Add CHEF/DELIVERY_AGENT to outlet | ✅ | ✅ (own only) | ❌ | ❌ | ❌ |
| Remove CHEF/DELIVERY_AGENT from outlet | ✅ | ✅ (own only) | ❌ | ❌ | ❌ |

### API Response Format

All API responses follow a consistent format with `success`, `message`, and `data` fields:

**Standard Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Paginated Response (e.g., `/users/list`):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Example Endpoints:**
- `POST /users/create` → Returns `{ "success": true, "message": "User created successfully" }`
- `GET /users/list?page=1&limit=10` → Returns paginated users with metadata
- `POST /users/change-password` → Returns `{ "success": true, "message": "Password changed successfully" }`

### Guards & Decorators

- **@UseGuards(JwtAuthGuard)** - Validates JWT token (admin users)
- **@UseGuards(CustomerJwtAuthGuard)** - Validates customer JWT token
- **@UseGuards(RolesGuard)** - Checks user roles
- **@Roles(UserRole.SUPER_ADMIN)** - Specifies required role(s)

**Important:** When using JWT-protected endpoints in controllers, authenticated user data is available via `req.user`:
- Admin endpoints: `req.user.userId` (contains userId, email, role)
- Customer endpoints: `req.user.customerId` (contains customerId, phone, email, type)

---

## Environment Setup

### Backend (.env)
Located at `apps/backend/.env`

**Required Variables:**
```env
PORT=3001
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
FRONTEND_URL=https://restaurant-frontend-kappa-ten.vercel.app
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_BUCKET=restaurant-menu-images
```

**For Local Development:**
```env
PORT=3001
DATABASE_URL="postgresql://..."
FRONTEND_URL=http://localhost:3000
```

**Files:**
- `.env` - Active environment variables (not committed to git)
- `.env.example` - Template file for reference

### Frontend (.env)
Located at `apps/frontend/`

**Development (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Production (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://restaurant-t24q.onrender.com
```

**Files:**
- `.env.local` - Local development (auto-loaded by Next.js)
- `.env.production` - Production build configuration
- `.env.example` - Template file for reference

### Production Deployment

**Render (Backend):**
1. Set `FRONTEND_URL=https://restaurant-frontend-kappa-ten.vercel.app` in Render environment variables
2. CORS configuration automatically includes the production frontend URL
3. Add Supabase environment variables:
   - `SUPABASE_URL=https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_KEY=your-service-role-key`
   - `SUPABASE_BUCKET=restaurant-menu-images`

**Vercel (Frontend):**
1. Add `NEXT_PUBLIC_API_URL=https://restaurant-t24q.onrender.com` in Vercel Dashboard → Settings → Environment Variables
2. The `NEXT_PUBLIC_` prefix makes the variable available in browser code

**Supabase Setup:**
1. Create a Supabase project at https://supabase.com
2. Create a storage bucket named `restaurant-menu-images`
3. Make the bucket public (Storage → Policies → New Policy)
4. Add public read access policy:
   ```sql
   CREATE POLICY "Public Read Access" ON "storage"."objects"
   FOR SELECT TO public USING ( bucket_id = 'restaurant-menu-images' );
   ```
5. Get credentials from Project Settings → API:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` → `SUPABASE_SERVICE_KEY`

### Prerequisites
- Node.js >= 18
- pnpm >= 9.0.0
- PostgreSQL database (Neon recommended)

### Common Commands

```bash
# Install dependencies
pnpm install

# Run development (both apps)
pnpm dev

# Database operations (IMPORTANT: Use migrate for schema changes)
cd apps/backend
npx prisma generate                    # Generate Prisma client (run after schema changes)
npx prisma migrate dev --name <name>  # Create and apply migration (USE THIS for schema changes)
npx prisma db push                     # Direct schema sync (ONLY for development, no migration file)
npx prisma studio                      # Open Prisma Studio (database GUI)
npx prisma migrate status              # Check migration status
pnpm run seed                          # Seed Super Admin user

# TypeScript compilation check
npx tsc --noEmit
```

### Database Migration Workflow

**⚠️ IMPORTANT: Always use `npx prisma migrate dev --name <name>` for schema changes**

This creates a migration file and applies it to the database, keeping a proper audit trail:

```bash
# Example: Adding a new feature
npx prisma migrate dev --name add_order_tracking
```

**When to use each command:**

| Command | When to Use | Creates Migration File? |
|---------|------------|-------------------------|
| `npx prisma migrate dev --name <name>` | ✅ **Use for ALL schema changes** | Yes |
| `npx prisma db push` | Only for quick prototyping (no migration history) | No |
| `npx prisma migrate reset` | Reset entire database (loses all data) | N/A |
| `npx prisma generate` | After schema changes to regenerate Prisma client | N/A |

---

## Frontend Structure Details

### Components & Pages

| File | Purpose |
|------|---------|
| `lib/types.ts` | TypeScript types for User, LoginResponse, CreateUserRequest, ChangePasswordRequest, UserListItem, Restaurant, Outlet, Menu, MenuItem, Modifier, etc. |
| `lib/auth-api.ts` | API functions for auth endpoints (login, logout, getCurrentUser) |
| `lib/users-api.ts` | API functions for user endpoints (createUser, getAllUsers, updateUser, deleteUser) |
| `lib/restaurants-api.ts` | API functions for restaurant endpoints (createRestaurant, getAllRestaurants, addUserToRestaurant, etc.) |
| `lib/outlets-api.ts` | API functions for outlet endpoints (createOutlet, getAllOutlets, updateOutlet, deleteOutlet) |
| `lib/menus-api.ts` | API functions for menu endpoints (createMenu, getAllMenus, createMenuItem, uploadMenuImage, etc.) |
| `contexts/auth-context.tsx` | Auth state management with useAuth hook |
| `components/protected-route.tsx` | Route protection wrapper with role check (supports single role or multiple allowedRoles) |
| `components/change-password-modal.tsx` | Reusable modal for password changes (uses shadcn Dialog, with confirm password field) |
| `components/create-user-modal.tsx` | Modal for creating new users (uses shadcn Dialog) |
| `components/edit-user-modal.tsx` | Modal for editing existing users (uses shadcn Dialog) |
| `components/create-restaurant-modal.tsx` | Modal for creating restaurants with admin assignment |
| `components/add-restaurant-user-modal.tsx` | Modal for adding/removing users from restaurants |
| `components/create-outlet-modal.tsx` | Modal for creating outlets for restaurants |
| `components/add-outlet-user-modal.tsx` | Modal for adding/removing users from outlets with role-based auto-assignment |
| `components/create-menu-modal.tsx` | Modal for creating restaurant menus with restaurant selection |
| `components/create-category-modal.tsx` | Modal for adding categories to menus (e.g., Appetizers, Main Course) |
| `components/create-menu-item-modal.tsx` | Modal for adding items to categories with image upload, pricing, dietary info |
| `components/image-upload-component.tsx` | Reusable image upload component with Supabase integration |
| `components/ui/button.tsx` | shadcn Button component |
| `components/ui/card.tsx` | shadcn Card component |
| `components/ui/input.tsx` | shadcn Input component |
| `components/ui/label.tsx` | shadcn Label component |
| `components/ui/select.tsx` | shadcn Select component |
| `components/ui/table.tsx` | shadcn Table component |
| `components/ui/badge.tsx` | shadcn Badge component |
| `components/ui/dialog.tsx` | shadcn Dialog component |
| `app/page.tsx` | Root page - redirects to /customer |
| `app/customer/page.tsx` | Customer-facing page with outlet browsing |
| `app/admin/login/page.tsx` | Admin login form (email/phone + password) |
| `app/dashboard/layout.tsx` | Dashboard layout with sidebar navigation (collapsible on desktop, hamburger menu on mobile), logout, change password button |
| `app/dashboard/page.tsx` | Dashboard home page |
| `app/dashboard/create-user/page.tsx` | User creation form (Super Admin only) - legacy, replaced by modal |
| `app/dashboard/users/page.tsx` | Users list page with Create User button and password reset modal (Super Admin only) |
| `app/dashboard/restaurants/page.tsx` | Restaurants list page with pagination, Create Restaurant button (SUPER_ADMIN), and Add User modal (SUPER_ADMIN, RESTAURANT_ADMIN) |
| `app/dashboard/outlets/page.tsx` | Outlets list page with pagination, restaurant filter, and Create Outlet button (SUPER_ADMIN, RESTAURANT_ADMIN) |
| `app/dashboard/menus/page.tsx` | Menus list page with expandable menu details, inline category/item creation (SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER) |
| `app/globals.css` | Custom CSS animations (float-up, float-down, pulse-warm, drift) |

### API Communication

| Endpoint | Method | Used By | Description |
|----------|--------|---------|-------------|
| `/auth/login` | POST | Login page | User login |
| `/auth/profile` | GET | Auth context | Validate token, get current user |
| `/auth/logout` | POST | Dashboard header | User logout |
| `/users/create` | POST | Create User modal | Create new user (SUPER_ADMIN only) |
| `/users/list` | GET | Users list page | Get all users except superadmin (SUPER_ADMIN only) |
| `/users/change-password` | POST | Change Password modal | Change password (admin reset or own password, with confirm password validation) |
| `/restaurants/create` | POST | Create Restaurant modal | Create restaurant with admin (SUPER_ADMIN only) |
| `/restaurants/list` | GET | Restaurants list page | Get restaurants with pagination |
| `/restaurants/:id/users` | GET | Add Restaurant User modal | Get users in restaurant |
| `/restaurants/:id/users` | POST | Add Restaurant User modal | Add user to restaurant |
| `/restaurants/:id/users/:userId` | DELETE | Add Restaurant User modal | Remove user from restaurant |
| `/restaurants/my-restaurants` | GET | Create Outlet modal | Get user's accessible restaurants |
| `/outlets/create` | POST | Create Outlet modal | Create outlet for restaurant |
| `/outlets/list` | GET | Outlets list page | Get outlets with pagination and optional restaurant filter |
| `/outlets/:id/users` | GET | Add Outlet User modal | Get users in outlet |
| `/outlets/:id/users/available` | GET | Add Outlet User modal | Get available CHEF/DELIVERY_AGENT for assignment |
| `/outlets/:id/users` | POST | Add Outlet User modal | Add user to outlet |
| `/outlets/:id/users/:userId` | DELETE | Add Outlet User modal | Remove user from outlet |
| `/outlets/:id` | DELETE | Outlets list page | Delete outlet |

### Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Frontend Dependencies

**Key Libraries:**
- `framer-motion` ^11.18.0 - Animation library for smooth transitions
- `lucide-react` - Icon library (food, kitchen, delivery icons: Coffee, ShoppingBag, Clock, Star, Beef, Cake, Egg, ChefHat, Sandwich, GlassWater, Cookie, Key, Eye, EyeOff, UserPlus, Users, Loader2, Mail, Phone)
- `shadcn/ui` - Pre-built UI components
- `tailwindcss` v4 - Utility-first CSS framework

### shadcn/ui Components Used

The following shadcn/ui components are used in this project:

| Component | Usage | Files |
|-----------|-------|-------|
| Button | All buttons, navigation, form submit, actions | All pages |
| Card | Card containers for forms and content | Login, dashboard pages |
| Input | Text inputs, password fields | All forms |
| Label | Form labels | All forms |
| Select | Role selection dropdown | Create User page |
| Table | Users list table | Manage Users page |
| Badge | Role and status badges | Manage Users page |
| Dialog | Modal for password changes | Change Password modal |

**Installing New Components:**

To add new shadcn components, run from the frontend directory:
```bash
cd apps/frontend
npx shadcn@latest add [component-name] -y
```

For example:
```bash
npx shadcn@latest add dialog -y
```

---

## Tasks / Work Log

> Add new tasks here as we work on the project. Use this format:
> - [ ] **Task Name** - Description - Date

### Completed Tasks
- ✅ **Project Initialization** - Set up Turborepo monorepo with NestJS and Next.js - 2026-06-17
- ✅ **Database Schema** - Designed complete Prisma schema for restaurant management - 2026-06-17
- ✅ **Auth Module Structure** - Created NestJS auth module with guards, decorators, DTOs - 2026-06-17
- ✅ **Auth Implementation** - Implemented complete JWT authentication with Passport, guards, roles - 2026-06-18
- ✅ **Prisma Service** - Completed database service integration with Prisma Client - 2026-06-18
- ✅ **Database Seeder** - Created Super Admin seeder with tsx runtime - 2026-06-18
- ✅ **Role-Based Access Control** - Implemented @Roles() decorator with RolesGuard - 2026-06-18
- ✅ **User Creation API** - Super Admin can create users with any role (from frontend) - 2026-06-18
- ✅ **Frontend Auth Structure** - Created auth context, API utilities, types - 2026-06-18
- ✅ **Login Page** - Email/password login form with error handling - 2026-06-18
- ✅ **Dashboard Layout** - Protected dashboard with header, navigation, logout - 2026-06-18
- ✅ **User Creation Page** - Super Admin form for creating new users - 2026-06-18
- ✅ **CORS Configuration** - Enabled CORS in NestJS for frontend communication - 2026-06-18
- ✅ **UI Components Installation** - Installed shadcn/ui with Button, Input, Label, Card, Select - 2026-06-18
- ✅ **Professional Design** - Redesigned all pages with modern, professional UI - 2026-06-18
- ✅ **Theme System** - Implemented red/orange theme with light mode - 2026-06-18
- ✅ **Theme Removal** - Removed custom dark/light mode toggle, using light mode only - 2026-06-18
- ✅ **Landing Page Redesign** - Food delivery themed landing page with hero section - 2026-06-18
- ✅ **Framer Motion Integration** - Added animations library for smooth UI transitions - 2026-06-18
- ✅ **Animated Background** - Floating food icons (20 particles), wave animations, orbs - 2026-06-18
- ✅ **Glass-morphism Effects** - Added backdrop-blur and semi-transparent overlays - 2026-06-18
- ✅ **Viewport-Optimized Landing** - Hero section fits viewport without scrolling - 2026-06-18
- ✅ **Custom CSS Animations** - Added float-up, float-down, pulse-warm, drift keyframes - 2026-06-18
- ✅ **Auth Module Refactoring** - Moved user management from Auth to Users module - 2026-06-19
- ✅ **Users Module Implementation** - Implemented full CRUD operations for users - 2026-06-19
- ✅ **Change Password Frontend** - Added change password page and API integration - 2026-06-19
- ✅ **Users List Feature** - Added users list page with Super Admin access - 2026-06-19
- ✅ **Dashboard Navigation** - Added navigation links for new pages with role-based visibility - 2026-06-19
- ✅ **UI Refactoring with shadcn** - Consolidated user management, added shadcn Dialog modal, removed separate tabs - 2026-06-19
- ✅ **Admin Password Reset** - Implemented Super Admin ability to change any user's password without old password - 2026-06-19
- ✅ **Password Confirmation Field** - Added confirm password field to change password modal with validation - 2026-06-19
- ✅ **Create User Modal** - Created modal-based user creation instead of separate page - 2026-06-19
- ✅ **Users List Modal Integration** - Updated Manage Users page to use modals for both create user and password change - 2026-06-19
- ✅ **Sidebar Navigation** - Converted dashboard from top header navigation to professional sidebar (collapsible on desktop, hamburger menu on mobile) - 2026-06-19
- ✅ **Backend Error Handling** - Added try-catch blocks to all service methods with proper error handling - 2026-06-19
- ✅ **DTO Organization** - Created separate DTO files for all modules (auth, user) following clean code principles - 2026-06-19
- ✅ **API Response Standardization** - Implemented consistent response format with `success`, `message`, and `data` fields across all endpoints - 2026-06-19
- ✅ **Pagination Implementation** - Added pagination support to user list API with metadata (page, limit, total, totalPages) - 2026-06-19
- ✅ **Frontend Pagination** - Updated users list page with pagination controls and state management - 2026-06-19
- ✅ **Global Validation Pipe** - Enabled NestJS validation pipe in main.ts for DTO validation - 2026-06-19
- ✅ **DTO Usage Refactoring** - Refactored create user and change password APIs to use DTOs directly in service methods instead of individual parameters - 2026-06-19
- ✅ **User Update/Delete APIs** - Implemented PUT and DELETE endpoints for user management with proper validation and error handling - 2026-06-19
- ✅ **Frontend User Edit/Delete** - Added edit and delete icons with modals for user management, including edit user modal with pre-filled data and delete confirmation dialog - 2026-06-19
- ✅ **Environment Variable Configuration** - Set up environment variables for production and local development, including frontend API URL and backend CORS configuration - 2026-06-19
- ✅ **Restaurant Module Backend** - Implemented complete restaurant management module with CRUD operations - 2026-06-22
- ✅ **Restaurant User Management** - Added ability to assign/remove users from restaurants - 2026-06-22
- ✅ **Outlet Module Backend** - Implemented outlet management with restaurant relationships - 2026-06-22
- ✅ **Restaurant Frontend** - Created restaurants list page and create restaurant modal - 2026-06-22
- ✅ **Restaurant User Modal** - Created modal for adding/removing users from restaurants - 2026-06-22
- ✅ **Outlet Frontend** - Created outlets list page and create outlet modal - 2026-06-22
- ✅ **Dashboard Navigation Update** - Added Restaurants and Outlets links to sidebar navigation - 2026-06-22
- ✅ **ProtectedRoute Enhancement** - Updated ProtectedRoute component to support multiple roles via allowedRoles array - 2026-06-22
- ✅ **Restaurant Admin Dashboard Access** - RESTAURANT_ADMIN can now access their assigned restaurants and outlets, manage users - 2026-06-22
- ✅ **Contextual Page Titles** - Page titles change based on user role (My Restaurants/Outlets for RESTAURANT_ADMIN) - 2026-06-22
- ✅ **Super Admin Restaurant Access** - SUPER_ADMIN sees all restaurants when creating outlets, not just assigned ones - 2026-06-22
- ✅ **Dashboard Layout TypeScript Fix** - Fixed TypeScript build error by adding proper NavItem interface and UserRole type, improving type inference in filter logic - 2026-06-22
- ✅ **Common Types Refactoring** - Created common folder with shared DTOs (PaginationDto) and response interfaces (ApiResponse, PaginatedResponse) to eliminate duplicate code across all services - 2026-06-22
- ✅ **PaginationMeta Implementation** - Added PaginationMeta class with auto-calculated pagination metadata (totalPages, hasNextPage, hasPrevPage, nextPage, prevPage, from, to) to eliminate repeated pagination logic across all services - 2026-06-22
- ✅ **Outlet User Backend** - Implemented outlet-user management endpoints with role-based auto-assignment (RESTAURANT_ADMIN/MANAGER auto-added to all outlets) - 2026-06-22
- ✅ **Outlet User Auto-Assignment** - When creating outlet, auto-adds RESTAURANT_ADMIN and MANAGER from restaurant; when adding user to restaurant, auto-adds to all outlets for oversight roles - 2026-06-22
- ✅ **Outlet User Frontend** - Created add-outlet-user-modal for managing outlet users with manual assignment for CHEF/DELIVERY_AGENT - 2026-06-22
- ✅ **Outlet User Types & API** - Added OutletUser, AddOutletUserRequest, AvailableOutletUser types and API functions - 2026-06-22
- ✅ **Customer Module Backend** - Implemented customer authentication, registration, profile, and address management - 2026-06-22
- ✅ **Customer Auth Frontend** - Created customer types, API functions, and auth context - 2026-06-22
- ✅ **Customer Auth Sheet** - Created bottom slide-up component for customer sign-in/sign-up - 2026-06-22
- ✅ **Customer Page** - Created customer-facing page with outlet browsing and order flow - 2026-06-22
- ✅ **Public Outlet API** - Created public endpoints for browsing outlets without authentication - 2026-06-22
- ✅ **Customer JWT Strategy** - Implemented separate JWT strategy for customer authentication - 2026-06-22
- ✅ **Customer Auth UI Enhancement** - Improved customer sign-in/sign-up UI with centered dialog modal on desktop (480px max-width), proper spacing, and responsive design - 2026-06-22
- ✅ **Routing Structure Reorganization** - Separated admin and customer routing with dedicated paths: `/` → `/customer`, `/admin/login` for admin authentication, `/dashboard` for admin management - 2026-06-22
- ✅ **Menu Module Implementation** - Implemented complete menu management system with restaurant-level menus, categories, items, modifiers, Supabase image storage, and outlet-specific pricing - 2026-06-22
- ✅ **GeocodingService Implementation** - Created geocoding service using Nominatim API (OpenStreetMap) for address-to-coordinate conversion with Haversine distance calculation - 2026-06-23
- ✅ **Auto-Geocoding for Outlets** - Outlet creation/update now auto-calculates latitude/longitude from address fields, removed manual lat/lng input from DTOs - 2026-06-23
- ✅ **Auto-Geocoding for Customer Addresses** - Customer address creation/update now auto-calculates latitude/longitude from address fields, removed manual lat/lng input from DTOs - 2026-06-23
- ✅ **Prisma Schema Latitude/Longitude Required** - Updated Outlet and CustomerAddress models to make latitude/longitude required fields (no longer optional) - 2026-06-23
- ✅ **Menu Browsing Types** - Created menu-types.ts with PublicMenu, MenuCategory, MenuItem, ModifierGroup, ModifierOption interfaces for customer menu browsing - 2026-06-23
- ✅ **Cart Context & Types** - Created cart-context.tsx with CartProvider, useCart hook, localStorage persistence, and cart management functions (add, remove, update, clear) - 2026-06-23
- ✅ **Location Context & Types** - Created location-context.tsx with LocationProvider for customer location state management (browser geolocation, manual address entry) - 2026-06-23
- ✅ **Location Utilities** - Created location-utils.ts with calculateDistance (Haversine formula), formatDistance, requestGeolocation, geocodeAddress, and sortByDistance functions - 2026-06-23
- ✅ **Customer Menu Browsing Page** - Created /customer/menu/[outletId] page with categories, menu items, modifier selection, add to cart, cart drawer, and outlet-specific pricing - 2026-06-23
- ✅ **Public API Extension** - Added getPublicMenuByOutlet() function and updated PublicOutlet interface to include latitude/longitude - 2026-06-23
- ✅ **Customer Geolocation Features** - Updated /customer page with browser geolocation permission prompt, distance calculation and sorting for outlets, distance badges, manual location entry option - 2026-06-23
- ✅ **Cart UI Integration** - Added cart indicator badge to menu page header, cart drawer with item management, subtotal calculation, and checkout button - 2026-06-23
- ✅ **Modifier Selection UI** - Created modal-based modifier selector with SINGLE (radio) and MULTIPLE (checkbox) modifier types, price adjustments, and validation - 2026-06-23
- ✅ **Category Navigation** - Added horizontal scrollable category tabs with active highlighting and smooth scroll to category sections - 2026-06-23
- ✅ **CommonModule GeocodingService Export** - Exported GeocodingService from CommonModule for use in OutletModule and CustomerModule - 2026-06-23
- ✅ **Module Dependencies Update** - Imported CommonModule in OutletModule and CustomerModule to provide GeocodingService injection - 2026-06-23
- ✅ **Zomato-Inspired Customer Page Redesign** - Redesigned /customer page with Zomato-style layout including breadcrumb navigation, tabbed navigation (Dining Out/Delivery), chip-style filters, horizontal restaurant cards (mobile) and grid layout (PC, 3-4 per row), explore section with cuisine chips, and multi-column footer - 2026-06-23
- ✅ **Restaurant Edit Feature** - Added edit restaurant modal with logo upload support via Supabase, allowing SUPER_ADMIN and RESTAURANT_ADMIN to update restaurant details including name, slug, description, and logo - 2026-06-23
- ✅ **Restaurant Logo Upload** - Implemented POST /restaurants/upload-logo endpoint for uploading restaurant logos to Supabase storage with file validation (5MB max, JPEG/PNG/WebP) - 2026-06-23
- ✅ **Restaurant Logos on Customer Page** - Updated customer page to display restaurant logos on outlet cards when available, both in desktop grid and mobile horizontal layouts - 2026-06-23
- ✅ **Order Module Backend** - Implemented complete order management system with Order, OrderItem, Payment models, order creation, customer order history, and cancellation - 2026-06-24
- ✅ **Order Schema** - Added Order, OrderItem, Payment models to Prisma schema with OrderStatus, PaymentMethod, PaymentStatus enums - 2026-06-24
- ✅ **Order API Endpoints** - Created POST /orders/create, GET /orders/my-orders, GET /orders/:id, POST /orders/:id/cancel endpoints - 2026-06-24
- ✅ **Order Types** - Created order-types.ts with Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus interfaces and enums - 2026-06-24
- ✅ **Order API Functions** - Created order-api.ts with createOrder, getMyOrders, getOrderById, cancelOrder functions - 2026-06-24
- ✅ **Address Selector Component** - Created address-selector.tsx component with saved address cards, selection highlighting, add/edit/delete actions - 2026-06-24
- ✅ **Address Form Component** - Created address-form.tsx modal for adding/editing customer addresses with validation and geocoding - 2026-06-24
- ✅ **Order Summary Component** - Created order-summary.tsx component displaying cart items, outlet info, selected address, price breakdown - 2026-06-24
- ✅ **Checkout Page** - Created /customer/checkout page with address selection, order summary, auth check, cart validation, order placement - 2026-06-24
- ✅ **WebSocket Notifications Backend** - Created NotificationsGateway with room-based subscriptions for restaurant-specific order notifications - 2026-06-24
- ✅ **WebSocket Notifications Frontend** - Created NotificationProvider, NotificationBell, and notification panel for real-time order alerts - 2026-06-24
- ✅ **Order Notification Integration** - Integrated WebSocket event emission in OrderService for order created, updated, and cancelled events - 2026-06-24
- ✅ **Order Details Page** - Created /customer/orders/[orderId] page with order status, timeline, items, delivery address, price breakdown, and cancel functionality - 2026-06-24
- ✅ **404 Error Fix** - Fixed order placement redirect to show order details instead of 404 error - 2026-06-24

### In Progress
- No tasks currently in progress

### Pending Tasks
- [ ] **Customer Profile Page** - Create /customer/profile page for customer information and address management
- [ ] **Customer Orders List Page** - Create /customer/orders page for viewing all customer orders
- [ ] **Menu Edit Features** - Add edit menu, edit category, edit item, and modifier management UI
- [ ] **Outlet Edit Feature** - Add edit outlet modal for updating outlet details
- [ ] **Admin Dashboard Enhancements** - Add more dashboard widgets and features
- [ ] **API Documentation** - Add Swagger/OpenAPI docs

---

## Git Information

- **Current Branch:** `pooja_dev`
- **Main Branch:** `main`
- **Git User:** Pooja

---

## Coding Standards and Best Practices

> **IMPORTANT:** All code must follow these standards to maintain code quality, performance, and maintainability.

### Code Organization

- **DTOs (Data Transfer Objects):** All DTOs must be defined in separate `dto/` folders within each module
  - Do NOT define DTOs inline in controllers or services
  - Use class-validator decorators for validation
  - Pass DTOs to service methods instead of individual parameters
  - Example: `src/user-module/dto/create-user.dto.ts`

- **Services:** Business logic goes in services, not controllers
  - Controllers should only handle HTTP concerns (validation, parsing, response formatting)
  - Services contain the core business logic and database interactions

- **Error Handling:** All service methods must have try-catch blocks
  - Wrap database operations and external API calls in try-catch
  - Re-throw specific exceptions (BadRequestException, UnauthorizedException, etc.)
  - Provide generic error messages for unexpected failures
  - Example:
    ```typescript
    async createUser(data: CreateUserDto) {
      try {
        // Business logic here
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error; // Re-throw specific exceptions
        }
        throw new BadRequestException('Operation failed'); // Generic fallback
      }
    }
    ```

### Code Quality Principles

- **Keep it Simple:** Write clean, simple code that is easy to understand
  - Avoid unnecessary complexity
  - Prefer readability over cleverness
  - Keep functions focused and small
  - Avoid deep nesting

- **Performance:** Avoid N+1 query problems
  - Use Prisma's `include` or `select` for related data
  - Batch operations when possible
  - Use proper indexing in database
  - Example of BAD (N+1):
    ```typescript
    // BAD: Makes N+1 queries
    const users = await prisma.user.findMany();
    for (const user of users) {
      user.password = await prisma.userPassword.findUnique({ where: { userId: user.id } });
    }
    ```
  - Example of GOOD:
    ```typescript
    // GOOD: Single query with include
    const users = await prisma.user.findMany({
      include: { password: true },
    });
    ```

- **API Responses:** Keep responses minimal and focused
  - Return only necessary data
  - For mutations (create, update, delete), return success messages, not full objects
  - Example: `{ message: 'User created successfully' }` instead of full user object

- **Pagination:** Always use the shared `PaginationMeta` class for paginated responses
  - Extend `PaginationDto` in your module's query DTO (e.g., `GetUserDto extends PaginationDto`)
  - Use `PaginationMeta` to automatically calculate all pagination metadata
  - Example:
    ```typescript
    // In your DTO file
    export class GetUserDto extends PaginationDto {}

    // In your service
    async getAllUsers(dto: GetUserDto): Promise<PaginatedResponse<any>> {
      const { page, limit, skip } = dto;
      const [data, total] = await Promise.all([...]);
      const pagination = new PaginationMeta(total, page, limit);
      return { success: true, message: '...', data, pagination };
    }
    ```
  - `PaginationMeta` provides: `total`, `currentPage`, `perPage`, `totalPages`, `hasNextPage`, `hasPrevPage`, `nextPage`, `prevPage`, `from`, `to`

### Module Structure

Each module should follow this structure:
```
src/{module-name}/
├── dto/                    # All DTOs for this module
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── ...
├── entities/               # Entity definitions (if needed)
├── guards/                 # Module-specific guards
├── interfaces/             # TypeScript interfaces
├── {module-name}.controller.ts  # Controller (thin, HTTP concerns only)
├── {module-name}.service.ts     # Service (business logic)
├── {module-name}.module.ts      # Module definition
└── constants/             # Module constants
```

### Database Best Practices

- Use Prisma's type-safe queries
- Always use transactions for multi-step operations
- Use proper error handling for database operations
- Avoid raw SQL when Prisma can handle it
- Use `select` to limit returned fields for performance

### Testing

- All service methods should be unit testable
- Controllers should be tested separately
- Mock external dependencies (database, external APIs)

---

## Documentation Guidelines

> **IMPORTANT:** This README.md must be updated whenever:
> - New features or functionality are added
> - Changes are made to existing components/pages
> - New API endpoints are created
> - Architecture or structure changes occur
>
> This ensures the documentation stays current and serves as the single source of truth for the project.

---

## Notes

- This is a Next.js 16 project with breaking changes from previous versions
- Check `node_modules/next/dist/docs/` for Next.js API documentation
- Frontend uses Tailwind CSS 4 (latest major version)
- Backend uses NestJS 11 with latest conventions
- Database seeder uses `tsx` for ES module compatibility
- Role checks handled by decorators - service methods don't re-verify roles
