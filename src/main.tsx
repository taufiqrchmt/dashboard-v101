import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
// Layouts and Pages
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import GroupsPage from '@/pages/user/GroupsPage';
import GuestsPage from '@/pages/user/GuestsPage';
import UserTemplatesPage from '@/pages/user/TemplatesPage';
import SendPage from '@/pages/user/SendPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/UsersPage';
import AdminTemplatesPage from '@/pages/admin/TemplatesPage';
import AdminSettingsPage from '@/pages/admin/SettingsPage';
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <HomePage /> },
      // User Routes
      { path: "groups", element: <GroupsPage /> },
      { path: "guests", element: <GuestsPage /> },
      { path: "templates", element: <UserTemplatesPage /> },
      { path: "send", element: <SendPage /> },
      // Admin Routes
      {
        path: "admin",
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { path: "", element: <Navigate to="/admin/users" replace /> },
          { path: "dashboard", element: <AdminDashboard /> }, // Placeholder, can be removed if not needed
          { path: "users", element: <AdminUsersPage /> },
          { path: "templates", element: <AdminTemplatesPage /> },
          { path: "settings", element: <AdminSettingsPage /> },
        ]
      },
    ]
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)