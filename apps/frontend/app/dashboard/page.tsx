'use client';

import { ProtectedRoute } from '../../components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Welcome to Dashboard
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Select an option from the navigation menu to get started.
        </p>
      </div>
    </ProtectedRoute>
  );
}
