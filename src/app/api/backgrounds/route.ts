import { NextResponse } from 'next/server';
import { faker } from '@faker-js/faker';

// Interface for background image data
export interface BackgroundImage {
  id: number;
  url: string;
  title: string;
}

// Generate 10 random background images using faker
const generateBackgroundImages = (): BackgroundImage[] => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    url: faker.image.urlLoremFlickr({ category: 'nature', width: 1080, height: 1920 }),
    title: faker.lorem.words(2),
  }));
};

// Next.js API route handler
export async function GET() {
  // Generate random backgrounds
  const backgrounds = generateBackgroundImages();
  
  // Return the backgrounds as JSON
  return NextResponse.json(backgrounds);
}
