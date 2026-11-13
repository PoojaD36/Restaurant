
import 'dotenv/config';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';



interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  preparationTime: number | null;
  calories: number | null;
  available: boolean;
  modifiers: unknown[];
}

interface MenuCategory {
  id: number;
  menuId: number;
  name: string;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}

interface PublicMenuResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    description: string | null;
    restaurantId: number;
    categories: MenuCategory[];
  };
}



async function apiRequest<T>(endpoint: string): Promise<T> {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error('BACKEND_URL is not configured');
  }

  const response = await fetch(`${backendUrl}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Backend API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

// 1. Create the MCP server
const server = new McpServer({
  name: 'restaurant-mcp-server',
  version: '1.0.0',
});

// 2. First tool: Get restaurant information
server.registerTool(
  'get_restaurant_info',
  {
    title: 'Get Restaurant Information',
    description: 'Returns basic information about the restaurant project.',
  },
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              project: 'Restaurant Management System',
              backend: 'NestJS',
              database: 'PostgreSQL',
              status: 'running',
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// 3. Second tool: Greet a restaurant guest
server.registerTool(
  'greet_restaurant_guest',
  {
    title: 'Greet Restaurant Guest',
    description: 'Greets a guest using their name.',
    inputSchema: {
      name: z.string().min(1).describe('Name of the restaurant guest'),
    },
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: 'text',
          text: `Hello ${name}! Welcome to our restaurant.`,
        },
      ],
    };
  },
);

// Temporary sample menu data
const menuItems = [
  { id: 1, name: 'Margherita Pizza', price: 250 },
  { id: 2, name: 'Veg Burger', price: 150 },
  { id: 3, name: 'Paneer Pizza', price: 300 },
  { id: 4, name: 'French Fries', price: 100 },
  { id: 5, name: 'Cold Coffee', price: 120 },
];

// Third tool: Search restaurant menu
server.registerTool(
  'search_menu',
  {
    title: 'Search Restaurant Menu',
    description: 'Searches restaurant menu items by name.',
    inputSchema: {
      itemName: z.string().min(1).describe('Menu item name to search for'),
    },
  },
  async ({ itemName }) => {
    const results = menuItems.filter((item) =>
      item.name.toLowerCase().includes(itemName.toLowerCase()),
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              search: itemName,
              totalResults: results.length,
              items: results,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);


server.registerTool(
  'get_public_outlets',
  {
    title: 'Get Public Restaurant Outlets',
    description:
      'Retrieves active restaurant outlets with pagination. Customers can discover available restaurant outlets.',
    inputSchema: {
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
      restaurantId: z.number().int().positive().optional(),
    },
  },
  async ({ page, limit, restaurantId }) => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (restaurantId !== undefined) {
      query.set('restaurantId', String(restaurantId));
    }

    const data = await apiRequest(
      `/public/outlets/list?${query.toString()}`,
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  },
);


server.registerTool(
  'get_public_menu',
  {
    title: 'Get Public Restaurant Menu',
    description:
      'Retrieves the menu, categories, food items, prices, availability and modifiers for a restaurant outlet.',
    inputSchema: {
      outletId: z.number().int().positive().describe(
        'ID of the restaurant outlet',
      ),
    },
  },
  async ({ outletId }) => {
    const data = await apiRequest<PublicMenuResponse>(
      `/public/menus/outlet/${outletId}`,
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  },
);


server.registerTool(
  'search_public_menu',
  {
    title: 'Search Public Restaurant Menu',
    description:
      'Searches menu items by name and filters by price, vegetarian, spicy and availability.',
    inputSchema: {
      outletId: z.number().int().positive(),
      search: z.string().optional(),
      maxPrice: z.number().positive().optional(),
      vegetarianOnly: z.boolean().optional(),
      spicyOnly: z.boolean().optional(),
      availableOnly: z.boolean().optional(),
    },
  },
  async ({
    outletId,
    search,
    maxPrice,
    vegetarianOnly,
    spicyOnly,
    availableOnly,
  }) => {
    const response = await apiRequest<PublicMenuResponse>(
      `/public/menus/outlet/${outletId}`,
    );

    const categories = response.data.categories;

    const results = categories.flatMap((category: MenuCategory) =>
      category.items
        .filter((item: MenuItem) => {
          if (
            search &&
            !item.name.toLowerCase().includes(search.toLowerCase())
          ) {
            return false;
          }

          if (maxPrice !== undefined && item.price > maxPrice) {
            return false;
          }

          if (vegetarianOnly === true && !item.isVegetarian) {
            return false;
          }

          if (spicyOnly === true && !item.isSpicy) {
            return false;
          }

          if (availableOnly === true && !item.available) {
            return false;
          }

          return true;
        })
        .map((item: MenuItem) => ({
          ...item,
          categoryName: category.name,
        })),
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              outletId,
              searchFilters: {
                search,
                maxPrice,
                vegetarianOnly,
                spicyOnly,
                availableOnly,
              },
              totalResults: results.length,
              items: results,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);


// 4. Start the MCP server
async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('Restaurant MCP Server is running!');
}

main().catch((error) => {
  console.error('MCP Server failed:', error);
  process.exit(1);
});
