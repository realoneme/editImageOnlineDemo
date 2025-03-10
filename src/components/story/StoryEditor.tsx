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
    // Use functional update to get the latest state
    // This ensures we don't lose any changes made by updateTextContent
    setStory(prevStory => {
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
    setStory(prevStory => {
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
        // Handle export error silently
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
          console.log(item, "TextElement");

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
