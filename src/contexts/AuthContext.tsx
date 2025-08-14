import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { permissionConfig } from '@/lib/permissions';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  permissions: Record<string, string[]>;
  hasPermission: (feature: string, action?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAndSetPermissions = async () => {
    const { data: userRolesData, error: rolesError } = await supabase.rpc('get_user_roles_with_permissions');
    
    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      setRoles([]);
      setPermissions({});
      return;
    }

    if (userRolesData) {
      const roleNames = userRolesData.map((r: any) => r.name);
      setRoles(roleNames);

      const mergedPermissions: Record<string, string[]> = {};
      let isSuperAdmin = false;

      for (const role of userRolesData) {
        if (role.permissions?.super_admin) {
          isSuperAdmin = true;
          break;
        }
      }

      if (isSuperAdmin) {
        permissionConfig.forEach(p => {
          mergedPermissions[p.key] = p.actions;
        });
      } else {
        userRolesData.forEach((role: any) => {
          if (role.permissions) {
            Object.keys(role.permissions).forEach(featureKey => {
              const actions = role.permissions[featureKey] || [];
              if (!mergedPermissions[featureKey]) {
                mergedPermissions[featureKey] = [];
              }
              const existingActions = new Set(mergedPermissions[featureKey]);
              actions.forEach((action: string) => existingActions.add(action));
              mergedPermissions[featureKey] = Array.from(existingActions);
            });
          }
        });
      }
      setPermissions(mergedPermissions);
    } else {
      setRoles([]);
      setPermissions({});
    }
  };

  useEffect(() => {
    const setData = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        await fetchAndSetPermissions();
      } else {
        setRoles([]);
        setPermissions({});
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchAndSetPermissions();
      } else {
        setRoles([]);
        setPermissions({});
      }
    });

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (feature: string, action?: string): boolean => {
    const featurePermissions = permissions[feature];
    if (!featurePermissions) {
      return false;
    }
    if (action) {
      return featurePermissions.includes(action);
    }
    return featurePermissions.length > 0;
  };

  const value = {
    session,
    user,
    roles,
    loading,
    signOut,
    permissions,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};