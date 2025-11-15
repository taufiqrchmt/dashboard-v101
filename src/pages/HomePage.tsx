import { useAuthStore } from '@/lib/auth';
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './user/UserDashboard';
import { Skeleton } from '@/components/ui/skeleton';
export default function HomePage() {
  const profile = useAuthStore((state) => state.profile);
  if (!profile) {
    // This should technically not be reached due to ProtectedRoute, but it's a good fallback.
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <Skeleton className="h-12 w-1/4" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
  return profile.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
}