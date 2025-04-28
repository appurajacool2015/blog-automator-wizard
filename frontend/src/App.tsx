/**
 * Root application component that provides:
 * - React Query client for data fetching
 * - Tooltip provider for UI tooltips
 * - Toaster for notifications
 * - Basic layout structure
 */
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <main className="container mx-auto p-4">
            <Outlet />
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
