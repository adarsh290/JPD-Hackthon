import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { Dashboard } from '@/components/Dashboard';
import { HackerBackground } from '@/components/HackerBackground';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HackerBackground />
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen scanlines">
      <HackerBackground />
      <div className="relative z-10">
        {user ? (
          <Dashboard />
        ) : (
          <div className="min-h-screen flex items-center justify-center p-4">
            <AuthForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
