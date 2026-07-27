# Restaurant Project - Development Context

> **Last Updated:** 2026-07-27 (Email Integration + Daily Sales Report)
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
| Payment Gateway | Razorpay | ^2.9.6 |
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
│   │   │   ├── dashboard-module/   # Dashboard analytics module
│   │   │   │   ├── dto/        # Dashboard DTOs (DateRange enum)
│   │   │   │   ├── dashboard-module.controller.ts
│   │   │   │   ├── dashboard-module.service.ts
│   │   │   │   └── dashboard-module.module.ts
│   │   │   ├── database/       # Prisma service & module
│   │   │   ├── user-module/    # User management module
│   │   │   ├── restaurant-module/  # Restaurant management module
│   │   │   ├── outlet-module/      # Outlet management module
│   │   │   ├── payment-module/     # Payment processing (Razorpay)
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
│       │   ├── payment-method-selector.tsx  # Payment method selection (Razorpay/COD)
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
│       │   ├── payment-api.ts      # Payment API (Razorpay integration)
│       │   ├── razorpay-payment.ts # Razorpay checkout wrapper
│       │   ├── users-api.ts        # API functions for users
│       │   ├── restaurants-api.ts  # API functions for restaurants
│       │   ├── outlets-api.ts      # API functions for outlets
│       │   ├── dashboard-api.ts    # API functions for dashboard analytics
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

### Offer Management

**Models:**
- `Offer` - Main offer/discount table with validation rules, usage limits, date/time validity
- `OfferOutlet` - Junction table for outlet-specific offers
- `OfferCategory` - Junction table for category-specific offers
- `OfferMenuItem` - Junction table for item-specific offers (e.g., BOGO)
- `OfferUsage` - Track customer offer usage with order association and discount amounts

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
- `OfferType`: PERCENTAGE, FIXED, FREE_DELIVERY, BUY_ONE_GET_ONE
- `OfferStatus`: DRAFT, ACTIVE, PAUSED, EXPIRED, SCHEDULED
- `OfferScope`: PUBLIC, RESTAURANT, OUTLET
- `OfferCombinationType`: EXCLUSIVE, STACKABLE, BEST_DEAL

---

## Current Implementation Status

### Backend (NestJS)

| Module | Status | Notes |
|--------|--------|-------|
| App Module | ✅ Complete | ConfigModule, PrismaModule, RestaurantModule, OutletModule, CustomerModule, MenuModule, StorageModule, OrderModule, NotificationsModule, DashboardModule, OfferModule imported |
| Auth Module | ✅ Complete | JWT auth, role-based guards, decorators (for admin users) |
| Customer Module | ✅ Complete | Customer auth, profile, address management with auto-geocoding |
| User Module | ✅ Complete | Full CRUD operations for users |
| Restaurant Module | ✅ Complete | Restaurant CRUD with user assignment via RestaurantUser junction, auto-adds Admin/Manager to outlets |
| Outlet Module | ✅ Complete | Outlet CRUD with restaurant relationships, user management with role-based auto-assignment, public endpoint for customer browsing, auto-geocoding |
| Menu Module | ✅ Complete | Restaurant-level menus with categories, items, modifiers, and outlet-specific pricing |
| Order Module | ✅ Complete | Order creation, customer order history, order cancellation, order status updates, delivery address snapshot, WebSocket notifications (bidirectional), chef assignment, chef dashboard |
| Storage Module | ✅ Complete | Supabase storage service for image uploads |
| Notifications Module | ✅ Complete | WebSocket gateway for real-time order notifications (restaurant + customer) with dual JWT token support |
| Dashboard Module | ✅ Complete | Dashboard analytics with statistics, recent orders, revenue analytics, popular items, staff performance |
| **Offer Module** | ✅ **Complete** | **Discount/coupon system with 4 offer types (PERCENTAGE, FIXED, FREE_DELIVERY, BUY_ONE_GET_ONE), flexible BOGO (all items or specific items), auto coupon removal on cart changes, 3 scopes (PUBLIC, RESTAURANT, OUTLET), validation engine, calculation service, usage tracking, admin CRUD, customer apply/preview endpoints** |
| **Events Module** | ✅ **Complete** | **Event-driven architecture with EventEmitter2 for decoupled notification handling. Event listeners for order lifecycle (order.created, order.status.updated, order.cancelled, order.paid, delivery.agent.assigned, order.preparing, order.ready, order.delivered), customer registration, and offer usage tracking** |
| **Jobs Module** | ✅ **Complete** | **Scheduled tasks using @nestjs/schedule. Auto-cancel pending orders (>30 min), auto-expire/activate offers (hourly), daily sales report (8 AM). Extensible for token cleanup, analytics cache, and more** |
| **Email Module** | ✅ **Complete** | **Email service with @nestjs-modules/mailer + Nodemailer + Handlebars templates. Daily sales reports, order confirmations, welcome emails, order status updates, test emails. Gmail SMTP integration with environment-based configuration** |
| Common Module | ✅ Complete | GeocodingService with Nominatim API, shared DTOs and interfaces |
| Database Module | ✅ Complete | Global PrismaModule with adapter |
| Prisma Schema | ✅ Complete | Full schema with relations including OutletUser junction, Customer with CustomerAddress, Menu models, Order models, Offer models (Offer, OfferOutlet, OfferCategory, OfferMenuItem, OfferUsage), required lat/lng |
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
| Admin Dashboard | ✅ Complete | Protected dashboard with sidebar navigation (collapsible), notification bell, analytics widgets (stats cards, order status overview, recent orders table, quick stats) |
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
| Theme System | ✅ Complete (In Progress) | Emerald Fresh theme with global CSS variables (light + dark mode support) |
| Address Selector | ✅ Complete | Component for selecting/managing delivery addresses |
| Address Form | ✅ Complete | Modal for adding/editing customer addresses |
| Order Summary | ✅ Complete | Component displaying cart items, subtotal, delivery fee, total |
| Order API | ✅ Complete | API functions for createOrder, getMyOrders, getOrderById, cancelOrder, getOutletOrders, updateOrderStatus |
| Order Management | ✅ Complete | Admin orders page with status update interface, outlet selection, status filtering, all 7 order statuses |
| Customer Notifications | ✅ Complete | Real-time order status notifications for customers via WebSocket with notification bell and panel |
| Customer Notification Context | ✅ Complete | CustomerNotificationProvider with useCustomerNotifications hook |
| Customer Orders List | ✅ Complete | /customer/orders page for viewing all customer orders with pagination |
| Customer Notification Bell | ✅ Complete | Notification bell icon in customer header with unread count and connection status |
| Customer Notification Panel | ✅ Complete | Slide-out panel for customer order notifications with mark as read/clear options |
| Customer Profile Page | ✅ Complete | /customer/profile page for viewing and managing customer profile information, saved addresses |
| Customer Profile Edit | ✅ Complete | Profile form modal for editing name, email with validation and profile image upload |
| Customer Address Management | ✅ Complete | Full CRUD operations for addresses (add, edit, delete, set default) with checkout sync |
| Chef Dashboard | ✅ Complete | Kitchen dashboard with order pool, claim functionality, and status updates |
| Offer Module (Backend) | ✅ Complete | Full discount/coupon system with 4 offer types, validation, calculation, usage tracking, admin CRUD, customer endpoints |
| Offer Module (Frontend) | ✅ Complete | Admin offers page with full CRUD, status management, filtering, pagination, statistics modals |
| Offer Module - Customer | ✅ Complete | Offer code input component integrated in checkout with discount display, available offers list, error handling |

### Routing Structure

The application uses separate routing for admin and customer portals:

