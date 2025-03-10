import { StoryEditorClient } from './client-components';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="py-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Instagram Story Creator</h1>
          <p className="text-gray-300 mb-8">
            テキスト、スタンプ、レイヤー調整などの編集が可能なストーリー作成ツール
          </p>
        </header>
        
        <main className="flex flex-col items-center justify-center py-4">
          {/* Story Editor Component */}
          <StoryEditorClient />
        </main>
        
        <footer className="py-8 text-center text-gray-400 text-sm">
          <p>Powered by Next.js, React Konva, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
