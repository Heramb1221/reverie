import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useAuth() {
  const store  = useAuthStore();
  const router = useRouter();

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    store.logout();
    router.push('/login');
    toast.success('Signed out');
  };

  return { ...store, logout };
}
