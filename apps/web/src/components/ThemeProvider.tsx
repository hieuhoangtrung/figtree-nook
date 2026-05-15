'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Theme {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string | null;
  heroHeadline: string;
  heroSubtext: string;
  footerText: string;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  root.style.setProperty('--font-family', theme.fontFamily);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useQuery<Theme>({
    queryKey: ['theme'],
    queryFn: () => api.get('/api/theme').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}

export function useTheme(): Theme | undefined {
  const { data } = useQuery<Theme>({
    queryKey: ['theme'],
    queryFn: () => api.get('/api/theme').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  return data;
}
