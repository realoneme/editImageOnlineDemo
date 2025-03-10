"use client";

import { useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { StoryItem, StoryState } from "@/types/story";
import TextElement from "./TextElement";
import ImageElement from "./ImageElement";
import StoryToolbar from "./StoryToolbar";

const defaultItems: StoryItem[] = [];

const StoryEditor = () => {
  const [story, setStory] = useState<StoryState>({
    backgroundImage: "/images/default-background.jpg",
    items: defaultItems,
    selectedId: null,
  });

  // 控制底部文本输入框的状态
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // 编辑器选项卡状态
  const [activeTab, setActiveTab] = useState("text"); // text, font, color, align
  const [selectedFont, setSelectedFont] = useState("var(--font-geist-sans)");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [textAlign, setTextAlign] = useState("left"); // left, center, right
  
  // 可用字体列表
  const fontOptions = [
    { name: "Geist", variable: "var(--font-geist-sans)" },
    { name: "Geist Mono", variable: "var(--font-geist-mono)" },
    { name: "Inter", variable: "var(--font-inter)" },
    { name: "Roboto", variable: "var(--font-roboto)" },
    { name: "Roboto Mono", variable: "var(--font-roboto-mono)" },
    { name: "Playfair Display", variable: "var(--font-playfair)" },
    { name: "Lora", variable: "var(--font-lora)" },
    { name: "Raleway", variable: "var(--font-raleway)" },
    { name: "Open Sans", variable: "var(--font-open-sans)" },
    { name: "Noto Sans SC", variable: "var(--font-noto-sans-sc)" },
    { name: "Noto Serif SC", variable: "var(--font-noto-serif-sc)" },
    { name: "系统默认", variable: "system-ui" },
    { name: "Arial", variable: "Arial" },
    { name: "Times New Roman", variable: "Times New Roman" }
  ]

  const [backgroundImage] = useImage(story.backgroundImage, 'anonymous');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Size settings for mobile-like canvas (Instagram story ratio)
  const stageWidth = 360;
  const stageHeight = 640;

  // Handle selection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setStory({
        ...story,
        selectedId: null,
      });
    }
  };

  // Add new text element
  const addText = () => {
    const id = `text-${Date.now()}`;
    const newTextItem: StoryItem = {
      id,
      type: "text",
      x: stageWidth / 2,
      y: stageHeight / 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      isDragging: false,
      content: "Double click to edit",
      fontSize: 24,
      fontFamily: "var(--font-geist-sans)",
      fill: "#ffffff",
      width: stageWidth / 2, // 初始宽度为canvas宽度的一半
      zIndex: story.items.length + 1,
    };

    setStory({
      ...story,
      items: [...story.items, newTextItem],
      selectedId: id,
    });
  };

  // Add sticker or image
  const addImage = (type: "image" | "sticker", src: string) => {
    const id = `${type}-${Date.now()}`;
    const newImageItem: StoryItem = {
      id,
      type,
      x: stageWidth / 2,
      y: stageHeight / 2,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      isDragging: false,
      content: src,
      zIndex: story.items.length + 1,
    };

    setStory({
      ...story,
      items: [...story.items, newImageItem],
      selectedId: id,
    });
  };

  // Add stickers
  const addSticker = (id: number) => {
    addImage("sticker", `/images/sticker${id}.png`);
  };

  // Update item position
  const updateItemPos = (id: string, newProps: Partial<StoryItem>) => {
    // Use functional update to get the latest state
    // This ensures we don't lose any changes made by updateTextContent
    setStory((prevStory) => {
      // Skip this update if newProps is empty
      if (!newProps || Object.keys(newProps).length === 0) {
        return prevStory;
      }

      // Make clean copy of all items
      const newItems = prevStory.items.map((item) => {
        if (item.id === id) {
          // Preserve the content field if it's not being explicitly changed
          // This prevents content changes from being lost
          const updatedItem = {
            ...item,
            ...newProps,
          };

          return updatedItem;
        }
        return item;
      });

      // Return entirely new state object
      return {
        ...prevStory,
        items: newItems,
      };
    });
  };

  // Update text content
  const updateTextContent = (id: string, content: string) => {
    // Add additional safeguards to ensure content is not empty or undefined
    if (content === undefined || content === null) {
      return;
    }

    // Force content to be a string
    const safeContent = String(content);

    // Direct state update to avoid race conditions and ensure atomicity
    setStory((prevStory) => {
      // Create a new items array with the updated content
      // Important: we need to make sure this is a clean update with no dependencies on other state changes
      const newItems = prevStory.items.map((item) => {
        if (item.id === id) {
          // Create a completely new item object with updated content
          return {
            ...item,
            content: safeContent, // This is critical - must be assigned correctly
          };
        }
        return item;
      });

      // Create a completely new state object
      const newState = {
        ...prevStory,
        items: newItems,
      };

      return newState;
    });
  };

  // Delete selected item
  const deleteSelected = () => {
    if (story.selectedId) {
      setStory({
        ...story,
        items: story.items.filter((item) => item.id !== story.selectedId),
        selectedId: null,
      });
    }
  };

  // Adjust layer (move up/down)
  const adjustLayer = (direction: "up" | "down") => {
    if (!story.selectedId) return;

    const sortedItems = [...story.items].sort((a, b) => a.zIndex - b.zIndex);
    const selectedIndex = sortedItems.findIndex((item) => item.id === story.selectedId);

    if (
      (direction === "up" && selectedIndex === sortedItems.length - 1) ||
      (direction === "down" && selectedIndex === 0)
    ) {
      return; // Already at the top/bottom
    }

    const swapIndex = direction === "up" ? selectedIndex + 1 : selectedIndex - 1;
    const swapItem = sortedItems[swapIndex];

    // Swap zIndex values
    const newItems = story.items.map((item) => {
      if (item.id === story.selectedId) {
        return { ...item, zIndex: swapItem.zIndex };
      }
      if (item.id === swapItem.id) {
        return { ...item, zIndex: sortedItems[selectedIndex].zIndex };
      }
      return item;
    });

    setStory({
      ...story,
      items: newItems,
    });
  };

  // Export to image
  const exportToImage = async () => {
    if (!stageRef.current || !containerRef.current) return;

    // Temporarily hide transformer
    const selectedId = story.selectedId;
    setStory({ ...story, selectedId: null });

    // Wait for render to complete
    setTimeout(async () => {
      try {
        // Use Konva's toDataURL method directly
        const dataUrl = stageRef.current.toDataURL({
          pixelRatio: 2,
          mimeType: "image/png",
        });

        // Create a download link
        const link = document.createElement("a");
        link.download = "instagram-story.png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Restore selection
        setStory({ ...story, selectedId });
      } catch {
        // 显示用户友好的错误提示
        alert('画像の保存中にエラーが発生しました。外部画像を使用している場合は、ローカルの画像に変更してみてください。');
        
        // Restore selection
        setStory({ ...story, selectedId });
      }
    }, 100);
  };

  // Render items based on their type
  const renderItems = () => {
    return story.items
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((item) => {
        const isSelected = item.id === story.selectedId;

        if (item.type === "text") {


          return (
            <TextElement
              key={item.id}
              item={item}
              isSelected={isSelected}
              onSelect={() => setStory({ ...story, selectedId: item.id })}
              onChange={(newProps) => {
                // IMPORTANT: We need to avoid calling both updateTextContent and updateItemPos in the same render cycle
                // Handle content updates using a dedicated path to prevent conflicts

                
                if (newProps.content !== undefined) {
                  // Content update takes priority
                  updateTextContent(item.id, newProps.content);

                  // Delay the position/property updates to avoid state conflicts
                  setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { content, ...otherProps } = newProps;
                    if (Object.keys(otherProps).length > 0) {

                      updateItemPos(item.id, otherProps);
                    }
                  }, 0);
                } else {
                  // No content update, just position/properties update

                  updateItemPos(item.id, newProps);
                }
              }}
              onTextChange={(text) => updateTextContent(item.id, text)}
              onTransformEnd={(newProps) => {
                // Similar to onChange, we need to handle content updates separately
                if (newProps.content) {
                  // Handle content update first
                  updateTextContent(item.id, newProps.content);

                  // Delay property updates to avoid state conflicts
                  setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { content, ...restProps } = newProps;
                    if (Object.keys(restProps).length > 0) {
                      updateItemPos(item.id, restProps);
                    }
                  }, 0);
                } else {
                  updateItemPos(item.id, newProps);
                }
              }}
              onOpenBottomEditor={(id, text) => {
                // 打开底部编辑器
                setEditingTextId(id);
                setEditingText(text);

                // 找到当前编辑的文本元素
                const currentItem = story.items.find((item) => item.id === id);
                if (currentItem) {
                  // 设置相应的字体、颜色和对齐方式
                  setSelectedFont(currentItem.fontFamily || "var(--font-geist-sans)");
                  setSelectedColor(currentItem.fill || "#000000");
                  setTextAlign(currentItem.align || "left");
                }

                setTextEditorVisible(true);
              }}
            />
          );
        } else if (item.type === "image" || item.type === "sticker") {
          return (
            <ImageElement
              key={item.id}
              item={item}
              isSelected={isSelected}
              onSelect={() => setStory({ ...story, selectedId: item.id })}
              onChange={(newProps) => updateItemPos(item.id, newProps)}
              onTransformEnd={(newProps) => updateItemPos(item.id, newProps)}
            />
          );
        }
        return null;
      });
  };

  // Background change handler
  const handleBackgroundChange = (newBackground: string) => {
    setStory({
      ...story,
      backgroundImage: newBackground,
    });
  };

  return (
    <div className="flex flex-col items-center w-full py-4">
      <div
        ref={containerRef}
        className="relative border border-gray-300 rounded-md overflow-hidden"
        style={{ width: stageWidth, height: stageHeight }}
      >
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={stageRef}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          className="bg-black"
        >
          <Layer>
            {/* Background Image */}
            {backgroundImage && (
              <KonvaImage image={backgroundImage} width={stageWidth} height={stageHeight} x={0} y={0} />
            )}
            {/* Story Elements */}
            {renderItems()}
          </Layer>
        </Stage>
      </div>

      {/* Toolbar */}
      <StoryToolbar
        onAddText={addText}
        onAddSticker={(id) => addSticker(id)}
        onDeleteSelected={deleteSelected}
        onMoveUp={() => adjustLayer("up")}
        onMoveDown={() => adjustLayer("down")}
        onExport={exportToImage}
        hasSelection={!!story.selectedId}
        onBackgroundChange={handleBackgroundChange}
      />

      {/* 底部弹出窗口文本编辑器 */}
      {textEditorVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10 flex flex-col transition-transform duration-300 ease-in-out">
          {/* 顶部选项卡 */}
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <div className="flex space-x-6 mx-auto">
              <button
                onClick={() => setActiveTab("text")}
                className={`p-3 rounded-full ${activeTab === "text" ? "bg-yellow-100" : ""}`}
              >
                <span className="text-gray-500 text-xl">文</span>
              </button>
              <button
                onClick={() => setActiveTab("font")}
                className={`p-3 rounded-full ${activeTab === "font" ? "bg-yellow-100" : ""}`}
              >
                <span className="text-gray-500 text-xl">字</span>
              </button>
              <button
                onClick={() => setActiveTab("color")}
                className={`p-3 rounded-full ${activeTab === "color" ? "bg-yellow-100" : ""}`}
              >
                <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0 -6 0" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTab("align")}
                className={`p-3 rounded-full ${activeTab === "align" ? "bg-yellow-100" : ""}`}
              >
                <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setTextEditorVisible(false)}
              className="absolute right-4 top-3 bg-transparent border-none text-xl cursor-pointer text-gray-600"
            >
              ✓
            </button>
          </div>

          {/* 内容区域 - 根据选项卡显示不同内容 */}
          <div className="p-4">
            {activeTab === "text" && (
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 text-base resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                style={{ fontFamily: selectedFont, textAlign: textAlign as "left" | "center" | "right" }}
                autoFocus
              />
            )}

            {activeTab === "font" && (
              <div className="grid grid-cols-3 gap-4">
                {fontOptions.map((font) => (
                  <div
                    key={font.name}
                    onClick={() => {
                      setSelectedFont(font.variable);
                      // 立即应用字体，但不关闭编辑器
                      if (editingTextId) {
                        // 找到当前文本元素，获取其现有的fontSize
                        const currentItem = story.items.find((item) => item.id === editingTextId);
                        if (currentItem) {
                          // 保留当前的fontSize和其他属性，只更新fontFamily
                          updateItemPos(editingTextId, { 
                            fontFamily: font.variable,
                            fontSize: currentItem.fontSize // 确保保留当前字体大小
                          });
                        } else {
                          updateItemPos(editingTextId, { fontFamily: font.variable });
                        }
                      }
                    }}
                    className={`bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                      selectedFont === font.variable ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    <div className="text-2xl" style={{ fontFamily: font.variable }}>
                      永A
                    </div>
                    <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">{font.name}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "color" && (
              <div className="grid grid-cols-5 gap-4">
                {[
                  "#000000",
                  "#FFFFFF",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#FFA500",
                  "#FFC0CB",
                ].map((color) => (
                  <div
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      // 立即应用颜色，但不关闭编辑器
                      if (editingTextId) {
                        // 找到当前文本元素，获取其现有的fontSize
                        const currentItem = story.items.find((item) => item.id === editingTextId);
                        if (currentItem) {
                          // 保留当前的fontSize和其他属性，只更新颜色
                          updateItemPos(editingTextId, { 
                            fill: color,
                            fontSize: currentItem.fontSize // 确保保留当前字体大小
                          });
                        } else {
                          updateItemPos(editingTextId, { fill: color });
                        }
                      }
                    }}
                    className={`w-12 h-12 rounded-full cursor-pointer ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-yellow-400" : ""
                    }`}
                    style={{ backgroundColor: color, border: color === "#FFFFFF" ? "1px solid #ddd" : "none" }}
                  />
                ))}
              </div>
            )}

            {activeTab === "align" && (
              <div className="flex justify-center space-x-8 py-4">
                <button
                  onClick={() => {
                    setTextAlign("left");
                    // 应用文本对齐方式
                    if (editingTextId) {
                      // 找到当前文本元素，获取其现有的fontSize
                      const currentItem = story.items.find((item) => item.id === editingTextId);
                      if (currentItem) {
                        // 保留当前的fontSize和其他属性，只更新对齐方式
                        updateItemPos(editingTextId, { 
                          align: "left",
                          fontSize: currentItem.fontSize // 确保保留当前字体大小
                        });
                      } else {
                        updateItemPos(editingTextId, { align: "left" });
                      }
                    }
                  }}
                  className={`p-3 ${textAlign === "left" ? "bg-blue-100 text-blue-500" : "text-gray-500"}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h12" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setTextAlign("center");
                    if (editingTextId) {
                      // 找到当前文本元素，获取其现有的fontSize
                      const currentItem = story.items.find((item) => item.id === editingTextId);
                      if (currentItem) {
                        // 保留当前的fontSize和其他属性，只更新对齐方式
                        updateItemPos(editingTextId, { 
                          align: "center",
                          fontSize: currentItem.fontSize // 确保保留当前字体大小
                        });
                      } else {
                        updateItemPos(editingTextId, { align: "center" });
                      }
                    }
                  }}
                  className={`p-3 ${textAlign === "center" ? "bg-blue-100 text-blue-500" : "text-gray-500"}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M6 18h12" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setTextAlign("right");
                    if (editingTextId) {
                      // 找到当前文本元素，获取其现有的fontSize
                      const currentItem = story.items.find((item) => item.id === editingTextId);
                      if (currentItem) {
                        // 保留当前的fontSize和其他属性，只更新对齐方式
                        updateItemPos(editingTextId, { 
                          align: "right",
                          fontSize: currentItem.fontSize // 确保保留当前字体大小
                        });
                      } else {
                        updateItemPos(editingTextId, { align: "right" });
                      }
                    }
                  }}
                  className={`p-3 ${textAlign === "right" ? "bg-blue-100 text-blue-500" : "text-gray-500"}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M8 18h12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 底部保存按钮 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (editingTextId) {
                  // 更新文本内容
                  updateTextContent(editingTextId, editingText);
                  // 关闭编辑器
                  setTextEditorVisible(false);
                  setEditingTextId(null);
                  setEditingText("");
                }
              }}
              className="w-full bg-blue-500 text-white border-none rounded-lg py-3 text-base font-bold cursor-pointer"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
