'use client';

import { ProtectedRoute } from '../../components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Utensils, ShoppingBag, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'Total Users', value: '0', icon: Users, description: 'Registered users', color: 'from-orange-500 to-red-500' },
    { title: 'Restaurants', value: '0', icon: Utensils, description: 'Active restaurants', color: 'from-red-500 to-orange-500' },
    { title: 'Orders', value: '0', icon: ShoppingBag, description: 'Total orders', color: 'from-orange-600 to-red-500' },
    { title: 'Revenue', value: '$0', icon: TrendingUp, description: 'This month', color: 'from-red-600 to-orange-500' },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            Welcome back!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Here's what's happening with your restaurant today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="border-orange-100 dark:border-red-900/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all bg-white/80 dark:bg-black/50 backdrop-blur"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-orange-100 dark:border-red-900/50 bg-white/80 dark:bg-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Get started with some common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <a
                href="/dashboard/create-user"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-lg shadow-red-500/30 transition-all"
              >
                Create New User
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
