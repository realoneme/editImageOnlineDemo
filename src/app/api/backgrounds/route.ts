import { NextResponse } from 'next/server';

// Interface for background image data
export interface BackgroundImage {
  id: number;
  url: string;
  title: string;
}

// 本地图片数据
const localBackgrounds: BackgroundImage[] = [
  {
    id: 1,
    url: '/images/field-9322539_1920.jpg',
    title: '草原'
  },
  {
    id: 2,
    url: '/images/flower-9453063_1920.jpg',
    title: '花'
  },
  {
    id: 3,
    url: '/images/trees-7544451_1920.jpg',
    title: '森林'
  },
  {
    id: 4,
    url: '/images/vietnam-8560196_1920.jpg',
    title: 'ベトナム'
  },
  {
    id: 5,
    url: '/images/banana-9420582_1920.png',
    title: 'バナナ'
  }
];

// Next.js API route handler
export async function GET() {  
  // Return the local backgrounds as JSON
  return NextResponse.json(localBackgrounds);
}
