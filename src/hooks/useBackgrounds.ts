'use client';

import { useState, useEffect } from 'react';

// Define the BackgroundImage interface here since we removed the mocks folder
export interface BackgroundImage {
  id: number;
  url: string;
  title: string;
}

export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBackgrounds() {
      try {
        setLoading(true);
        const response = await fetch('/api/backgrounds');
        
        if (!response.ok) {
          throw new Error('Failed to fetch background images');
        }
        
        const data = await response.json();
        setBackgrounds(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        // Error is already handled via the error state
      } finally {
        setLoading(false);
      }
    }

    fetchBackgrounds();
  }, []);

  return { backgrounds, loading, error };
}
