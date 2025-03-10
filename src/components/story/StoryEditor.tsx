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

  const [backgroundImage] = useImage(story.backgroundImage);
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
      fontFamily: "Arial",
      fill: "#ffffff",
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
    setStory({
      ...story,
      items: story.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...newProps,
          };
        }
        return item;
      }),
    });
  };

  // Update text content
  const updateTextContent = (id: string, content: string) => {
    setStory({
      ...story,
      items: story.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            content,
          };
        }
        return item;
      }),
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
      } catch (error) {
        console.error("Error exporting image:", error);
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
              onChange={(newProps) => updateItemPos(item.id, newProps)}
              onTextChange={(text) => updateTextContent(item.id, text)}
              onTransformEnd={(newProps) => updateItemPos(item.id, newProps)}
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
    </div>
  );
};

export default StoryEditor;
