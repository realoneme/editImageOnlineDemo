export interface StoryItem {
  id: string;
  type: 'text' | 'image' | 'sticker';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  isDragging: boolean;
  zIndex: number;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
}

export interface StoryState {
  backgroundImage: string;
  items: StoryItem[];
  selectedId: string | null;
}
