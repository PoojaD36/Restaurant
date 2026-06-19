# Restaurant Project - Development Context

> **Last Updated:** 2026-06-19
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
│   │   │   ├── auth/           # Authentication module
│   │   │   │   ├── guards/     # JWTAuthGuard, RolesGuard
│   │   │   │   ├── strategies/ # JWT strategy
│   │   │   │   ├── decorators/ # @Roles() decorator
│   │   │   │   ├── dto/        # Data transfer objects
│   │   │   │   ├── interfaces/ # JwtPayload interface
│   │   │   │   └── constants/  # Auth constants
│   │   │   ├── database/       # Prisma service & module
│   │   │   ├── user-module/    # User management (placeholder)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── .env                # Backend environment variables
│   │   └── package.json
│   │
│   └── frontend/               # Next.js App
│       ├── app/
│       │   ├── layout.tsx       # Root layout with AuthProvider
│       │   ├── page.tsx         # Landing page
│       │   ├── login/
│       │   │   └── page.tsx     # Login page
│       │   └── dashboard/
│       │       ├── layout.tsx   # Dashboard layout with header/logout
│       │       ├── page.tsx     # Dashboard home
│       │       └── create-user/
│       │           └── page.tsx # User creation form (Super Admin)
│       ├── components/
│       │   └── protected-route.tsx # Route protection wrapper
│       ├── contexts/
│       │   └── auth-context.tsx   # Auth state management
│       ├── lib/
│       │   ├── types.ts            # TypeScript types (User, Login, etc.)
│       │   └── auth-api.ts         # API functions for auth endpoints
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
- `Outlet` - Physical restaurant locations
- `OutletUser` - Junction table for User-Outlet relationships
- `Customer` - End customers
- `CustomerPassword` - Customer credentials
- `CustomerAddress` - Customer delivery addresses

**Key Enums:**
- `UserRole`: SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, CHEF, DELIVERY_AGENT
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED
- `RestaurantStatus`: ACTIVE, INACTIVE
- `OutletStatus`: ACTIVE, INACTIVE, CLOSED
- `CustomerStatus`: ACTIVE, INACTIVE, BLOCKED

---

## Current Implementation Status

### Backend (NestJS)

| Module | Status | Notes |
|--------|--------|-------|
| App Module | ✅ Complete | ConfigModule, PrismaModule imported |
| Auth Module | ✅ Complete | JWT auth, role-based guards, decorators |
| User Module | ⚪ Placeholder | To be implemented |
| Database Module | ✅ Complete | Global PrismaModule with adapter |
| Prisma Schema | ✅ Complete | Full schema with relations |
| Database Seeder | ✅ Complete | Creates Super Admin via npm run seed |

**Port:** 3001 (configurable via `PORT` env var)

**Super Admin Credentials (from seeder):**
- Email: `superadmin@restaurant.com`
- Password: `Admin@123`

### Frontend (Next.js)

| Feature | Status | Notes |
|---------|--------|-------|
| App Structure | ✅ Complete | Layout with AuthProvider |
| Landing Page | ✅ Complete | Food delivery themed hero with framer-motion animations |
| Background Effects | ✅ Complete | Floating food icons, wave animations, glass-morphism |
| Authentication | ✅ Complete | Login, logout, JWT handling |
| Dashboard | ✅ Complete | Protected dashboard with sidebar navigation (collapsible) |
| User Creation | ✅ Complete | Super Admin user creation form |
| Auth Context | ✅ Complete | State management with useAuth hook |
| Protected Routes | ✅ Complete | ProtectedRoute component with role check |
| UI Components | ✅ Complete | shadcn/ui components installed |
| Theme System | ✅ Complete | Red/Orange/Amber theme (light mode only) |

---

## Landing Page Features

### Visual Design
- **Food Delivery Theme**: Warm orange/amber/rose color palette evoking appetite
- **Glass-morphism**: Semi-transparent cards with backdrop-blur effects
- **Viewport-Fit**: Hero section designed to fit screen without scrolling
- **Responsive Design**: Optimized for all screen sizes
- **Light Mode Only**: Clean, light theme optimized for readability

### Animations (Framer Motion + Custom CSS)
- **Floating Food Icons**: 20 animated food/kitchen icons floating upward
  - Coffee, ShoppingBag, Clock, Star, Beef, Cake, Egg, ChefHat, Sandwich, GlassWater, Cookie
  - Varying speeds (17-24s), rotations, and delays for natural movement
