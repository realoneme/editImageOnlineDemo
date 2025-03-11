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
                    width={300}
                    height={300}
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
            <div className="fixed bottom-16 left-0 right-0 mx-auto w-11/12 max-w-4xl bg-white p-3 rounded-md shadow-lg z-50 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between border-b border-gray-200 pb-2 mb-3">
                <h3 className="text-gray-800 font-medium">背景の選択</h3>
                <button onClick={() => setShowBackgrounds(false)} className="text-gray-500 hover:text-gray-700">
                  ✓
                </button>
              </div>

              {loading ? (
                <div className="p-4 flex justify-center">
                  <p className="text-gray-600">ロード中...</p>
                </div>
              ) : error ? (
                <div className="p-4 flex justify-center">
                  <p className="text-red-500">エラーが発生しました</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {/* デフォルト背景 */}
                  <div
                    onClick={() => {
                      onBackgroundChange("/images/default-background.png");
                      setShowBackgrounds(false);
                    }}
                    className="bg-gray-100 p-1 rounded-lg flex flex-col items-center cursor-pointer hover:ring-2 hover:ring-yellow-400 overflow-hidden"
                  >
                    <div className="relative w-full h-24 mb-2 overflow-hidden rounded">
                      <Image
                        src="/images/default-background.png"
                        alt="Default"
                        className="object-contain w-full h-full"
                        width={360}
                        height={640}
                      />
                    </div>
                    <div className="text-xs text-gray-500 truncate w-full text-center">デフォルト</div>
                  </div>

                  {/* ランダム背景 */}
                  {backgrounds.map((bg: BackgroundImage) => (
                    <div
                      key={bg.id}
                      onClick={() => {
                        onBackgroundChange(bg.url);
                        setShowBackgrounds(false);
                      }}
                      className="bg-gray-100 p-1 rounded-lg flex flex-col items-center cursor-pointer hover:ring-2 hover:ring-yellow-400 overflow-hidden"
                    >
                      <div className="relative w-full h-24 mb-2 overflow-hidden rounded">
                        <Image
                          src={bg.url}
                          alt={bg.title}
                          className="object-cover w-full h-full"
                          width={300}
                          height={300}
                        />
                      </div>
                      <div className="text-xs text-gray-500 truncate w-full text-center">{bg.title}</div>
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