| Path | Purpose | Authentication |
|------|---------|----------------|
| `/` | Root redirect → `/customer` | Public |
| `/customer` | Customer portal - browse outlets with geolocation, distance sorting, notification bell, My Orders link | Customer JWT (optional for browsing, required for ordering) |
| `/customer/menu/[outletId]` | Menu browsing page with categories, items, modifiers, add to cart | Public (cart requires customer auth for checkout) |
| `/customer/checkout` | Checkout page with address selection, order summary, place order | Customer JWT required |
| `/customer/profile` | Customer profile page with address management and account settings | Customer JWT required |
| `/customer/orders` | Customer orders list page with status tracking | Customer JWT required |
| `/customer/orders/[orderId]` | Order details page with status, timeline, items, delivery address | Customer JWT required |
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
- **Color Palette**: Emerald Fresh - A fresh, organic palette conveying quality and freshness
  - **Primary:** Emerald Green (#10b981 / hsl(158, 64%, 52%))
  - **Secondary:** Warm Amber (#f59e0b / hsl(36, 88%, 57%))
  - **Accent:** Teal (#14b8a6 / hsl(173, 80%, 40%))
  - **Light Background:** Cream (#fafaf9 / hsl(40, 20%, 98%))
  - **Dark Background:** Deep Forest (#064e3b / hsl(160, 60%, 8%))
- **Global CSS Variables:** All colors defined in [`app/globals.css`](apps/frontend/app/globals.css) with HSL format
- **Dynamic Theming:** Change `globals.css` HSL values → entire app updates automatically
- **Light & Dark Mode:** Full dark mode support with deep forest background
- **Tailwind Integration:** Uses Tailwind CSS v4 with `@theme inline` for color mapping
- **Shadcn/ui Components:** All UI components use CSS variables (auto-update with theme changes)
- **Professional Typography:** Clear hierarchy with appropriate sizing
- **Responsive Spacing:** Adaptive padding for mobile/tablet/desktop

### Location Features
- **GPS Detection**: "Detect current location" button in header
- **Distance Sorting**: Automatic distance calculation and sorting
- **Location Display**: Current city shown in breadcrumb navigation
- **Distance Badges**: Color-coded distance badges on restaurant cards

### Payment Features
- **Payment Method Selection**: Choose between "Pay Online" or "Cash on Delivery" in checkout
- **Razorpay Integration**: Secure online payments via UPI, cards, wallets, netbanking
- **Payment Status Tracking**: View payment method and status in order details
- **COD Support**: Cash on Delivery option with "Pay at Delivery" status
- **Payment Badges**: Visual indicators for payment method in orders list
- **Transaction IDs**: View transaction IDs for online payments

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
| `/users/assignable` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Get assignable users (MANAGER, CHEF, DELIVERY_AGENT) | `page`, `limit` |
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

### Payment Management (Razorpay Integration)

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/payments/create-order` | POST | Customer JWT | Create Razorpay order for payment |
| `/payments/verify` | POST | Customer JWT | Verify Razorpay payment signature |
| `/payments/:orderId` | GET | Customer JWT | Get payment status by order ID |
| `/payments/create-payment-link` | POST | Admin JWT | Create Razorpay payment link for COD to UPI conversion (delivery agent) |
| `/payments/payment-link/:paymentLinkId/status` | GET | Admin JWT | Get payment link status to check if payment completed (delivery agent) |

**Payment Methods Supported:**
- **Online Payment**: UPI, Credit/Debit Cards, Wallets, Netbanking (via Razorpay)
- **Cash on Delivery (COD)**: Pay cash or UPI at delivery (delivery agent collects)

**Payment Flow:**
1. Customer selects payment method in checkout (Online or COD)
2. For **Online Payment**:
   - Frontend creates Razorpay order via `/payments/create-order`
   - Razorpay checkout modal opens for payment
   - After successful payment, signature verified via `/payments/verify`
   - Order created with `COMPLETED` payment status
3. For **COD**:
   - Order created directly with `CASH` payment method
   - Payment status set to `PENDING` (paid at delivery)
   - **At Delivery**: Delivery agent opens payment collection modal
     - If paying via **Cash**: Agent collects cash, confirms delivery
     - If paying via **UPI**: Agent selects UPI, QR code appears
       - QR code generated via `/payments/create-payment-link`
       - Customer scans QR code with any UPI app (GPay, PhonePe, Paytm)
       - System polls payment status every 3 seconds via `/payments/payment-link/:id/status`
       - When payment detected, "Confirm & Mark Delivered" button auto-enables
       - Agent confirms delivery with payment link ID as transaction ID

**Payment Status:**
- `COMPLETED`: Payment successful (online payments or collected at delivery)
- `PENDING`: Payment pending (COD - to be collected at delivery)
- `FAILED`: Payment failed (online payment attempt failed)
- `REFUNDED`: Payment refunded (cancellations)

### Order Management

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/orders/create` | POST | Customer JWT | - | Create order from cart | - |
| `/orders/my-orders` | GET | Customer JWT | - | Get customer's orders (paginated) | `page`, `limit` |
| `/orders/:id` | GET | Customer JWT | - | Get order by ID | - |
| `/orders/:id/cancel` | POST | Customer JWT | - | Cancel pending order | - |
| `/orders/by-outlet/:outletId` | GET | Admin JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get orders for outlet (paginated, optional status filter) | `page`, `limit`, `status` |
| `/orders/:id/status` | PUT | Admin JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Update order status (notifies customer) | - |
| `/orders/:id/delivery-agent` | PUT | Admin JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Assign delivery agent to order (auto-changes to OUT_FOR_DELIVERY, notifies agent & customer) | - |
| `/orders/delivery-agent/my-orders` | GET | Admin JWT | DELIVERY_AGENT | Get delivery agent's assigned orders (paginated) | `page`, `limit` |
| `/orders/:id/delivery-location` | PUT | Admin JWT | DELIVERY_AGENT | Update delivery agent location for order tracking | - |
| `/orders/:id/mark-delivered` | PUT | Admin JWT | DELIVERY_AGENT | Mark order as delivered (only assigned agent can mark) | `paymentMethod`, `transactionId` (optional for COD) |
| `/orders/chef/my-orders` | GET | Admin JWT | CHEF | Get chef's orders (pending + preparing) | `outletId` (optional) |
| `/orders/:id/claim` | POST | Admin JWT | CHEF | Claim an order (auto-assigns to chef, sets to PREPARING) | - |
| `/orders/:id/mark-ready` | PUT | Admin JWT | CHEF | Mark order as ready (only assigned chef can mark) | - |

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

**Order Status Flow:** PENDING → CONFIRMED → PREPARING → READY → (Assign Delivery Agent) → OUT_FOR_DELIVERY → (Delivery Agent marks) → DELIVERED (or CANCELLED)

**Important Delivery Workflow Rules:**
- Delivery agent MUST be assigned before order can be marked as OUT_FOR_DELIVERY
- Only the assigned delivery agent can mark an order as DELIVERED (not restaurant staff)
- When delivery agent is assigned to a READY order, status automatically changes to OUT_FOR_DELIVERY
- **Payment Verification**: Before marking an order as delivered, the system checks payment status:
  - If payment is `COMPLETED` (prepaid orders), delivery agent can directly mark as delivered
  - If payment is `PENDING` (COD orders), delivery agent must collect payment first via the payment collection modal
  - Delivery agent can record payments via CASH, UPI, or CARD with optional transaction ID
  - Payment record is automatically updated to `COMPLETED` status when delivery agent confirms payment collection

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
| `/menus/images` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | List all images from Supabase storage | `folder`, `limit`, `offset` |
| `/menus/images` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Delete image from Supabase storage | - |

### Public Menu Endpoints (No Authentication)

| Endpoint | Method | Auth Required | Description | Query Params |
|----------|--------|---------------|-------------|--------------|
| `/public/menus/outlet/:outletId` | GET | No | Get public menu with outlet pricing | - |
| `/public/menus/restaurant/:restaurantId` | GET | No | Get public menu for restaurant | - |

### Dashboard Analytics Endpoints

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/dashboard/stats` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get dashboard statistics (users, restaurants, outlets, customers, orders, revenue, order status counts, average order value, today's metrics, menu items) | `dateRange` (TODAY/WEEK/MONTH/YEAR/ALL), `restaurantId`, `outletId` |
| `/dashboard/recent-orders` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get recent orders with customer and outlet details | `limit` (default: 10), `outletId` |
| `/dashboard/revenue` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get revenue analytics (total revenue, payment method breakdown, outlet breakdown, daily trends) | `dateRange` (default: MONTH), `outletId` |
| `/dashboard/popular-items` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get popular items ranking (top ordered items with order count and revenue) | `limit` (default: 10), `outletId` |
| `/dashboard/staff-performance` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get staff performance metrics (chef preparation times, delivery agent delivery times, on-time rates) | `outletId` |

**Dashboard Date Range Options:**
- `TODAY` - Statistics for today only
- `WEEK` - Statistics from start of current week
- `MONTH` - Statistics from start of current month (default)
- `YEAR` - Statistics from start of current year
- `ALL` - All-time statistics

### Offer Management Endpoints (Admin)

| Endpoint | Method | Auth Required | Role Required | Description | Query Params |
|----------|--------|---------------|---------------|-------------|--------------|
| `/admin/offers` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Create new offer with validation | - |
| `/admin/offers` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get all offers with filters | `page`, `limit`, `type`, `status`, `scope`, `restaurantId`, `search` |
| `/admin/offers/:id` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get offer by ID with full details | - |
| `/admin/offers/:id` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update offer details | - |
| `/admin/offers/:id` | DELETE | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Soft delete offer (if not used) | - |
| `/admin/offers/:id/status` | PUT | JWT | SUPER_ADMIN, RESTAURANT_ADMIN | Update offer status (DRAFT/ACTIVE/PAUSED/EXPIRED) | - |
| `/admin/offers/:id/stats` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get offer usage statistics | - |
| `/admin/offers/stats/overview` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get overview statistics (total, active, draft, expired) | - |
| `/admin/offers/expiring` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get offers expiring within 7 days | - |
| `/admin/offers/popular` | GET | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Get most used offers | `limit` (default: 10) |
| `/admin/offers/validate` | POST | JWT | SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER | Validate offer code (testing) | - |

**Offer Types:**
- `PERCENTAGE` - X% off discount with optional max cap
- `FIXED` - ₹X off discount
- `FREE_DELIVERY` - Waive delivery fee
- `BUY_ONE_GET_ONE` - BOGO discount (flexible implementation):
  - **Without menu items specified**: Applies to ALL items in cart
  - **With menu items specified**: Applies only to those specific items
  - **Calculation**: For every 2 items of same type, customer pays for 1 (floor(quantity / 2) items are free)
  - **Example**: 4 items @ ₹199 = 2 paid + 2 free = ₹398 total (saves ₹398)

**Offer Scope:**
- `PUBLIC` - Available to all customers
- `RESTAURANT` - Restaurant-specific offers
- `OUTLET` - Outlet-specific offers

**Offer Status:**
- `DRAFT` - Not yet active
- `ACTIVE` - Currently available
- `PAUSED` - Temporarily disabled
- `EXPIRED` - Past end date
- `SCHEDULED` - Scheduled for future activation

**Offer Combination Types:**
- `EXCLUSIVE` - Cannot be combined with other offers
- `STACKABLE` - Can be combined with other offers
- `BEST_DEAL` - System picks best offer among applicable ones

**Validation Rules:**
- Date/time validity with day restrictions (0=Sunday to 6=Saturday)
- Minimum order amount requirements
- First-order-only offers
- Usage limits (global max uses & per-customer limit)
- Category/menu item applicability
- Outlet scope validation
- **BOGO Requirements**: At least 2 items required (total cart items if no specific items configured, or 2 qualifying items if specific items configured)

**Automatic Coupon Removal:**
- Applied coupons are automatically re-validated when cart changes (items added/removed, quantity updated)
- If cart falls below minimum requirements (e.g., below ₹399 for BOGO), coupon is automatically removed
- Re-validation happens in real-time as customer modifies cart

### Offer Endpoints (Customer)

| Endpoint | Method | Auth Required | Description | Query Params |
|----------|--------|---------------|-------------|--------------|
| `/offers` | GET | No | Get available offers for an outlet | `outletId` |
| `/offers/apply` | POST | Customer JWT | Apply offer code to cart | - |
| `/offers/preview` | POST | No | Preview discount without applying | - |
| `/offers/my-usage` | GET | Customer JWT | Get customer's offer usage history | - |
| `/offers/:id/check` | GET | Customer JWT | Check if customer can use offer | - |

**Offer Apply Request Body:**
```json
{
  "code": "SAVE20",
  "outletId": 1,
  "cartTotal": 500,
  "items": [
    {
      "menuItemId": 1,
      "name": "Burger",
      "price": 150,
      "quantity": 2,
      "categoryId": 5
    }
  ]
}
```

**Offer Apply Response:**
```json
{
  "success": true,
  "message": "Offer applied successfully",
  "data": {
    "discount": {
      "discountAmount": 100,
      "discountType": "PERCENTAGE",
      "originalAmount": 500,
      "finalAmount": 400,
      "savings": 100,
      "deliveryFeeWaived": false
    },
    "offer": {
      "id": 1,
      "name": "20% Off",
      "code": "SAVE20",
      "type": "PERCENTAGE"
    }
  }
}
```

### Email Management Endpoints

| Endpoint | Method | Auth Required | Role Required | Description |
|----------|--------|---------------|---------------|-------------|
| `/email/test` | POST | JWT | SUPER_ADMIN | Send test email to verify SMTP configuration |
| `/email/test-daily-report` | POST | JWT | SUPER_ADMIN | Get daily report scheduler information |

**Note:** Daily sales reports are sent automatically by the scheduler at 8 AM daily (Asia/Kolkata timezone) to the email configured in `EMAIL_TO` environment variable.

### Authentication Flow

1. **Database Seeding:** Run `pnpm run seed` to create Super Admin
2. **Login:** Super Admin logs in via `/auth/login` → receives JWT tokens
3. **Create Users:** Super Admin creates other users via `/users/create`
4. **Role Selection:** Frontend sends role in request body (no defaults)

### WebSocket Notifications

The system includes real-time bidirectional order notifications using WebSocket (Socket.io).

**Architecture:**
- **Backend:** NestJS WebSocket Gateway (`notifications.gateway.ts`) with room-based subscriptions
- **Frontend:** React Context Providers with Socket.io clients (admin + customer)

**Dual JWT Token Support:**
The gateway supports both admin and customer JWT tokens:
- Admin tokens use `JWT_SECRET` for verification
- Customer tokens use `CUSTOMER_JWT_SECRET` for verification
- Gateway tries admin secret first, falls back to customer secret

**Notification Flow:**

**Restaurant Side (Admins/Managers):**
1. **Connection:** Restaurant admins/managers connect via WebSocket when logged into dashboard
2. **Auto-Subscription:** Users automatically subscribed to restaurant rooms (`restaurant:{restaurantId}`)
3. **Order Events:** When orders are created/cancelled, notifications sent to restaurant rooms
4. **UI Updates:** Dashboard notification bell shows unread count and displays notifications

**Customer Side:**
1. **Connection:** Customers connect when logged in, auto-subscribed to personal room (`customer:{customerId}`)
2. **Status Updates:** When restaurant updates order status, notification sent to customer
3. **UI Updates:** Real-time notification with friendly message (e.g., "Your order #123 is being prepared. It won't be long!")

**Delivery Agent Side:**
1. **Connection:** Delivery agents connect when logged in, auto-subscribed to personal room (`delivery-agent:{agentId}`)
2. **Order Assignments:** When restaurant assigns delivery agent to order, notification sent to agent
3. **UI Updates:** Real-time notification with order details and delivery address

**Notification Types:**
- `order.created` - New order received (to restaurant)
- `order.updated` - Order status changed (to restaurant)
- `order.cancelled` - Order cancelled (to restaurant)
- `order.status.updated` - Order status updated by restaurant (to customer)
- `order.assigned` - Delivery agent assigned to order (to delivery agent)

**WebSocket Namespace:** `/notifications`

**Room Naming Convention:**
- `restaurant:{restaurantId}` - For restaurant admins/managers
- `customer:{customerId}` - For customers
- `delivery-agent:{agentId}` - For delivery agents

**Example Events:**

```typescript
// Backend emits to restaurant room (new order)
this.server.to(`restaurant:${restaurantId}`).emit('order.created', {
  orderId: 123,
  outletId: 5,
  outletName: "Downtown Branch",
  status: "PENDING",
  total: 450,
  items: [...],
  deliveryAddress: {...}
});

// Backend emits to customer room (status update)
this.server.to(`customer:${customerId}`).emit('order.status.updated', {
  orderId: 123,
  status: "CONFIRMED",
  previousStatus: "PENDING",
  total: 450
});

// Frontend receives and displays notification
notificationSocket.on('order.status.updated', (data) => {
  // Update customer notification
});
```

**Order Status Valid Transitions:**
- PENDING → CONFIRMED, CANCELLED
- CONFIRMED → PREPARING, CANCELLED
- PREPARING → READY (delivery agent must be assigned before OUT_FOR_DELIVERY)
- READY → OUT_FOR_DELIVERY (requires delivery agent assignment first)
- OUT_FOR_DELIVERY → DELIVERED (only by assigned delivery agent)
- DELIVERED → (no further transitions)
- CANCELLED → (no further transitions)

**Notification UI Components:**
- **Notification Bell** - Icon with unread count badge and connection status indicator
  - 🟢 Green dot = Connected to WebSocket
  - 🔴 Red dot = Disconnected from WebSocket
  - 🔔 Animated bell icon when unread notifications exist
- **Notification Panel** - Slide-out panel showing all notifications with mark as read/clear options

**Troubleshooting Notifications:**
- **No notification bell visible:** Check if logged in with proper role
- **Red dot (disconnected):** Check browser console for WebSocket errors, verify backend is running
- **No notifications received:** Verify user is assigned to restaurant/outlet in database
- **JWT errors:** Ensure JWT_SECRET and CUSTOMER_JWT_SECRET are set correctly

---

### Event-Driven Architecture

The system uses **Event-Driven Architecture** with EventEmitter2 for decoupled notification handling and extensible event processing.

**Architecture:**
- **Backend:** NestJS EventEmitter2 module (`events/`) with event listeners for order lifecycle, customer events, and offer tracking
- **Event Emission:** OrderService emits events at key lifecycle points using EventEmitter2
- **Event Listeners:** Dedicated listener classes handle events independently, enabling multiple consumers (WebSocket, future email/SMS, analytics)

**Event Types:**

| Event | Emitted When | Listeners | Purpose |
|-------|--------------|-----------|---------|
| `order.created` | New order placed | OrderListener | Notify restaurant, send confirmations, track analytics |
| `order.status.updated` | Order status changes | OrderListener | Notify customer, log history, update analytics |
| `order.cancelled` | Order cancelled | OrderListener | Notify restaurant and customer, release inventory |
| `order.paid` | Payment completed | OrderListener | Notify kitchen, send receipt, confirm order |
| `delivery.agent.assigned` | Agent assigned to order | OrderListener | Notify agent and customer, update status |
| `order.preparing` | Chef starts preparing | OrderListener | Notify restaurant of preparation start |
| `order.ready` | Order ready for delivery | OrderListener | Notify restaurant and customer |
| `order.delivered` | Order delivered | OrderListener | Notify customer, complete order |
| `customer.registered` | Customer signs up | CustomerListener | Send welcome email (future), init analytics |
| `offer.applied` | Offer code used | OfferListener | Log usage, track in analytics, decrement usage count |

**File Structure:**
```
apps/backend/src/events/
├── events.module.ts          # EventEmitter2 configuration
├── interfaces/
│   └── event-payloads.interface.ts  # TypeScript interfaces for all events
├── listeners/
│   ├── order.listener.ts      # Order event handlers
│   ├── customer.listener.ts   # Customer event handlers
│   └── offer.listener.ts      # Offer event handlers
└── dto/                       # (unused - events are internal, not HTTP endpoints)
```

**Example Event Flow:**
```typescript
// OrderService emits event
this.eventEmitter.emit('order.created', {
  orderId: order.id,
  outletId: order.outletId,
  customerId: order.customerId,
  total: Number(order.total),
  // ... more fields
});

// OrderListener handles event
@OnEvent('order.created')
async handleOrderCreated(payload: OrderCreatedEvent) {
  // 1. Notify restaurant via WebSocket
  await this.notificationsGateway.notifyOrderCreated(payload.outletId, {...});
  
  // 2. Future: Send SMS confirmation
  // await this.smsService.sendOrderConfirmation(payload);
  
  // 3. Future: Send email receipt
  // await this.emailService.sendOrderConfirmation(payload);
}
```

**Benefits:**
- **Decoupling:** Business logic separated from notification logic
- **Extensibility:** New consumers (email, SMS, analytics) can be added without modifying OrderService
- **Testability:** Event listeners can be tested independently
- **Audit Trail:** All events are logged for debugging and compliance
- **Non-Blocking:** Event emission is async and won't block order operations

**Configuration:**
- `wildcard: false` - Disabled for performance
- `maxListeners: 10` - Maximum listeners per event (prevents memory leaks)
- `verboseMemoryLeak: true` - Detects memory leaks in development

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
| **Order Management** |
| View CONFIRMED orders for outlet | ✅ | ✅ (own outlets) | ✅ (own outlets) | ✅ (own outlets, pending pool) | ❌ |
| Claim CONFIRMED orders | ❌ | ❌ | ❌ | ✅ (auto-assigns to self) | ❌ |
| View PREPARING orders assigned to self | ❌ | ❌ | ❌ | ✅ (own orders) | ❌ |
| Update CONFIRMED → PREPARING | ✅ | ✅ | ✅ | ❌ (via claim only) | ❌ |
| Update PREPARING → READY | ✅ | ✅ | ✅ | ✅ (own orders only) | ❌ |
| Assign delivery agent | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Outlet User Management** |
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

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=rzp_test_xxxxx

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Foodie Restaurant <your-email@gmail.com>
EMAIL_TO=your-email@gmail.com
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
4. Add Razorpay environment variables:
   - `RAZORPAY_KEY_ID` - Get from Razorpay Dashboard
   - `RAZORPAY_KEY_SECRET` - Get from Razorpay Dashboard

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
| `components/image-upload-component.tsx` | Enhanced image upload with Browse Media button and Upload New option |
| `components/media-gallery-modal.tsx` | Media gallery for browsing and selecting existing Supabase images |
| `components/ui/button.tsx` | shadcn Button component |
| `components/ui/card.tsx` | shadcn Card component |
| `components/ui/input.tsx` | shadcn Input component |
| `components/ui/label.tsx` | shadcn Label component |
| `components/ui/select.tsx` | shadcn Select component |
| `components/ui/table.tsx` | shadcn Table component |
| `components/ui/badge.tsx` | shadcn Badge component |
| `components/ui/dialog.tsx` | shadcn Dialog component |
| `components/notification-bell.tsx` | Notification bell icon with unread count badge and connection status indicator (admin) |
| `components/notification-panel.tsx` | Slide-out panel displaying all notifications with mark as read/clear options (admin) |
| `components/customer-notification-bell.tsx` | Customer notification bell icon with unread count badge and connection status |
| `components/customer-notification-panel.tsx` | Customer notification panel with order status updates and order navigation |
| `components/customer-header.tsx` | Shared header component for customer pages with Logo, Location, Profile, Orders, Notifications, and Logout (responsive - desktop shows all icons, mobile shows minimal icons) |
| `components/customer-bottom-nav.tsx` | Mobile-only sticky bottom navigation bar with Home, Orders, Profile, and Alerts tabs (hidden on desktop) |
| `components/payment-method-selector.tsx` | Payment method selection component (Razorpay/COD) with icons and selection state |
| `components/collect-payment-modal.tsx` | Payment collection modal for delivery agents to collect COD payments (Cash, UPI) with QR code for UPI payments |
| `components/profile-form-modal.tsx` | Profile edit modal for updating customer name and email with validation |
| `components/profile-image-upload.tsx` | Profile image upload component with live preview and image validation (max 5MB) |
| `lib/notifications-socket.ts` | WebSocket client service for admin/manager order notifications |
| `lib/notification-types.ts` | TypeScript types for admin notifications and notification data |
| `contexts/notification-context.tsx` | Admin notification state management with useNotifications hook |
| `lib/customer-notifications-socket.ts` | WebSocket client service for customer order status notifications |
| `contexts/customer-notification-context.tsx` | Customer notification state management with useCustomerNotifications hook |
| `app/page.tsx` | Root page - redirects to /customer |
| `app/customer/page.tsx` | Customer-facing page with outlet browsing, notification bell, My Orders link |
| `app/customer/menu/[outletId]/page.tsx` | Menu browsing page with categories, items, modifiers, add to cart |
| `app/customer/checkout/page.tsx` | Checkout page with address selection, order summary, place order |
| `app/customer/orders/[orderId]/page.tsx` | Order details page with status, timeline, items, delivery address, cancel |
| `app/customer/orders/page.tsx` | Customer orders list page with pagination, order tracking, status badges |
| `app/customer/profile/page.tsx` | Customer profile page with account info, address management, quick actions |
| `app/customer/checkout/page.tsx` | Checkout page with address selection, order summary, place order |
| `app/customer/orders/[orderId]/page.tsx` | Order details page with status, timeline, items, delivery address, cancel |
| `app/admin/login/page.tsx` | Admin login form (email/phone + password) |
| `app/dashboard/layout.tsx` | Dashboard layout with sidebar navigation, notification bell, logout, change password |
| `app/dashboard/page.tsx` | Dashboard home page with analytics widgets (statistics cards, order status overview, recent orders table, quick stats) |
| `app/dashboard/users/page.tsx` | Users list page with Create User button and password reset modal (Super Admin only) |
| `app/dashboard/restaurants/page.tsx` | Restaurants list page with pagination, Create Restaurant button (SUPER_ADMIN), and Add User modal (SUPER_ADMIN, RESTAURANT_ADMIN) |
| `app/dashboard/outlets/page.tsx` | Outlets list page with pagination, restaurant filter, and Create Outlet button (SUPER_ADMIN, RESTAURANT_ADMIN) |
| `app/dashboard/orders/page.tsx` | Orders management page with outlet selector, status filter, expandable order details, and status update dropdown (SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER) |
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
| `/dashboard/stats` | GET | Dashboard home page | Get dashboard statistics (users, restaurants, outlets, customers, orders, revenue, order status counts, average order value, today's metrics, menu items) |
| `/dashboard/recent-orders` | GET | Dashboard home page | Get recent orders with customer and outlet details |
| `/dashboard/revenue` | GET | Dashboard analytics | Get revenue analytics (payment method breakdown, outlet breakdown, daily trends) |
| `/dashboard/popular-items` | GET | Dashboard analytics | Get popular items ranking (top ordered items with order count and revenue) |
| `/dashboard/staff-performance` | GET | Dashboard analytics | Get staff performance metrics (chef preparation times, delivery agent delivery times, on-time rates) |

### Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Frontend Dependencies

**Key Libraries:**
- `framer-motion` ^11.18.0 - Animation library for smooth transitions
- `qrcode.react` ^4.2.0 - QR code generation for payment links
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
- ✅ **Notification Bell Desktop Integration** - Added notification bell to desktop sidebar with connection status indicator (green/red dot) - 2026-06-24
- ✅ **JWT Signature Fix** - Fixed JWT secret mismatch between Auth and Notifications modules causing "invalid signature" errors - 2026-06-24
- ✅ **WebSocket Token Payload Fix** - Fixed WebSocket authentication to use correct JWT payload structure (sub vs userId) - 2026-06-24
- ✅ **Notification Debugging** - Added comprehensive debugging tools for notification system including debug panel and console logging - 2026-06-24
- ✅ **Hydration Error Fix** - Fixed Next.js hydration errors in NotificationDebug component by implementing client-side only rendering - 2026-06-24
- ✅ **Order Status Management Backend** - Added getOutletOrders and updateOrderStatus methods with status transition validation - 2026-06-24
- ✅ **Order Status Update API** - Added GET /orders/by-outlet/:outletId and PUT /orders/:id/status endpoints - 2026-06-24
- ✅ **Customer Notification Gateway** - Added customer-specific rooms (customer:{customerId}) and notifyCustomerOrderUpdated method - 2026-06-24
- ✅ **Dual JWT Token Support** - Fixed NotificationsGateway to handle both admin and customer JWT tokens with different secrets - 2026-06-24
- ✅ **Customer Notification Context** - Created CustomerNotificationProvider and customer-notifications-socket.ts for customer notifications - 2026-06-24
- ✅ **Admin Orders Management Page** - Created /dashboard/orders page with outlet selector, status filter, and order status update dropdown - 2026-06-24
- ✅ **Order Status Transition Validation** - Frontend dropdown only shows valid next statuses matching backend validation - 2026-06-24
- ✅ **Debug Code Removal** - Removed NotificationDebug component from dashboard layout - 2026-06-24
- ✅ **Customer Notification Bell** - Created CustomerNotificationBell component for customer header with unread count badge and connection status - 2026-06-24
- ✅ **Customer Notification Panel** - Created CustomerNotificationPanel with order status notifications and navigation to order details - 2026-06-24
- ✅ **Customer Orders List Page** - Created /customer/orders page with pagination, order cards, status tracking, and empty state - 2026-06-24
- ✅ **Customer Header Enhancement** - Added notification bell and "My Orders" link to customer page header - 2026-06-24
- ✅ **Customer Notification Routing Fix** - Fixed notification routing to send order status updates only to customers (not restaurants) - 2026-06-24
- ✅ **Customer WebSocket Auth Fix** - Fixed notifications gateway to correctly extract customer ID from JWT payload.sub - 2026-06-24
- ✅ **Order Status Restoration** - Restored all 7 order statuses (PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED) - 2026-06-24
- ✅ **Payment Module Backend** - Implemented complete payment processing module with Razorpay integration - 2026-06-25
- ✅ **Razorpay Integration** - Created payment endpoints for creating orders, verifying signatures, and checking payment status - 2026-06-25
- ✅ **Payment Method Selector** - Created payment method selection component with COD and online payment options - 2026-06-25
- ✅ **Checkout Payment Flow** - Implemented complete payment flow in checkout with Razorpay checkout modal and COD support - 2026-06-25
- ✅ **Payment Records** - Orders now create payment records with method (CASH/CARD/UPI/WALLET) and status (PENDING/COMPLETED) - 2026-06-25
- ✅ **Payment API Functions** - Created frontend payment API functions for Razorpay order creation and verification - 2026-06-25
- ✅ **Payment Display** - Added payment information display in order details and orders list pages - 2026-06-25
- ✅ **Razorpay SDK Integration** - Implemented dynamic Razorpay SDK loading and secure checkout modal - 2026-06-25
- ✅ **Payment Gateway Fix** - Fixed payment order creation API response format to use standard wrapped format (success/message/data) - 2026-06-25
- ✅ **Payment Status Display** - Added payment method badges (Paid Online/COD) in restaurant orders page - 2026-06-25
- ✅ **Delivery Agent Assignment** - Created API endpoint and UI for assigning delivery agents to orders in restaurant dashboard - 2026-06-25
- ✅ **Delivery Agent Orders API** - Created endpoint for delivery agents to view their assigned orders - 2026-06-25
- ✅ **Delivery Staff Dashboard** - Created /dashboard/delivery page for delivery agents to manage deliveries with payment collection modal for COD orders - 2026-06-25
- ✅ **Delivery Agent Notifications** - Implemented real-time notifications for delivery agents when orders are assigned - 2026-06-25
- ✅ **Delivery Notification Context** - Created DeliveryNotificationProvider and delivery-notifications-socket.ts - 2026-06-25
- ✅ **Delivery Notification Bell** - Added notification bell component for delivery agents with unread count - 2026-06-25
- ✅ **Customer Delivery Agent Display** - Added delivery partner information in customer order details page - 2026-06-25
- ✅ **Outlet Users Phone Field** - Added phone field to available outlet users response for delivery agent display - 2026-06-25
- ✅ **Delivery Agent Assignment Requirement** - Backend validation requires delivery agent assignment before OUT_FOR_DELIVERY status - 2026-06-25
- ✅ **Delivery Agent Mark Delivered API** - Created endpoint for delivery agents to mark orders as delivered - 2026-06-25
- ✅ **Restaurant Staff Cannot Mark Delivered** - Removed DELIVERED status option from restaurant admin's status update - 2026-06-25
- ✅ **Delivery Agent Mark Delivered UI** - Added "Mark Delivered" button to delivery agent dashboard with confirmation dialog - 2026-06-25
- ✅ **Frontend TypeScript Fixes** - Fixed TypeScript errors in delivery page with proper type definitions - 2026-06-25
- ✅ **Payment Collection at Delivery** - Implemented payment verification before marking orders as delivered - 2026-06-25
  - Created CollectPaymentDto for recording COD payments (CASH, UPI)
  - Updated mark-delivered endpoint to verify payment status and accept payment details
  - Created payment collection modal for delivery agents to collect COD payments
  - Delivery dashboard now shows payment modal for COD orders, direct delivery for prepaid orders
  - Payment records automatically updated to COMPLETED when payment is collected
- ✅ **QR Code Payment for COD** - Implemented dynamic QR code generation for COD to UPI conversion at delivery - 2026-06-26
  - Added Razorpay Payment Links API integration (`createPaymentLink`, `getPaymentLinkStatus`)
  - Added backend endpoints: `POST /payments/create-payment-link`, `GET /payments/payment-link/:id/status`
  - Updated payment collection modal to show QR code when UPI is selected
  - Removed Card option from payment modal (only Cash and UPI available)
  - Added automatic payment status polling every 3 seconds when QR code is displayed
  - Added fallback payment link display if QR scan fails
  - Added "Confirm & Mark Delivered" button auto-enables when payment is completed
  - Customer scans QR code with any UPI app (GPay, PhonePe, Paytm) to pay at delivery
- ✅ **Chef Dashboard Implementation** - Hybrid pool-based approach with auto-assignment for order preparation - 2026-06-29
  - Added `chefId`, `startedAt`, `completedAt` fields to Order model in Prisma schema
  - Created fresh database migration (`20260629064816_init`) for all tables including chef fields
  - Added chef DTOs: `ClaimOrderDto`, `MarkOrderReadyDto`
  - Implemented chef order management methods in OrderService: `getChefOrders()`, `claimOrder()`, `markOrderReady()`
  - Added chef endpoints: `GET /orders/chef/my-orders`, `POST /orders/:id/claim`, `PUT /orders/:id/mark-ready`
  - Updated NotificationsGateway with chef notification methods: `notifyOrderPreparing()`, `notifyOrderReady()`
  - Created chef types: `ChefOrder`, `ChefOrderPool` interfaces in order-types.ts
  - Created chef API functions in chef-api.ts
  - Built `/dashboard/chef` page with order pool interface, claim functionality, and status updates
  - Added Kitchen navigation item for CHEF role in dashboard sidebar
  - Updated admin orders page to display chef names for PREPARING orders
  - Updated Order model relation to include chef assignment tracking
- ✅ **Authentication & API Fixes** - Fixed token handling and user management endpoints - 2026-06-30
  - Fixed chef-api.ts to use `accessToken` instead of `token` for localStorage authentication
  - Created `/users/assignable` endpoint for fetching assignable users (MANAGER, CHEF, DELIVERY_AGENT)
  - Added `getAssignableUsers()` service method accessible by SUPER_ADMIN and RESTAURANT_ADMIN
  - Added frontend `getAssignableUsers()` function in users-api.ts
  - Updated AddRestaurantUserModal to use new endpoint, fixing "Forbidden" errors for RESTAURANT_ADMIN
  - Fixed orders page to use `getOutletUsers` instead of `getAvailableOutletUsers` for delivery agent dropdown
  - Delivery agents now correctly appear in dropdown when they are assigned to the outlet
- ✅ **Media Gallery Feature** - Implemented Supabase image management for menu items - 2026-06-30
  - Added backend endpoints: `GET /menus/images` (list images), `DELETE /menus/images` (delete images)
  - Created `MediaGalleryModal` component for browsing and selecting existing images from Supabase
  - Enhanced `ImageUploadComponent` with "Browse Media" and "Upload New" buttons
  - Images are filtered to exclude `.emptyFolderPlaceholder` and hidden files
  - Users can now reuse existing images to avoid duplicates in Supabase storage
  - Delete functionality with confirmation dialog for removing wrong images
- ✅ **Customer Profile Page** - Implemented complete customer profile management - 2026-06-30
  - Created `/customer/profile` page with profile information display and editing
  - Created `ProfileImageUpload` component for profile picture management with live preview
  - Created `ProfileFormModal` component for editing name and email with validation
  - Integrated existing `AddressForm` and `AddressSelector` components for address management
  - Added "My Profile" link to customer page header navigation
  - Fixed address sync issue: addresses added during checkout now appear in profile page
  - Profile page displays customer status badge, contact info, and saved addresses
  - Full address CRUD operations: add, edit, delete, set default
  - Responsive design with orange/amber theme and Framer Motion animations
- ✅ **Menu Edit Features** - Implemented complete menu editing system - 2026-06-30
  - Created `EditMenuModal` for editing menu name, description, and status
  - Created `EditCategoryModal` for editing category name and display order
  - Created `EditMenuItemModal` for editing item details, pricing, dietary info, and image
  - Created `ModifierManagement` component for managing modifier groups and options
  - Created `CreateModifierGroupModal` and `EditModifierGroupModal` for modifier groups
  - Created `CreateModifierOptionModal` and `EditModifierOptionModal` for modifier options
  - Integrated all edit modals into menus dashboard with edit buttons
  - Added modifier count display on menu items
  - Expandable modifier groups with option management
  - Full CRUD operations for modifiers with validation and error handling
- ✅ **Dashboard Enhancements** - Implemented comprehensive dashboard analytics - 2026-06-30
  - Created backend dashboard module with statistics endpoints (`/dashboard/stats`, `/dashboard/recent-orders`, `/dashboard/revenue`, `/dashboard/popular-items`, `/dashboard/staff-performance`)
  - Implemented `DashboardService` with data aggregations for orders, revenue, users, restaurants, outlets, customers
  - Added support for date range filtering (today, week, month, year, all-time)
  - Created frontend dashboard API functions in `lib/dashboard-api.ts`
  - Updated dashboard page with real-time statistics cards
  - Added order status overview widget with 6 status indicators
  - Added recent orders table with order details and status badges
  - Added quick stats section showing restaurants, outlets, users, and menu items
  - Implemented currency formatting and time display
  - Added loading states and error handling
  - Personalized welcome message with user's first name
- ✅ **Admin Dashboard Analytics Module** - Full backend and frontend dashboard implementation - 2026-06-30
  - **Backend DashboardModule (`apps/backend/src/dashboard-module/`)**:
    - `DashboardModule` - Complete module with controller, service, DTOs
    - `DashboardService` - Core analytics service with 5 main methods:
      - `getDashboardStats()` - Overall statistics (users, restaurants, outlets, customers, orders, revenue, order status counts, average order value, today's metrics, menu items)
      - `getRecentOrders()` - Recent orders with customer details and outlet information
      - `getRevenueAnalytics()` - Revenue breakdown by payment method, by outlet, daily trends
      - `getPopularItems()` - Top ordered items with order count and revenue
      - `getStaffPerformance()` - Chef and delivery agent performance metrics
    - `DashboardController` - 5 protected endpoints:
      - `GET /dashboard/stats` - Dashboard statistics with date range, restaurant, outlet filters
      - `GET /dashboard/recent-orders` - Recent orders with pagination
      - `GET /dashboard/revenue` - Revenue analytics with payment method and outlet breakdown
      - `GET /dashboard/popular-items` - Popular items ranking
      - `GET /dashboard/staff-performance` - Staff performance metrics
    - `DateRange` enum - TODAY, WEEK, MONTH, YEAR, ALL for flexible filtering
    - Role-based access - SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER
  - **Frontend Dashboard Page (`apps/frontend/app/dashboard/page.tsx`)**:
    - Personalized welcome message with user's first name
    - **4 Main Statistics Cards**: Total Orders (with today's count), Total Revenue (with today's revenue), Total Customers, Average Order Value
    - **Order Status Overview Widget** - 6 status indicators: Pending (yellow), Confirmed (blue), Preparing (purple), Ready (indigo), Out for Delivery (orange), Delivered (green)
    - **Recent Orders Table** - Latest 5 orders with order number, status badge, customer name, outlet, total, time
    - **Quick Stats Section** - Total Restaurants, Outlets, Users, Active Menu Items, Cancelled Orders alert
    - Currency formatting (USD), responsive design, loading states, error handling
  - **Frontend Dashboard API (`apps/frontend/lib/dashboard-api.ts`)**:
    - TypeScript interfaces for all dashboard data types
    - API functions: `getDashboardStats()`, `getRecentOrders()`, `getRevenueAnalytics()`, `getPopularItems()`, `getStaffPerformance()`
    - Query parameter support for date range, restaurant, outlet filtering
- ✅ **API Documentation (Swagger/OpenAPI)** - Implemented comprehensive API documentation - 2026-06-30
  - **Swagger Configuration (`apps/backend/src/main.ts`)**:
    - Installed `@nestjs/swagger` package
    - Configured Swagger with DocumentBuilder including:
      - API title: "Restaurant Management API"
      - Comprehensive description with module overview
      - Version 1.0
      - Tags for all modules: Auth, Users, Restaurants, Outlets, Customers, Menus, Orders, Payments, Dashboard, Public
      - Bearer auth configuration with JWT
      - Contact, license, and external documentation links
    - Swagger UI setup at `/api-docs` endpoint with:
      - Persist authorization enabled
      - Request duration display
      - Syntax highlighting (Monokai theme)
      - Custom site title
    - Console logging for server URL and documentation URL
  - **Swagger Decorators Added**:
    - **Auth Module**: `@ApiTags('Auth')`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiBearerAuth` decorators for login, refresh, profile, logout, admin-only endpoints
    - **Auth DTOs**: `@ApiProperty`, `@ApiPropertyOptional` decorators for LoginDto, RefreshTokenDto
    - **Users Module**: Full Swagger decorators for all CRUD endpoints with role descriptions
    - **Users DTOs**: `@ApiProperty` decorators for CreateUserDto, ChangePasswordDto, UpdateUserDto
    - **Dashboard Module**: Complete API documentation with detailed schemas for all 5 endpoints
    - **Dashboard DTOs**: `@ApiPropertyOptional` decorator for GetDashboardStatsDto with DateRange enum
    - **Customers Module**: Full Swagger decorators for authentication, profile, and address management endpoints
  - **API Documentation Access**:
    - Development: http://localhost:3001/api-docs
    - Production: https://restaurant-t24q.onrender.com/api-docs
  - **Features**:
    - Interactive API testing with "Try it out" button
    - JWT Bearer token authentication support
    - Request/response schema examples
    - Enum values displayed as dropdowns
    - Role-based access documentation
    - Comprehensive error responses (401, 403, 404, etc.)
- ✅ **Cart Sync Across Devices** - Complete server-side cart system with cross-device synchronization - 2026-07-01
  - **Database Schema**: `CustomerCart` and `CartItem` models with unique constraint on (customerId, outletId)
  - **Cart API Endpoints**:
    - `GET /customers/cart?outletId=123` - Get customer's cart for specific outlet
    - `POST /customers/cart/items` - Add item to cart (or update quantity if exists)
    - `PUT /customers/cart/items/:id` - Update cart item quantity
    - `DELETE /customers/cart/items/:id` - Remove item from cart
    - `DELETE /customers/cart?outletId=123` - Clear cart for specific outlet
  - **Bug Fixes**:
    - **Fixed req.user.customerId**: Cart controller was using `req.user.sub` but customer JWT returns `customerId` - caused all cart operations to fail silently
    - **Fixed Race Condition**: Used `upsert` instead of `create` to handle concurrent cart creation requests
    - **Fixed Modifiers Parsing**: Server returns modifiers as JSON string, added parsing logic to convert to array for frontend use
    - **Fixed Frontend Sync**: Cart operations now update local state with server response to maintain correct server IDs
  - **Frontend Enhancements**:
    - `setOutletInfo()` - Syncs from server when user is authenticated and cart is empty or outlet changes
    - `addToCart()` - Updates local cart with server response after successful sync
    - `updateQuantity()` - Syncs with server response to maintain correct IDs
    - `removeFromCart()` - Syncs with server response to maintain correct IDs
    - Added comprehensive error logging and detailed error messages
  - **Cross-Device Sync**: When customer adds items on PC, they automatically appear on mobile upon login and visiting the outlet page
  - **Race Condition Handling**: Uses Prisma `upsert` for atomic cart creation - handles concurrent requests safely
- ✅ **Mobile Navigation Enhancement** - Implemented responsive customer navigation with mobile bottom nav - 2026-07-01
  - **CustomerHeader Component**: Shared header component for all customer pages
    - Logo, Location detection button, and Logout button on all screens
    - Desktop (sm+): Shows Profile, Orders, Notification Bell, User Name in header
    - Mobile: Minimal header with only Logo, Location, Logout
  - **CustomerBottomNav Component**: Mobile-only sticky bottom navigation
    - 4 tabs: Home, Orders, Profile, Alerts
    - Fixed to bottom of screen on mobile devices (lg:hidden)
    - Active state highlighting for current page
    - Integrated CustomerNotificationBell for Alerts tab
  - **Responsive Design**:
    - Mobile: Header (Logo, Location, Logout) + Bottom Nav (Home, Orders, Profile, Alerts)
    - Desktop: Header (Logo, Location, Profile, Orders, Notifications, User Name, Logout)
  - **Hydration Fix**: Used `<div>` instead of `<button>` for Alerts tab to avoid nested button elements
  - **Updated Pages**: customer/page.tsx, customer/orders/page.tsx, customer/profile/page.tsx use new components
- ✅ **Profile Image Mobile Centering Fix** - Fixed profile image layout on mobile view - 2026-07-01
  - Updated profile page flex container to use `items-center sm:items-start`
  - Profile image now centered horizontally on mobile (< 640px) as per design
  - Desktop layout (≥ 640px) remains unchanged with side-by-side alignment
  - Verified shadcn/ui components are used consistently across the project
- ✅ **Emerald Fresh Color Theme - Complete Implementation** - Full Emerald Fresh palette applied across entire app - 2026-07-02
  - **Global CSS Variables** ([`app/globals.css`](apps/frontend/app/globals.css)):
    - Primary: Emerald (#10b981) - Was red-orange (#e73c2e)
    - Secondary: Warm Amber (#f59e0b) - Kept same
    - Accent: Teal (#14b8a6) - Was amber
    - Light Background: Cream (#fafaf9) - Was warm cream (#fffaf0)
    - Dark Background: Deep Forest (#064e3b) - New dark mode support
  - **Updated Components** (All modals, forms, and UI components):
    - Modals: [`create-user-modal.tsx`](apps/frontend/components/create-user-modal.tsx), [`create-restaurant-modal.tsx`](apps/frontend/components/create-restaurant-modal.tsx), [`create-outlet-modal.tsx`](apps/frontend/components/create-outlet-modal.tsx), [`create-category-modal.tsx`](apps/frontend/components/create-category-modal.tsx), [`create-menu-item-modal.tsx`](apps/frontend/components/create-menu-item-modal.tsx), [`create-menu-modal.tsx`](apps/frontend/components/create-menu-modal.tsx), [`edit-restaurant-modal.tsx`](apps/frontend/components/edit-restaurant-modal.tsx), [`edit-outlet-modal.tsx`](apps/frontend/components/edit-outlet-modal.tsx), [`edit-menu-modal.tsx`](apps/frontend/components/edit-menu-modal.tsx), [`edit-category-modal.tsx`](apps/frontend/components/edit-category-modal.tsx), [`edit-menu-item-modal.tsx`](apps/frontend/components/edit-menu-item-modal.tsx), [`profile-form-modal.tsx`](apps/frontend/components/profile-form-modal.tsx), [`address-form.tsx`](apps/frontend/components/address-form.tsx), [`address-selector.tsx`](apps/frontend/components/address-selector.tsx), [`order-summary.tsx`](apps/frontend/components/order-summary.tsx), [`customer-auth-sheet.tsx`](apps/frontend/components/customer-auth-sheet.tsx), [`add-restaurant-user-modal.tsx`](apps/frontend/components/add-restaurant-user-modal.tsx), [`add-outlet-user-modal.tsx`](apps/frontend/components/add-outlet-user-modal.tsx), [`collect-payment-modal.tsx`](apps/frontend/components/collect-payment-modal.tsx), [`payment-method-selector.tsx`](apps/frontend/components/payment-method-selector.tsx), [`modifier-management.tsx`](apps/frontend/components/modifier-management.tsx)
    - Image/Profile: [`image-upload-component.tsx`](apps/frontend/components/image-upload-component.tsx), [`profile-image-upload.tsx`](apps/frontend/components/profile-image-upload.tsx), [`media-gallery-modal.tsx`](apps/frontend/components/media-gallery-modal.tsx)
    - Other: [`edit-user-modal.tsx`](apps/frontend/components/edit-user-modal.tsx), [`change-password-modal.tsx`](apps/frontend/components/change-password-modal.tsx)
  - **Updated Pages** (All dashboard and customer pages):
    - Dashboard: [`chef/page.tsx`](apps/frontend/app/dashboard/chef/page.tsx), [`create-user/page.tsx`](apps/frontend/app/dashboard/create-user/page.tsx), [`delivery/page.tsx`](apps/frontend/app/dashboard/delivery/page.tsx), [`layout.tsx`](apps/frontend/app/dashboard/layout.tsx), [`menus/page.tsx`](apps/frontend/app/dashboard/menus/page.tsx), [`orders/page.tsx`](apps/frontend/app/dashboard/orders/page.tsx), [`outlets/page.tsx`](apps/frontend/app/dashboard/outlets/page.tsx), [`page.tsx`](apps/frontend/app/dashboard/page.tsx), [`restaurants/page.tsx`](apps/frontend/app/dashboard/restaurants/page.tsx), [`users/page.tsx`](apps/frontend/app/dashboard/users/page.tsx)
    - Customer: [`checkout/page.tsx`](apps/frontend/app/customer/checkout/page.tsx), [`menu/[outletId]/page.tsx`](apps/frontend/app/customer/menu/[outletId]/page.tsx), [`orders/page.tsx`](apps/frontend/app/customer/orders/page.tsx), [`orders/[orderId]/page.tsx`](apps/frontend/app/customer/orders/[orderId]/page.tsx), [`profile/page.tsx`](apps/frontend/app/customer/profile/page.tsx), [`page.tsx`](apps/frontend/app/page.tsx)
  - **Color Replacements Applied**:
    - `from-red-600 to-orange-500` → `from-emerald-600 to-teal-500`
    - `text-orange-*` → `text-emerald-*`
    - `text-amber-*` → `text-teal-*`
    - `bg-orange-*` → `bg-emerald-*`
    - `bg-amber-*` → `bg-teal-*`
    - `border-orange-*` → `border-emerald-*`
    - `hover:text-orange-*` → `hover:text-emerald-*`
    - `hover:bg-orange-*` → `hover:bg-emerald-*`
    - `shadow-orange-*` → `shadow-emerald-*`
    - `shadow-red-*` → `shadow-emerald-*`
- ✅ **Hover Effects & Icon Visibility Fixes** - Fixed all hover gradients and icon visibility issues - 2026-07-02
  - **Hover Gradients Fixed** (red/orange → emerald/teal):
    - [`dashboard/layout.tsx`](apps/frontend/app/dashboard/layout.tsx) - Sidebar navigation active state (desktop + mobile)
    - [`dashboard/users/page.tsx`](apps/frontend/app/dashboard/users/page.tsx) - Create User button
    - [`dashboard/create-user/page.tsx`](apps/frontend/app/dashboard/create-user/page.tsx) - Submit button
    - [`dashboard/outlets/page.tsx`](apps/frontend/app/dashboard/outlets/page.tsx) - Create Outlet button
    - [`dashboard/restaurants/page.tsx`](apps/frontend/app/dashboard/restaurants/page.tsx) - Create Restaurant button
  - **Button Gradients Fixed** (red/orange → emerald/teal + text-white):
    - [`create-modifier-group-modal.tsx`](apps/frontend/components/create-modifier-group-modal.tsx)
    - [`create-modifier-option-modal.tsx`](apps/frontend/components/create-modifier-option-modal.tsx)
    - [`edit-modifier-group-modal.tsx`](apps/frontend/components/edit-modifier-group-modal.tsx)
    - [`edit-modifier-option-modal.tsx`](apps/frontend/components/edit-modifier-option-modal.tsx)
    - [`create-category-modal.tsx`](apps/frontend/components/create-category-modal.tsx)
    - [`create-menu-item-modal.tsx`](apps/frontend/components/create-menu-item-modal.tsx)
    - [`create-menu-modal.tsx`](apps/frontend/components/create-menu-modal.tsx)
    - [`edit-category-modal.tsx`](apps/frontend/components/edit-category-modal.tsx)
    - [`edit-menu-item-modal.tsx`](apps/frontend/components/edit-menu-item-modal.tsx)
    - [`edit-menu-modal.tsx`](apps/frontend/components/edit-menu-modal.tsx)
    - [`media-gallery-modal.tsx`](apps/frontend/components/media-gallery-modal.tsx)
    - [`menus/page.tsx`](apps/frontend/app/dashboard/menus/page.tsx) - Create Menu button
  - **Page Backgrounds Fixed** (orange/amber/rose → emerald/teal/green):
    - All customer pages now use `from-emerald-50 via-teal-50 to-green-50` gradient
    - [`customer/checkout/page.tsx`](apps/frontend/app/customer/checkout/page.tsx) - All 3 occurrences
    - [`customer/menu/[outletId]/page.tsx`](apps/frontend/app/customer/menu/[outletId]/page.tsx) - All 3 occurrences + item image placeholder
    - [`customer/orders/[orderId]/page.tsx`](apps/frontend/app/customer/orders/[orderId]/page.tsx) - All 3 occurrences
  - **Admin Dashboard Background Fixed**:
    - Removed all `dark:` prefixed classes from [`dashboard/layout.tsx`](apps/frontend/app/dashboard/layout.tsx)
    - Changed from dark emerald background to light `from-emerald-50 via-teal-50 to-green-50` gradient
    - All text now clearly visible with proper contrast
  - **Icon Visibility Fixed**:
    - Added conditional `text-white` class to active navigation icons in sidebar
    - All gradient buttons now have `text-white` class for proper icon visibility
    - Fixed icons: Plus, Loader2, Check, and navigation icons
- ✅ **Offer Module - Complete Discount System** - Full-featured coupon/discount system - 2026-07-03
  - **Database Schema**: Offer models with Offer, OfferOutlet, OfferCategory, OfferMenuItem, OfferUsage tables
  - **Offer Types**: PERCENTAGE (% off), FIXED (₹ off), FREE_DELIVERY (waive delivery fee), BUY_ONE_GET_ONE
  - **Offer Scope**: PUBLIC (all customers), RESTAURANT (restaurant-specific), OUTLET (outlet-specific)
  - **Offer Services**:
    - `OfferValidationService` - Validates offer status, dates, time, days, usage limits, applicability
    - `OfferCalculationService` - Calculates discounts for all offer types with max caps
    - `OfferQueryService` - CRUD operations with filtering, pagination, search
    - `OfferTransactionService` - Create/update/delete offers with junction table management
    - `OfferUsageService` - Track customer usage, enforce limits, statistics
  - **Admin Endpoints** (`/admin/offers`):
    - `POST /admin/offers` - Create offer with validation
    - `GET /admin/offers` - List with filters (type, status, scope, restaurant, search)
    - `GET /admin/offers/:id` - Get offer with full details
    - `PUT /admin/offers/:id` - Update offer
    - `DELETE /admin/offers/:id` - Soft delete (if not used)
    - `PUT /admin/offers/:id/status` - Change status (DRAFT→ACTIVE→PAUSED→EXPIRED)
    - `GET /admin/offers/:id/stats` - Usage statistics
    - `GET /admin/offers/stats/overview` - Overview stats
    - `GET /admin/offers/expiring` - Offers expiring within 7 days
    - `GET /admin/offers/popular` - Most used offers
    - `POST /admin/offers/validate` - Test offer code validity
  - **Customer Endpoints** (`/offers`):
    - `GET /offers?outletId=X` - Get available offers for outlet
    - `POST /offers/apply` - Apply offer to cart (returns discount calculation)
    - `POST /offers/preview` - Preview discount without applying
    - `GET /offers/my-usage` - Customer's usage history
    - `GET /offers/:id/check` - Check if customer can use offer
  - **Validation Features**:
    - Date/time validity with day-of-week restrictions (0=Sunday to 6=Saturday)
    - Time range validation (HH:MM format)
    - Minimum order amount requirements
    - First-order-only offers
    - Global usage limits (maxUses) and per-customer limits (maxUsesPerCustomer)
    - Category/menu item applicability filtering
    - Outlet scope validation for restaurant/outlet-specific offers
    - Automatic expiration of past-due offers
    - Automatic activation of scheduled offers
  - **Discount Calculation**:
    - PERCENTAGE: Cart discount with optional max cap (maxDiscountAmount)
    - FIXED: Flat amount discount
    - FREE_DELIVERY: Waives delivery fee
    - BUY_ONE_GET_ONE: Free item (cheapest) from qualifying items
  - **Offer Combination Rules**:
    - EXCLUSIVE: Cannot be combined with other offers
    - STACKABLE: Multiple offers can apply (sums discounts)
    - BEST_DEAL: System picks highest discount from applicable offers
  - **Order Integration Ready**:
    - Order model has `appliedOfferId`, `appliedOfferDiscount`, `appliedOfferCode` fields
    - Offer usage tracking on order completion
    - Usage reversion on order cancellation
  - **BOGO Offer Fix** (2026-07-06): Made menu items optional for BOGO offers - can now create general BOGO offers that apply to all cart items without restricting to specific menu items
- ✅ **Offer Module Enhancements** - Enhanced BOGO calculation and automatic coupon removal - 2026-07-08
  - **Flexible BOGO Implementation**: BOGO now works in two modes:
    - **Without specific menu items**: Applies to ALL items in cart (more generous)
    - **With specific menu items**: Applies only to those items (more controlled)
    - **Calculation**: For every 2 items of same type, customer pays for 1 (floor(quantity / 2) items free)
    - **Example**: 4 items @ ₹199 = 2 paid + 2 free = ₹398 total (saves ₹398)
  - **Automatic Coupon Removal**:
    - Applied coupons are automatically re-validated when cart changes
    - If cart falls below minimum requirements (e.g., below ₹399), coupon is auto-removed
    - Re-validation happens in real-time as customer modifies cart (items added/removed, quantity changed)
  - **Enhanced Validation**: BOGO requires at least 2 items (total or qualifying, depending on configuration)
- ✅ **Auto-Cancel Pending Orders Scheduler** - Implemented scheduled task using @nestjs/schedule to automatically cancel orders stuck in PENDING status for more than 30 minutes - 2026-07-22
  - **Cron Schedule**: Runs every 15 minutes (`@Cron('*/15 * * * *')`)
  - **JobsModule**: Created new module with ScheduleModule.forRoot() configuration
  - **OrderCleanupScheduler**: Finds and batch updates stale orders to CANCELLED status
  - **Event Integration**: Emits `order.cancelled` event for each auto-cancelled order, triggering WebSocket notifications to restaurant and customer
  - **Performance**: Single query to fetch stale orders, batch update with `updateMany()` - no N+1 problem
  - **Extensibility**: JobsModule structure allows easy addition of future scheduled tasks (daily reports, token cleanup, offer expiration)
  - **Updated Frontend Components**:
    - `OfferCodeInput` component now accepts `cartSubtotal` and `cartItems` props for re-validation
    - Added `categoryId` field to cart items for proper offer validation
    - Improved BOGO savings display with "Buy 1 Get 1 Free" label
- ✅ **Offer Lifecycle Scheduler** - Implemented hourly cron for automatic offer status transitions - 2026-07-27
  - **Cron Schedule**: Runs at the top of every hour (`@Cron('0 0 * * * *')`)
  - **OfferLifecycleScheduler**: Three batch operations (single query each):
    - Expire ACTIVE offers past their `endDate` → EXPIRED status
    - Activate SCHEDULED offers whose `startDate` has arrived (and within `endDate`) → ACTIVE status
    - Expire exhausted offers where `currentUses >= maxUses` → EXPIRED status
  - **Pattern**: Follows same architecture as OrderCleanupScheduler (PrismaService, Logger, try-catch, batch updateMany)
  - **Performance**: No N+1 queries — three single-query fetches + batch updates
  - **Logging**: Emits count summaries for each operation
  - **JobsModule**: Extended to register OfferLifecycleScheduler provider
- ✅ **Daily Sales Report Scheduler** - Implemented daily cron for generating sales reports - 2026-07-27
  - **Cron Schedule**: Runs at 8 AM daily (`@Cron('0 0 8 * * *')`) with Asia/Kolkata timezone
  - **DailySalesReportScheduler**: Comprehensive daily analytics with:
    - Total revenue, order count, average order value
    - Payment method breakdown (Online vs Cash)
    - Order status breakdown
    - Restaurant/Outlet performance metrics
    - Top 10 selling items by quantity
    - New customer count
    - Recent orders (last 5) with full details
  - **Pattern**: Follows same architecture as OrderCleanupScheduler and OfferLifecycleScheduler
  - **Performance**: Single query for orders with full relations (items, payment, outlet.restaurant, customer), batch aggregation in-memory
  - **Logging**: Formatted report output with emoji indicators and structured sections
  - **JobsModule**: Extended to register DailySalesReportScheduler provider
  - **Email Integration**: Now sends daily sales report via email to configured recipients using @nestjs-modules/mailer with Handlebars templates
- ✅ **Email Integration** - Complete email service implementation - 2026-07-27
  - **EmailModule**: Created with @nestjs-modules/mailer + Nodemailer + Handlebars templates
  - **EmailService**: Comprehensive email service with methods for:
    - Daily sales reports (with HTML templates)
    - Order confirmations
    - Welcome emails
    - Order status updates
    - Test emails
  - **Templates**: Beautiful HTML email templates with responsive design:
    - Daily sales report template (sales analytics, payment breakdown, top items)
    - Test email template
  - **Configuration**: Gmail SMTP integration with environment-based configuration
  - **Controller**: Test endpoints for email verification (`POST /email/test`)
  - **Scheduler Integration**: DailySalesReportScheduler now sends emails instead of just logging
  - **Environment Variables**: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, EMAIL_TO
- ✅ **Event-Driven Architecture Implementation** - Complete event-driven system with EventEmitter2 - 2026-07-21
  - **Events Module Created**: `events.module.ts` with EventEmitter2 configuration (wildcard: false, maxListeners: 10, verboseMemoryLeak: true)
  - **Event Interfaces Defined**: `event-payloads.interface.ts` with TypeScript interfaces for all event payloads (OrderCreatedEvent, OrderStatusUpdatedEvent, OrderCancelledEvent, OrderPaidEvent, DeliveryAgentAssignedEvent, OrderPreparingEvent, OrderReadyEvent, OrderDeliveredEvent, CustomerRegisteredEvent, AddressAddedEvent, OfferAppliedEvent)
  - **Event Listeners Implemented**:
    - `OrderListener` - Handles all order lifecycle events (order.created, order.status.updated, order.cancelled, order.paid, delivery.agent.assigned, order.preparing, order.ready, order.delivered)
    - `CustomerListener` - Handles customer events (customer.registered, customer.address.added)
    - `OfferListener` - Handles offer events (offer.applied)
  - **OrderService Event Emission**: Event emission added at key lifecycle points in OrderModuleService (claimOrder, markOrderReady, assignDeliveryAgent)
  - **TypeScript Fixes**: All event listener imports fixed to use `import type` syntax for decorator compatibility
  - **Benefits**: Decoupled business logic from notification logic, extensible architecture for future enhancements (email, SMS, analytics), non-blocking event processing

### In Progress
- No tasks currently in progress

### Pending Tasks
- No pending tasks

### Note: Payment Configuration
This project uses **Razorpay Test Mode** for payment processing. Test keys are configured in the backend environment variables. Live production keys are not required as the system operates in test mode only.

### Note: Previously Completed Features
- **Outlet Edit Feature** - Already fully implemented with `EditOutletModal` component
- **Menu Edit Features** - Implemented complete menu editing system (2026-06-30)
  - EditMenuModal, EditCategoryModal, EditMenuItemModal components
  - ModifierManagement component with full CRUD for modifiers
  - All edit modals integrated into menus dashboard

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

## Advanced Features to Implement

> **Purpose:** This section outlines advanced NestJS features that can be added to enhance the project. These features provide scheduled tasks, event-driven architecture, and microservices capabilities.

### Overview

The project currently does NOT use any of the following advanced features. Implementing these will make the system more robust, scalable, and maintainable:

| Feature | Purpose | Use Case in Restaurant Project |
|---------|---------|-------------------------------|
| **@Cron** | Scheduled tasks (runs at specific times) | Daily sales reports, Auto-expire offers, Cleanup tasks |
| **@Interval** | Recurring tasks at fixed intervals | Payment polling, Cache updates, Health checks |
| **@OnEvent** | Event listeners (event-driven architecture) | Order created → multiple actions (notify, log, email) |
| **EventEmitter2** | Event emitter for pub/sub patterns | Internal event communication |
| **EventPattern** | Microservice event handling | Inter-service communication |
| **ClientProxy** | Microservice client communication | Send events to other services |
| **@Timeout** | Delayed execution | Follow-up emails, Cart abandonment reminders |

### Prerequisites

To use these features, install the required packages:

```bash
# For @Cron, @Interval, @Timeout
pnpm add @nestjs/schedule

# For EventEmitter2 (usually included in @nestjs/common)
pnpm add @nestjs/event-emitter

# For microservices (EventPattern, ClientProxy)
pnpm add @nestjs/microservices
# For Redis transport (recommended)
pnpm add ioredis
# OR for RabbitMQ transport
pnpm add amqplib amqp-connection-manager
```

---

### 1. @Cron - Scheduled Tasks

Run tasks at specific times using cron expressions.

#### Use Cases

| Feature | Status | Description | Cron Expression | Priority |
|---------|--------|-------------|-----------------|----------|
| **Daily Sales Report** | ✅ Done | Generate and email daily revenue/sales report to admins | `0 0 8 * * *` (8 AM daily) | High |
| **Auto-Expire Offers** | ✅ Done | Check and mark expired offers as EXPIRED status | `0 0 * * * *` (every hour) | High |
| **Clean Up Tokens** | ❌ Pending | Remove expired refresh tokens from database | `0 0 0 * * *` (midnight daily) | Medium |
| **Auto-Cancel Pending Orders** | ✅ Done | Cancel orders stuck in PENDING > 30 minutes | `*/15 * * * *` (every 15 min) | High |
| **Generate Daily Analytics** | Aggregate daily stats for dashboard cache | `0 1 0 * * *` (12:01 AM daily) | Medium |
| **Weekly Restaurant Summary** | Email weekly performance to restaurant admins | `0 0 9 * * 1` (9 AM Monday) | Low |
| **Abandoned Cart Cleanup** | Clear cart data older than 7 days | `0 0 3 * * *` (3 AM daily) | Low |

#### Implementation

**File Structure:**
```
apps/backend/src/
├── jobs/
│   ├── jobs.module.ts
│   ├── schedulers/
│   │   ├── daily-report.scheduler.ts
│   │   ├── offer-expiration.scheduler.ts
│   │   ├── token-cleanup.scheduler.ts
│   │   └── order-cleanup.scheduler.ts
│   └── dto/
```

**jobs.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyReportScheduler } from './schedulers/daily-report.scheduler';
import { OfferExpirationScheduler } from './schedulers/offer-expiration.scheduler';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';
import { OrderCleanupScheduler } from './schedulers/order-cleanup.scheduler';
import { PrismaService } from '../database/prisma.service';
import { OfferModule } from '../offer-module/offer.module';
import { OrderModule } from '../order-module/order.module';

@Module({
  imports: [ScheduleModule.forRoot(), OfferModule, OrderModule],
  providers: [
    DailyReportScheduler,
    OfferExpirationScheduler,
    TokenCleanupScheduler,
    OrderCleanupScheduler,
    PrismaService,
  ],
})
export class JobsModule {}
```

**daily-report.scheduler.ts:**
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DailyReportScheduler {
  private readonly logger = new Logger(DailyReportScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 8 * * *', {
    name: 'daily-sales-report',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailySalesReport() {
    this.logger.log('📊 Generating daily sales report...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      // Get today's orders
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          status: { not: 'CANCELLED' },
        },
        include: {
          items: true,
          payment: true,
          outlet: {
            include: { restaurant: true },
          },
        },
      });

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const report = {
        date: today.toISOString().split('T')[0],
        totalRevenue,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue),
        paymentBreakdown: {
          online: orders.filter(o => o.payment?.method === 'CARD' || o.payment?.method === 'UPI' || o.payment?.method === 'WALLET').length,
          cod: orders.filter(o => o.payment?.method === 'CASH').length,
        },
        restaurantBreakdown: orders.reduce((acc, order) => {
          const restaurantName = order.outlet.restaurant.name;
          acc[restaurantName] = (acc[restaurantName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      this.logger.log(`Daily Report: ${JSON.stringify(report, null, 2)}`);

      // TODO: Send email to super admins
      // await this.emailService.sendDailyReport(report);

    } catch (error) {
      this.logger.error('Failed to generate daily sales report', error);
    }
  }
}
```

**offer-expiration.scheduler.ts:**
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OfferExpirationScheduler {
  private readonly logger = new Logger(OfferExpirationScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireOffers() {
    this.logger.log('🔄 Checking for expired offers...');

    try {
      const now = new Date();

      // Find active offers that have expired
      const expiredOffers = await this.prisma.offer.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lte: now,
          },
        },
      });

      if (expiredOffers.length > 0) {
        // Update all to EXPIRED
        await this.prisma.offer.updateMany({
          where: {
            id: { in: expiredOffers.map(o => o.id) },
          },
          data: { status: 'EXPIRED' },
        });

        this.logger.log(`✅ Expired ${expiredOffers.length} offers`);
      }

      // Activate scheduled offers
      const scheduledOffers = await this.prisma.offer.findMany({
        where: {
          status: 'SCHEDULED',
          startDate: {
            lte: now,
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24h
          },
        },
      });

      if (scheduledOffers.length > 0) {
        await this.prisma.offer.updateMany({
          where: {
            id: { in: scheduledOffers.map(o => o.id) },
          },
          data: { status: 'ACTIVE' },
        });

        this.logger.log(`✅ Activated ${scheduledOffers.length} scheduled offers`);
      }

    } catch (error) {
      this.logger.error('Failed to expire/activate offers', error);
    }
  }
}
```

**token-cleanup.scheduler.ts:**
```typescript
import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TokenCleanupScheduler {
  private readonly logger = new Logger(TokenCleanupScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 0 * * *')
  async cleanupExpiredTokens() {
    this.logger.log('🧹 Cleaning up expired tokens...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete expired refresh tokens older than 30 days
      const result = await this.prisma.userPassword.deleteMany({
        where: {
          refreshTokenExpiresAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`✅ Cleaned up ${result.count} expired tokens`);

      // Also cleanup customer refresh tokens
      const customerResult = await this.prisma.customerPassword.deleteMany({
        where: {
          refreshTokenExpiresAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`✅ Cleaned up ${customerResult.count} customer tokens`);

    } catch (error) {
      this.logger.error('Failed to cleanup tokens', error);
    }
  }
}
```

**order-cleanup.scheduler.ts:**
```typescript
import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrderCleanupScheduler {
  private readonly logger = new Logger(OrderCleanupScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async cancelStaleOrders() {
    this.logger.log('⏰ Checking for stale pending orders...');

    try {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      // Find orders in PENDING status for more than 30 minutes
      const staleOrders = await this.prisma.order.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: thirtyMinutesAgo,
          },
        },
        include: {
          customer: true,
        },
      });

      if (staleOrders.length > 0) {
        // Cancel all stale orders
        await this.prisma.order.updateMany({
          where: {
            id: { in: staleOrders.map(o => o.id) },
          },
          data: {
            status: 'CANCELLED',
            cancellationReason: 'Auto-cancelled: Order not confirmed within 30 minutes',
          },
        });

        this.logger.log(`✅ Cancelled ${staleOrders.length} stale orders`);

        // TODO: Send notifications to customers about auto-cancellation
        // for (const order of staleOrders) {
        //   await this.notificationService.notifyOrderCancelled(order);
        // }
      }

    } catch (error) {
      this.logger.error('Failed to cancel stale orders', error);
    }
  }
}
```

---

### 2. @Interval - Recurring Tasks

Run tasks at fixed intervals (in milliseconds).

#### Use Cases

| Feature | Description | Interval | Priority |
|---------|-------------|----------|----------|
| **Payment Status Poll** | Poll Razorpay for COD payment link status | 3000ms (3 sec) | High |
| **Order Status Sync** | Sync order status with external delivery API | 30000ms (30 sec) | Medium |
| **WebSocket Health Check** | Check active WebSocket connections | 60000ms (1 min) | Low |
| **Dashboard Cache Update** | Update dashboard stats cache | 300000ms (5 min) | Medium |
| **Delivery Agent Tracking** | Poll agent GPS location updates | 10000ms (10 sec) | Medium |

#### Implementation

**File Structure:**
```
apps/backend/src/
├── jobs/
│   └── intervals/
│       ├── payment-poll.interval.ts
│       ├── cache-update.interval.ts
│       └── health-check.interval.ts
```

**payment-poll.interval.ts:**
```typescript
import { Interval } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentPollInterval {
  private readonly logger = new Logger(PaymentPollInterval.name);
  private activePolls = new Map<string, NodeJS.Timeout>();

  constructor(private prisma: PrismaService) {}

  @Interval(30000) // Every 30 seconds
  async checkPendingPaymentLinks() {
    try {
      // Find orders with PENDING payment status and COD method
      const pendingOrders = await this.prisma.order.findMany({
        where: {
          payment: {
            status: 'PENDING',
            method: 'CASH',
          },
          status: { in: ['OUT_FOR_DELIVERY', 'DELIVERED'] },
        },
        include: { payment: true },
      });

      for (const order of pendingOrders) {
        if (order.payment?.paymentLinkId) {
          // Check payment link status with Razorpay
          const status = await this.checkPaymentLinkStatus(order.payment.paymentLinkId);

          if (status === 'paid') {
            // Update payment status
            await this.prisma.payment.update({
              where: { id: order.payment.id },
              data: { status: 'COMPLETED' },
            });

            this.logger.log(`✅ Payment completed for order ${order.id}`);
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to check payment links', error);
    }
  }

  private async checkPaymentLinkStatus(paymentLinkId: string): Promise<string> {
    // TODO: Implement Razorpay payment link status check
    // const response = await razorpay.paymentLink.fetch(paymentLinkId);
    // return response.status;
    return 'unpaid';
  }
}
```

**cache-update.interval.ts:**
```typescript
import { Interval } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../cache/redis.service'; // Assuming Redis cache

@Injectable()
export class CacheUpdateInterval {
  private readonly logger = new Logger(CacheUpdateInterval.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Interval(300000) // Every 5 minutes
  async updateDashboardCache() {
    this.logger.log('🔄 Updating dashboard analytics cache...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate today's stats
      const stats = await this.prisma.$transaction(async (tx) => {
        const [totalOrders, totalRevenue, activeUsers, totalCustomers] = await Promise.all([
          tx.order.count({
            where: {
              createdAt: { gte: today },
              status: { not: 'CANCELLED' },
            },
          }),
          tx.order.aggregate({
            where: {
              createdAt: { gte: today },
              status: { not: 'CANCELLED' },
            },
            _sum: { total: true },
          }),
          tx.user.count({ where: { status: 'ACTIVE' } }),
          tx.customer.count({ where: { status: 'ACTIVE' } }),
        ]);

        return {
          todayOrders: totalOrders,
          todayRevenue: totalRevenue._sum.total || 0,
          activeUsers,
          totalCustomers,
          timestamp: new Date().toISOString(),
        };
      });

      // Cache in Redis with 5-minute expiration
      await this.redis.set('dashboard:stats:today', JSON.stringify(stats), 300);

      this.logger.log(`✅ Dashboard cache updated: ${JSON.stringify(stats)}`);

    } catch (error) {
      this.logger.error('Failed to update dashboard cache', error);
    }
  }
}
```

---

### 3. @OnEvent - Event Listeners

Implement event-driven architecture using EventEmitter2.

#### Use Cases

| Event | Triggered When | Listeners (Actions) |
|-------|---------------|---------------------|
| **order.created** | New order is created | Send SMS/Email, Update inventory, Create notification, Log analytics, Notify kitchen |
| **order.paid** | Payment is completed | Confirm order, Notify kitchen, Send receipt, Update payment records |
| **order.status.updated** | Order status changes | Notify customer, Update delivery ETA, Log in history, Update analytics |
| **customer.registered** | Customer registers | Send welcome email, Create profile stats, Track analytics |
| **offer.applied** | Offer code is applied | Log usage, Decrease usage count, Validate constraints |
| **review.submitted** | Customer submits review | Update restaurant rating, Notify admin, Moderate content |

#### Implementation

**File Structure:**
```
apps/backend/src/
├── events/
│   ├── events.module.ts
│   ├── listeners/
│   │   ├── order.listener.ts
│   │   ├── customer.listener.ts
│   │   └── offer.listener.ts
│   └── emitters/
│       └── event-emitter.service.ts
```

**events.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderListener } from './listeners/order.listener';
import { CustomerListener } from './listeners/customer.listener';
import { OfferListener } from './listeners/offer.listener';
import { NotificationService } from '../notifications/notifications.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false, // Set to true to use wildcard events
      delimiter: '.',  // Delimiter for wildcard events
      newListener: false, // Listen for 'newListener' event
      maxListeners: 10, // Maximum listeners per event
      verboseMemoryLeak: true, // Detect memory leaks
    }),
  ],
  providers: [
    OrderListener,
    CustomerListener,
    OfferListener,
    NotificationService,
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
```

**Emitting Events (in existing services):**
```typescript
// src/order/order.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrder(dto: CreateOrderDto, customerId: number) {
    const order = await this.prisma.order.create({
      data: {
        customerId,
        outletId: dto.outletId,
        addressId: dto.addressId,
        total: dto.total,
        items: {
          create: dto.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers || [],
          })),
        },
        payment: {
          create: {
            method: dto.paymentMethod,
            status: 'PENDING',
          },
        },
      },
    });

    // Emit event for other services to listen
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      outletId: order.outletId,
      total: order.total,
      paymentMethod: dto.paymentMethod,
      items: order.items,
      createdAt: order.createdAt,
    });

    return order;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { customer: true, outlet: true },
    });

    // Emit status update event
    this.eventEmitter.emit('order.status.updated', {
      orderId: order.id,
      customerId: order.customerId,
      previousStatus: order.status,
      newStatus: status,
      outletId: order.outletId,
    });

    return order;
  }
}
```

**order.listener.ts:**
```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(payload: any) {
    this.logger.log(`📦 Order created event received: ${payload.orderId}`);

    try {
      // 1. Send notification to restaurant
      await this.notificationService.notifyRestaurant({
        outletId: payload.outletId,
        message: `New order #${payload.orderId} received`,
        orderId: payload.orderId,
        total: payload.total,
      });

      // 2. Track in analytics
      await this.analyticsService.trackOrderCreated({
        orderId: payload.orderId,
        customerId: payload.customerId,
        outletId: payload.outletId,
        total: payload.total,
        paymentMethod: payload.paymentMethod,
        itemCount: payload.items.length,
      });

      // 3. Send SMS to customer
      await this.smsService.sendOrderConfirmation({
        orderId: payload.orderId,
        phone: payload.customerPhone,
        total: payload.total,
      });

      // 4. Send email receipt
      await this.emailService.sendOrderConfirmation({
        orderId: payload.orderId,
        email: payload.customerEmail,
        total: payload.total,
        items: payload.items,
      });

      this.logger.log(`✅ Order created event processed successfully`);

    } catch (error) {
      this.logger.error('Failed to process order.created event', error);
    }
  }

  @OnEvent('order.status.updated')
  async handleOrderStatusUpdated(payload: any) {
    this.logger.log(`📤 Order status updated: ${payload.orderId} → ${payload.newStatus}`);

    try {
      // 1. Notify customer via WebSocket
      await this.notificationService.notifyCustomer({
        customerId: payload.customerId,
        message: this.getStatusMessage(payload.newStatus, payload.orderId),
        orderId: payload.orderId,
        status: payload.newStatus,
      });

      // 2. Track status change in analytics
      await this.analyticsService.trackStatusChange({
        orderId: payload.orderId,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
      });

      // 3. Log to order history
      // await this.prisma.orderHistory.create({...});

      this.logger.log(`✅ Order status updated event processed`);

    } catch (error) {
      this.logger.error('Failed to process order.status.updated event', error);
    }
  }

  @OnEvent('order.paid')
  async handleOrderPaid(payload: any) {
    this.logger.log(`💰 Order paid: ${payload.orderId}`);

    try {
      // 1. Notify kitchen to start preparing
      await this.notificationService.notifyKitchen({
        outletId: payload.outletId,
        orderId: payload.orderId,
        message: 'Order paid! Start preparing.',
      });

      // 2. Update order status to CONFIRMED
      // await this.prisma.order.update({...});

      // 3. Send receipt
      await this.emailService.sendPaymentReceipt({
        orderId: payload.orderId,
        email: payload.customerEmail,
        amount: payload.amount,
        transactionId: payload.transactionId,
      });

      this.logger.log(`✅ Order paid event processed`);

    } catch (error) {
      this.logger.error('Failed to process order.paid event', error);
    }
  }

  private getStatusMessage(status: string, orderId: number): string {
    const messages = {
      CONFIRMED: `Your order #${orderId} has been confirmed!`,
      PREPARING: `Your order #${orderId} is being prepared. It won't be long!`,
      READY: `Your order #${orderId} is ready and waiting for delivery partner!`,
      OUT_FOR_DELIVERY: `Your order #${orderId} is out for delivery!`,
      DELIVERED: `Your order #${orderId} has been delivered. Enjoy your meal!`,
      CANCELLED: `Your order #${orderId} has been cancelled.`,
    };
    return messages[status] || `Order #${orderId} status updated to ${status}`;
  }
}
```

**customer.listener.ts:**
```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Injectable()
export class CustomerListener {
  private readonly logger = new Logger(CustomerListener.name);

  constructor(private emailService: EmailService) {}

  @OnEvent('customer.registered')
  async handleCustomerRegistered(payload: any) {
    this.logger.log(`👤 New customer registered: ${payload.customerId}`);

    try {
      // Send welcome email
      await this.emailService.sendWelcomeEmail({
        email: payload.email,
        name: payload.name,
      });

      // Create customer profile stats
      // await this.analyticsService.initCustomerStats(payload.customerId);

      this.logger.log(`✅ Customer registered event processed`);

    } catch (error) {
      this.logger.error('Failed to process customer.registered event', error);
    }
  }

  @OnEvent('customer.address.added')
  async handleAddressAdded(payload: any) {
    this.logger.log(`📍 Address added for customer: ${payload.customerId}`);

    // Geocode address if not already done
    // Update customer stats
  }
}
```

**offer.listener.ts:**
```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OfferListener {
  private readonly logger = new Logger(OfferListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('offer.applied')
  async handleOfferApplied(payload: any) {
    this.logger.log(`🎁 Offer applied: ${payload.code} for order ${payload.orderId}`);

    try {
      // Log usage
      await this.prisma.offerUsage.create({
        data: {
          offerId: payload.offerId,
          customerId: payload.customerId,
          orderId: payload.orderId,
          discountAmount: payload.discountAmount,
        },
      });

      // Decrease usage count if applicable
      if (payload.maxUses) {
        await this.prisma.offer.update({
          where: { id: payload.offerId },
          data: {
            currentUses: { increment: 1 },
          },
        });
      }

      // Log to analytics
      // await this.analyticsService.trackOfferUsed(payload);

      this.logger.log(`✅ Offer applied event processed`);

    } catch (error) {
      this.logger.error('Failed to process offer.applied event', error);
    }
  }
}
```

---

### 4. EventEmitter2 - Event-Driven Architecture

For more advanced event patterns including wildcards and async handling.

#### Implementation

**event-emitter.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  // Emit events with proper typing
  emitOrderCreated(data: OrderCreatedEvent) {
    this.eventEmitter.emit('order.created', data);
  }

  emitOrderStatusUpdated(data: OrderStatusUpdatedEvent) {
    this.eventEmitter.emit('order.status.updated', data);
  }

  emitWildcard(pattern: string, data: any) {
    this.eventEmitter.emit(pattern, data);
  }

  // Async event listener with error handling
  @OnEvent('order.*', { async: true })
  async handleAllOrderEvents(payload: any) {
    // This catches all order.* events
    this.logger.log(`Order event received: ${payload}`);
  }
}

// Event interfaces
interface OrderCreatedEvent {
  orderId: number;
  customerId: number;
  outletId: number;
  total: number;
  paymentMethod: string;
}

interface OrderStatusUpdatedEvent {
  orderId: number;
  customerId: number;
  previousStatus: string;
  newStatus: string;
}
```

---

### 5. EventPattern / ClientProxy - Microservices

For microservices architecture with inter-service communication.

#### Use Cases

| Service | Emits Event | Consuming Service | Purpose |
|---------|-------------|-------------------|---------|
| **Order Service** | `order.created` | Payment Service, Notification Service, Kitchen Service | Trigger payment, notify, start preparation |
| **Payment Service** | `payment.completed` | Order Service, Email Service | Confirm order, send receipt |
| **Delivery Service** | `delivery.assigned` | Order Service, Notification Service | Update order status, notify customer |

#### Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Order Service     │────▶│  Payment Service     │────▶│   Email Service     │
│   (Port 3001)       │     │  (Port 3002)         │     │   (Port 3003)       │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
         │                            │                            │
         └────────────────────────────┴────────────────────────────┘
                         Shared Event Bus (Redis/RabbitMQ)
```

#### Implementation

**Using Redis as Transport:**

```bash
pnpm add ioredis @nestjs/microservices
```

**order.service.ts (Microservice):**
```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Controller()
export class OrderMicroserviceController {
  private client: ClientProxy;

  constructor() {
    // Create client for emitting events
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: 'localhost',
        port: 6379,
      },
    });
  }

  // Emit event when order is created
  async createOrder(orderData: any) {
    const order = await this.prisma.order.create({ data: orderData });

    // Emit to payment service
    this.client.emit('order.created', order).toPromise();

    return order;
  }

  // Listen for payment completed events
  @EventPattern('payment.completed')
  async handlePaymentCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // Mark order as paid
      await this.prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'CONFIRMED' },
      });

      // Acknowledge message
      channel.ack(originalMsg);

    } catch (error) {
      // Reject message on error
      channel.nack(originalMsg);
    }
  }

  @EventPattern('delivery.assigned')
  async handleDeliveryAssigned(@Payload() data: any) {
    // Update order status to OUT_FOR_DELIVERY
    await this.prisma.order.update({
      where: { id: data.orderId },
      data: { status: 'OUT_FOR_DELIVERY' },
    });
  }
}
```

**payment.service.ts (Microservice):**
```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class PaymentMicroserviceController {
  @EventPattern('order.created')
  async handleOrderCreated(@Payload() order: any) {
    // Initiate payment for the order
    await this.initiatePayment(order);
  }

  async initiatePayment(order: any) {
    // Create Razorpay order
    const razorpayOrder = await this.razorpay.orders.create({
      amount: order.total * 100, // in paise
      currency: 'INR',
    });

    // Emit payment initiated event
    this.client.emit('payment.initiated', {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
    });
  }

  async verifyPayment(paymentData: any) {
    // Verify payment signature
    const isValid = this.verifySignature(paymentData);

    if (isValid) {
      // Emit payment completed event
      this.client.emit('payment.completed', {
        orderId: paymentData.orderId,
        transactionId: paymentData.razorpay_payment_id,
      });
    }
  }
}
```

**main.ts (Microservice setup):**
```typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: 'localhost',
        port: 6379,
      },
    },
  );

  await app.listen();
  console.log('Order microservice is listening...');
}
bootstrap();
```

---

### 6. @Timeout - Delayed Execution

Run a task once after a specified delay (in milliseconds).

#### Use Cases

| Feature | Description | Delay | Priority |
|---------|-------------|-------|----------|
| **Follow-up Email** | Send "How was your order?" email | 24 hours (86400000ms) | Low |
| **Cart Abandonment** | Remind customers about items in cart | 1 hour (3600000ms) | Medium |
| **Release Inventory** | Release reserved items if unpaid | 15 minutes (900000ms) | High |
| **Delivery Reminder** | Remind agent about delayed orders | 5 minutes (300000ms) | Medium |

#### Implementation

**File Structure:**
```
apps/backend/src/
└── jobs/
    └── timeouts/
        ├── follow-up-email.timeout.ts
        ├── cart-reminder.timeout.ts
        └── inventory-release.timeout.ts
