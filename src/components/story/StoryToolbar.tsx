"use client";

import { useState } from "react";
import Image from "next/image";
import { useBackgrounds, type BackgroundImage } from "@/hooks/useBackgrounds";

interface StoryToolbarProps {
  onAddText: () => void;
  onAddSticker: (id: number) => void;
  onDeleteSelected: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onExport: () => void;
  hasSelection: boolean;
  onBackgroundChange: (url: string) => void;
}

const StoryToolbar = ({
  onAddText,
  onAddSticker,
  onDeleteSelected,
  onMoveUp,
  onMoveDown,
  onExport,
  hasSelection,
  onBackgroundChange,
}: StoryToolbarProps) => {
  const [showStickers, setShowStickers] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const { backgrounds, loading, error } = useBackgrounds();

  // Available stickers
  const stickers = [1, 2];

  return (
    <div className="flex flex-col w-full max-w-md mt-4 gap-2">
      <div className="flex justify-center space-x-2">
        <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md" onClick={onAddText}>
          テキスト追加
        </button>

        <div className="relative">
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md"
            onClick={() => setShowStickers(!showStickers)}
          >
            スタンプ追加
          </button>

          {showStickers && (
            <div className="absolute mt-2 bg-white p-2 rounded-md shadow-lg z-10 flex flex-wrap gap-2">
              {stickers.map((stickerId) => (
                <button
                  key={stickerId}
                  className="w-10 h-10 rounded-md overflow-hidden border border-gray-300"
                  onClick={() => {
                    onAddSticker(stickerId);
                    setShowStickers(false);
                  }}
                >
                  <Image
                    src={`/images/sticker${stickerId}.png`}
                    alt={`Sticker ${stickerId}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md" onClick={onExport}>
          画像として保存
        </button>
      </div>

      {hasSelection && (
        <div className="flex justify-center space-x-2 mt-2">
          <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md" onClick={onMoveUp}>
            前面へ移動
          </button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md" onClick={onMoveDown}>
            背面へ移動
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md" onClick={onDeleteSelected}>
            削除
          </button>
        </div>
      )}

      <div className="flex justify-center space-x-2 mt-2">
        <div className="relative">
          <button
            className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md"
            onClick={() => setShowBackgrounds(!showBackgrounds)}
          >
            背景の変更
          </button>

          {showBackgrounds && (
            <div className="absolute mt-2 bg-white p-3 rounded-md shadow-lg z-10 w-72 max-h-80 overflow-y-auto">
              <h3 className="text-gray-800 font-medium mb-2 pb-1 border-b border-gray-200">背景の選択</h3>

              {loading ? (
                <p className="text-gray-600 text-sm py-2">ロード中...</p>
              ) : error ? (
                <p className="text-red-500 text-sm py-2">エラーが発生しました</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Add default background option */}
                  <div
                    className="cursor-pointer rounded-md overflow-hidden border-2 hover:border-blue-500 transition-all"
                    onClick={() => {
                      onBackgroundChange("/images/default-background.jpg");
                      setShowBackgrounds(false);
                    }}
                  >
                    <div className="h-24 bg-gray-200 relative flex items-center justify-center">
                      <Image
                        src="/images/default-background.jpg"
                        alt="Default"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        デフォルト
                      </div>
                    </div>
                  </div>

                  {/* Map through fetched backgrounds */}
                  {backgrounds.map((bg: BackgroundImage) => (
                    <div
                      key={bg.id}
                      className="cursor-pointer rounded-md overflow-hidden border-2 hover:border-blue-500 transition-all"
                      onClick={() => {
                        onBackgroundChange(bg.url);
                        setShowBackgrounds(false);
                      }}
                    >
                      <div className="h-24 bg-gray-200 relative flex items-center justify-center">
                        <Image src={bg.url} alt={bg.title} className="h-full w-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {bg.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryToolbar;
