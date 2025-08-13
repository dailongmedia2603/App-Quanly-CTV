import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  page_title?: string;
}

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('page_title')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching app settings:", error);
      } else {
        setSettings(data);
      }
      setLoading(false);
    };

    fetchSettings();

    const channel = supabase.channel('app-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value = { settings, loading };

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};