```

**follow-up-email.timeout.ts:**
```typescript
import { Timeout } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FollowUpEmailTimeout {
  private readonly logger = new Logger(FollowUpEmailTimeout.name);
  private scheduledEmails = new Set<number>();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Schedule follow-up email for delivered orders (runs once per order)
  scheduleFollowUpEmail(orderId: number, email: string) {
    if (this.scheduledEmails.has(orderId)) return;

    this.scheduledEmails.add(orderId);

    // Schedule email 24 hours from now
    setTimeout(async () => {
      try {
        await this.emailService.sendFollowUpEmail({
          email,
          orderId,
        });

        this.logger.log(`✅ Follow-up email sent for order ${orderId}`);
        this.scheduledEmails.delete(orderId);

      } catch (error) {
        this.logger.error(`Failed to send follow-up email for order ${orderId}`, error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Alternative: Use @Timeout for one-time startup task
  @Timeout(5000) // Runs once, 5 seconds after app startup
  async handleStartupTask() {
    this.logger.log('🚀 Running startup task (5 seconds after start)...');

    // Initialize something on startup
    // Check for incomplete tasks
    // Send alerts if needed
  }
}
```

**cart-reminder.timeout.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CartReminderTimeout {
  private readonly logger = new Logger(CartReminderTimeout.name);
  private reminderIntervals = new Map<number, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Schedule cart abandonment reminder
  scheduleReminder(customerId: number, customerEmail: string) {
    // Clear existing reminder if any
    const existing = this.reminderIntervals.get(customerId);
    if (existing) clearTimeout(existing);

    // Schedule reminder after 1 hour
    const timeout = setTimeout(async () => {
      try {
        // Get customer's current cart
        const cart = await this.getCustomerCart(customerId);

        if (cart && cart.items.length > 0) {
          await this.notificationService.sendCartReminder({
            email: customerEmail,
            itemCount: cart.items.length,
            total: cart.total,
          });

          this.logger.log(`✅ Cart reminder sent to customer ${customerId}`);
        }

      } catch (error) {
        this.logger.error(`Failed to send cart reminder to ${customerId}`, error);
      }
    }, 60 * 60 * 1000); // 1 hour

    this.reminderIntervals.set(customerId, timeout);
  }

  private async getCustomerCart(customerId: number) {
    // Fetch from cache or database
    return null;
  }
}
```

**inventory-release.timeout.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryReleaseTimeout {
  private readonly logger = new Logger(InventoryReleaseTimeout.name);
  private inventoryHolds = new Map<number, NodeJS.Timeout>();

  constructor(private prisma: PrismaService) {}

  // Hold inventory for 15 minutes (payment window)
  holdInventory(orderId: number, items: any[]) {
    const timeout = setTimeout(async () => {
      try {
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });

        // If still pending after 15 minutes, release inventory
        if (order && order.status === 'PENDING') {
          await this.releaseInventory(orderId);
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED', cancellationReason: 'Payment window expired' },
          });

          this.logger.log(`⏰ Inventory released for expired order ${orderId}`);
        }

      } catch (error) {
        this.logger.error(`Failed to release inventory for order ${orderId}`, error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    this.inventoryHolds.set(orderId, timeout);
  }

  private async releaseInventory(orderId: number) {
    // Update menu item availability
    // Remove holds from inventory tracking
  }

  cancelHold(orderId: number) {
    const timeout = this.inventoryHolds.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.inventoryHolds.delete(orderId);
    }
  }
}
```

---

### Implementation Order (Recommended)

If you want to implement these features progressively, follow this order:

#### Phase 1: Event-Driven Architecture (Easiest, No Dependencies)
1. **Install `@nestjs/event-emitter`**
2. **Create EventsModule** with EventEmitter2 configuration
3. **Implement OrderListener** with:
   - `order.created` event
   - `order.status.updated` event
   - `order.paid` event
4. **Emit events** from existing OrderService
5. **Test** with console logs first

#### Phase 2: Scheduled Tasks (@Cron)
1. **Install `@nestjs/schedule`**
2. **Create JobsModule**
3. **Implement schedulers** in order of priority:
   - Auto-cancel stale pending orders
   - Auto-expire offers
   - Daily sales report
   - Token cleanup
4. **Test** with shorter intervals (e.g., every minute) before setting production schedules

#### Phase 3: Recurring Tasks (@Interval)
1. **Implement PaymentPollInterval** for COD payment link status
2. **Implement CacheUpdateInterval** for dashboard cache
3. **Test** with shorter intervals

#### Phase 4: Microservices (Optional, Advanced)
1. **Set up Redis** or RabbitMQ
2. **Split PaymentService** into separate microservice
3. **Implement ClientProxy** for inter-service communication
4. **Use EventPattern** for event handling
5. **Test** event flow between services

#### Phase 5: Delayed Execution (@Timeout)
1. **Implement FollowUpEmailTimeout** for post-delivery feedback
2. **Implement CartReminderTimeout** for abandoned cart recovery
3. **Implement InventoryReleaseTimeout** for payment window expiry

---

### File Structure After Implementation

```
apps/backend/src/
├── events/              # Event-driven architecture
│   ├── events.module.ts
│   ├── listeners/
│   │   ├── order.listener.ts
│   │   ├── customer.listener.ts
│   │   └── offer.listener.ts
│   └── emitters/
│       └── event-emitter.service.ts
├── jobs/                # Scheduled & recurring tasks
│   ├── jobs.module.ts
│   ├── schedulers/      # @Cron tasks
│   │   ├── daily-report.scheduler.ts
│   │   ├── offer-expiration.scheduler.ts
│   │   ├── token-cleanup.scheduler.ts
│   │   └── order-cleanup.scheduler.ts
│   ├── intervals/       # @Interval tasks
│   │   ├── payment-poll.interval.ts
│   │   ├── cache-update.interval.ts
│   │   └── health-check.interval.ts
│   └── timeouts/        # @Timeout tasks
│       ├── follow-up-email.timeout.ts
│       ├── cart-reminder.timeout.ts
│       └── inventory-release.timeout.ts
├── analytics/           # Analytics service
│   ├── analytics.module.ts
│   ├── analytics.service.ts
│   └── dto/
├── email/               # Email service
│   ├── email.module.ts
│   ├── email.service.ts
│   └── templates/
├── sms/                 # SMS service
│   ├── sms.module.ts
│   └── sms.service.ts
└── cache/               # Cache service (Redis)
    ├── cache.module.ts
    └── redis.service.ts
```

---

### Notes

- This is a Next.js 16 project with breaking changes from previous versions
- Check `node_modules/next/dist/docs/` for Next.js API documentation
- Frontend uses Tailwind CSS 4 (latest major version)
- Backend uses NestJS 11 with latest conventions
- Database seeder uses `tsx` for ES module compatibility
- Role checks handled by decorators - service methods don't re-verify roles
- **Payment Integration**: Razorpay test keys are configured for development. Get production keys from https://dashboard.razorpay.com
