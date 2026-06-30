import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001']
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Restaurant Management API')
    .setDescription(`
      ## Restaurant Management System API

      A comprehensive restaurant management system with the following features:

      ### Modules
      - **Authentication**: JWT-based admin authentication with role-based access control
      - **User Management**: Manage system users with different roles (SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, CHEF, DELIVERY_AGENT)
      - **Restaurant Management**: CRUD operations for restaurants and user assignments
      - **Outlet Management**: Manage restaurant outlets with user assignments and geocoding
      - **Customer Management**: Customer authentication, profiles, and address management
      - **Menu Management**: Restaurant-level menus with categories, items, and modifiers
      - **Order Management**: Complete order lifecycle with real-time notifications
      - **Payment Processing**: Razorpay integration for online payments and COD
      - **Dashboard Analytics**: Statistics, revenue analytics, popular items, and staff performance
      - **Storage**: Supabase integration for image uploads

      ### Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`

      ### Roles
      - **SUPER_ADMIN**: Full access to all resources
      - **RESTAURANT_ADMIN**: Access to assigned restaurants and their data
      - **MANAGER**: Access to assigned outlets and operations
      - **CHEF**: Access to kitchen order management
      - **DELIVERY_AGENT**: Access to assigned deliveries

      ### Customer Authentication
      Customer endpoints use a separate JWT token with \`CUSTOMER_JWT_SECRET\`.
    `)
    .setVersion('1.0')
    .addTag('Auth', 'Authentication endpoints for admin users')
    .addTag('Users', 'User management endpoints')
    .addTag('Restaurants', 'Restaurant management endpoints')
    .addTag('Outlets', 'Outlet management endpoints')
    .addTag('Customers', 'Customer authentication and management')
    .addTag('Menus', 'Menu management endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addTag('Payments', 'Payment processing endpoints (Razorpay)')
    .addTag('Dashboard', 'Dashboard analytics endpoints')
    .addTag('Public', 'Public endpoints (no authentication required)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (admin or customer)',
        in: 'header',
      },
      'JWT-auth', // This name will be used in @ApiBearerAuth() decorators
    )
    .setContact('Restaurant Management', '', 'support@restaurant.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setExternalDoc('GitHub Repository', 'https://github.com/yourusername/restaurant')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'Restaurant API Docs',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
