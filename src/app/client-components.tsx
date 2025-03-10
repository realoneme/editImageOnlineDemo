'use client';

import dynamic from 'next/dynamic';

// Dynamically import all Konva components with no SSR to prevent hydration errors
export const StoryEditorClient = dynamic(
  () => import('@/components/story/StoryEditor'),
  { ssr: false }
);