- **Wave Background**: Animated SVG waves at top and bottom edges
- **Floating Orbs**: Large blurred gradient circles with gentle movement
- **Hero Animations**: Fade-in, slide-up effects with stagger timing
- **Hover Effects**: Scale, rotate, and shadow transitions on interactive elements

### Custom CSS Animations (globals.css)
```css
@keyframes float-up    /* Float upward with scale */
@keyframes float-down  /* Float downward with scale */
@keyframes pulse-warm   /* Gentle pulse effect */
@keyframes drift       /* Horizontal/vertical drift */
```

### Theme System
- **Light Mode**: Orange/amber gradient (`from-orange-100 via-amber-100 to-rose-100`)
- **No Dark Mode**: Light-only theme for consistent branding
- **Color Palette**: Warm oranges, ambers, and rose tones throughout

### Components
- **Header**: Sticky glass-morphism header with logo, theme toggle, sign in button
- **Badge**: "Fast & Fresh Food Delivery" with animated pulsing dot
- **Heading**: Large gradient text with animated color shift
- **CTA Buttons**: "Order Now" and "View Restaurants" with hover effects
- **Stats Bar**: Quick stats (500+ Restaurants, 10K+ Customers, 4.9 Rating)

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

### Authentication Flow

1. **Database Seeding:** Run `pnpm run seed` to create Super Admin
2. **Login:** Super Admin logs in via `/auth/login` → receives JWT tokens
3. **Create Users:** Super Admin creates other users via `/users/create`
4. **Role Selection:** Frontend sends role in request body (no defaults)

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

- **@UseGuards(JwtAuthGuard)** - Validates JWT token
- **@UseGuards(RolesGuard)** - Checks user roles
- **@Roles(UserRole.SUPER_ADMIN)** - Specifies required role(s)

---

## Environment Setup

### Backend (.env)
Located at `apps/backend/.env`

```env
PORT=3001
DATABASE_URL="postgresql://..."
```

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

# Database operations
cd apps/backend
npx prisma generate      # Generate Prisma client
npx prisma db push      # Push schema to database
npx prisma studio        # Open Prisma Studio
pnpm run seed            # Seed Super Admin user

# TypeScript compilation check
npx tsc --noEmit
```

---

## Frontend Structure Details

### Components & Pages

| File | Purpose |
|------|---------|
| `lib/types.ts` | TypeScript types for User, LoginResponse, CreateUserRequest, ChangePasswordRequest, UserListItem |
| `lib/auth-api.ts` | API functions for auth endpoints (login, logout, getCurrentUser) |
| `lib/users-api.ts` | API functions for user endpoints (createUser, getAllUsers) |
| `contexts/auth-context.tsx` | Auth state management with useAuth hook |
| `components/protected-route.tsx` | Route protection wrapper with role check |
| `components/change-password-modal.tsx` | Reusable modal for password changes (uses shadcn Dialog, with confirm password field) |
| `components/create-user-modal.tsx` | Modal for creating new users (uses shadcn Dialog) |
| `components/ui/button.tsx` | shadcn Button component |
| `components/ui/card.tsx` | shadcn Card component |
| `components/ui/input.tsx` | shadcn Input component |
| `components/ui/label.tsx` | shadcn Label component |
| `components/ui/select.tsx` | shadcn Select component |
| `components/ui/table.tsx` | shadcn Table component |
| `components/ui/badge.tsx` | shadcn Badge component |
| `components/ui/dialog.tsx` | shadcn Dialog component |
| `app/page.tsx` | Landing page - food delivery theme with animations |
| `app/login/page.tsx` | Login form (email/phone + password) |
| `app/dashboard/layout.tsx` | Dashboard layout with sidebar navigation (collapsible on desktop, hamburger menu on mobile), logout, change password button |
| `app/dashboard/page.tsx` | Dashboard home page |
| `app/dashboard/create-user/page.tsx` | User creation form (Super Admin only) - legacy, replaced by modal |
| `app/dashboard/users/page.tsx` | Users list page with Create User button and password reset modal (Super Admin only) |
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

### In Progress
- No tasks currently in progress

### Pending Tasks
- [ ] **Restaurant Management** - Create restaurant CRUD with admin assignment
- [ ] **Outlet Management** - Create outlet CRUD with location features
- [ ] **Customer Portal** - Implement customer registration and auth
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
