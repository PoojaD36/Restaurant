import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-900 font-sans min-h-screen">
      <main className="flex flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50">
            Restaurant Management
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
            Complete restaurant administration system for managing users, orders, and operations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-8 text-sm text-zinc-500 dark:text-zinc-500">
          Super Admin credentials: superadmin@restaurant.com / Admin@123
        </div>
      </main>
    </div>
  );
}
