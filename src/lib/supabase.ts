import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with better real-time config for mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Add these options for better mobile connection
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to subscribe to realtime changes with auto-reconnect
export const subscribeToRealtime = (
  table: string,
  callback: (payload: any) => void,
  onError?: (error: any) => void
) => {
  let channel = supabase
    .channel(`${table}-changes-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: table },
      (payload) => {
        console.log(`Real-time update on ${table}:`, payload);
        callback(payload);
      }
    )
    .subscribe((status, err) => {
      console.log(`Subscription status for ${table}:`, status);
      if (status === 'CHANNEL_ERROR' && onError) {
        console.log(`Reconnecting subscription for ${table}...`);
        onError(err);
        // Auto reconnect after 2 seconds
        setTimeout(() => {
          channel = subscribeToRealtime(table, callback, onError);
        }, 2000);
      }
    });

  return channel;
};

// Function to check connection status
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('teams').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection active');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};