import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('auction_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'owner') => {
    try {
      setLoading(true);
      
      if (role === 'admin') {
        // ADMIN CREDENTIALS - Change these to your desired credentials
        const ADMIN_USERNAME = 'admin';
        const ADMIN_PASSWORD = 'admin123';
        
        if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          const adminUser: User = {
            id: 'admin-1',
            email: 'admin',
            role: 'admin',
          };
          localStorage.setItem('auction_user', JSON.stringify(adminUser));
          setUser(adminUser);
          toast.success('Welcome Admin!');
          router.push('/admin');
        } else {
          throw new Error('Invalid admin credentials');
        }
      } else {
        // Owner login - check against Supabase teams table
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, team_name, owner_name, email')
          .eq('email', email)
          .single();

        if (teamError || !teamData) {
          throw new Error('Team not found. Please check your email.');
        }

        // Check password (simple check for demo)
        if (password !== 'owner123') {
          throw new Error('Invalid password');
        }

        const ownerUser: User = {
          id: teamData.id,
          email: teamData.email,
          role: 'owner',
          teamId: teamData.id,
          teamName: teamData.team_name,
        };
        
        localStorage.setItem('auction_user', JSON.stringify(ownerUser));
        setUser(ownerUser);
        toast.success(`Welcome ${teamData.owner_name}!`);
        router.push(`/owner/${teamData.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auction_user');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return {
    user,
    loading,
    login,
    logout,
  };
};