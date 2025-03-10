"use client";

import { useState, useRef, useEffect } from "react";
import { Text, Transformer } from "react-konva";
import { StoryItem } from "@/types/story";

// Canvas宽度常量
const CANVAS_WIDTH = 360;

// 将CSS变量字体名映射为实际字体名
const mapFontFamily = (fontFamily: string | undefined): string => {
  if (!fontFamily) return "Arial";
  
  // 处理CSS变量格式的字体名
  const fontMap: Record<string, string> = {
    "var(--font-geist-sans)": "Geist Sans, sans-serif",
    "var(--font-geist-mono)": "Geist Mono, monospace", 
    "var(--font-inter)": "Inter, sans-serif",
    "var(--font-roboto)": "Roboto, sans-serif",
    "var(--font-roboto-mono)": "Roboto Mono, monospace",
    "var(--font-playfair)": "Playfair Display, serif",
    "var(--font-lora)": "Lora, serif",
    "var(--font-raleway)": "Raleway, sans-serif",
    "var(--font-open-sans)": "Open Sans, sans-serif",
    "var(--font-noto-sans-sc)": "Noto Sans SC, sans-serif",
    "var(--font-noto-serif-sc)": "Noto Serif SC, serif",
    "system-ui": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  };
  
  return fontMap[fontFamily] || fontFamily;
};

interface TextElementProps {
  item: StoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<StoryItem>) => void;
  onTextChange: (text: string) => void;
  onTransformEnd: (newAttrs: Partial<StoryItem>) => void;
  onOpenBottomEditor?: (id: string, text: string) => void; // 添加打开底部编辑器的回调
}

const TextElement = ({
  item,
  isSelected,
  onSelect,
  onChange,
  onTextChange,
  onTransformEnd,
  onOpenBottomEditor,
}: TextElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // 添加内部字体大小状态，确保在渲染期间一致性
  const [internalFontSize, setInternalFontSize] = useState(item.fontSize || 24);
  // 添加用于检测移动设备双击的状态
  const [lastTapTime, setLastTapTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);
  // Reference to the stage container for positioning
  const [sliderPosition, setSliderPosition] = useState({ x: 0, y: 0 });

  // 当组件初始化或外部props变化时捕获字体大小
  useEffect(() => {

    setInternalFontSize(item.fontSize || 24);
  }, [item.fontSize]);
  
  // 当所有依赖项变化时更新渲染
  useEffect(() => {
    // 如果节点已创建，确保字体大小与内部状态同步
    if (textRef.current) {
      textRef.current.fontSize(internalFontSize);
      textRef.current.getLayer()?.batchDraw();
    }
  }, [internalFontSize]);

  // Handle node selection and transformer updates
  useEffect(() => {
    if (isSelected && textRef.current && transformerRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer().batchDraw();

      // Update slider position when text is selected
      if (textRef.current) {
        const stage = textRef.current.getStage();
        const textPosition = textRef.current.absolutePosition();
        const stageBox = stage.container().getBoundingClientRect();

        setSliderPosition({
          x: stageBox.left + textPosition.x - 100,
          y: stageBox.top + textPosition.y + 60,
        });
      }
    }
  }, [isSelected]);

  // Handle click to edit text
  const handleTextClick = () => {
    setIsEditing(true);

    // Create textarea for editing
    const textNode = textRef.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    const textPosition = textNode.absolutePosition();

    // Calculate position with scale and rotation
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    // Create and style textarea
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = item.content;
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() * textNode.scaleX()}px`;
    textarea.style.minHeight = `${textNode.height() * textNode.scaleY()}px`;
    textarea.style.fontSize = `${item.fontSize}px`;
    textarea.style.border = "1px solid #3b82f6";
    textarea.style.padding = "4px";
    textarea.style.margin = "0";
    textarea.style.overflow = "hidden"; // Changed to hidden for auto-height
    textarea.style.background = "rgba(0, 0, 0, 0.05)";
    textarea.style.outline = "none";
    textarea.style.resize = "none"; // Disable resizing during edit mode
    textarea.style.lineHeight = "1.2";
    textarea.style.fontFamily = mapFontFamily(item.fontFamily);
    textarea.style.color = item.fill || "#ffffff";
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = "left";
    textarea.style.transform = `rotate(${item.rotation}deg)`;
    textarea.style.wordWrap = "break-word";

    // Set a minimum width
    textarea.style.minWidth = "100px";

    textarea.focus();

    // Auto-resize function
    const autoResizeTextarea = (element: HTMLTextAreaElement) => {
      // Reset height to auto to get the correct scrollHeight
      element.style.height = "auto";
      // Set height to scrollHeight to expand with content
      element.style.height = `${element.scrollHeight}px`;
    };

    // Handle text changes and auto-expand
    const handleTextareaChange = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      const newText = target.value;

      // Update the content in the parent component - this gets displayed in the Text
      onTextChange(newText);

      // Immediately save changes to the story state
      onChange({ content: newText });

      // Auto-adjust height based on content
      autoResizeTextarea(target);
    };

    // Click outside handler
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target !== textarea) {
        // Only handle blur if the textarea still exists
        if (document.body.contains(textarea)) {
          handleBlur();
        }
      }
    };

    // Handle enter key for line breaks
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBlur();
      }
      // Allow Enter for line breaks
    };

    // Handle blur - finish editing
    const handleBlur = () => {
      try {
        // Make sure the textarea exists
        if (!document.body.contains(textarea)) {
          return;
        }

        // Get the textarea dimensions and final text content before removing it
        const finalWidth = textarea.offsetWidth;
        const finalHeight = textarea.offsetHeight;
        const finalText = textarea.value;

        // CRITICAL: Save the content to the item BEFORE removing the textarea
        // This needs to happen before any DOM manipulation
        onTextChange(finalText); // Update the displayed text
        onChange({ content: finalText }); // Save to the story state

        // Remove event listeners first
        window.removeEventListener("click", handleClickOutside);
        textarea.removeEventListener("input", handleTextareaChange);
        textarea.removeEventListener("blur", handleBlur);
        textarea.removeEventListener("keydown", handleKeyDown);

        // Clean up the DOM
        document.body.removeChild(textarea);
        setIsEditing(false);

        // Update dimensions
        const node = textRef.current;
        if (node) {
          onTransformEnd({
            width: finalWidth,
            height: finalHeight,
            content: finalText, // Also include content in the transform end event
          });
        }
      } catch {}
    };

    // Add event listeners
    textarea.addEventListener("input", handleTextareaChange);
    textarea.addEventListener("blur", handleBlur);
    textarea.addEventListener("keydown", handleKeyDown);

    // Set a timeout to add the click outside listener and do initial sizing
    setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
      // Initial auto-resize
      autoResizeTextarea(textarea);
    }, 10);
  };

  // 处理变形结束事件 - 回归原始简单实现
  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;

    // 获取当前缩放值
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 计算新字体大小并更新
    const oldFontSize = internalFontSize;
    const newFontSize = Math.max(8, Math.round(oldFontSize * ((scaleX + scaleY) / 2)));
    

    
    // 更新内部状态
    setInternalFontSize(newFontSize);
    
    // 重要：使用与原始实现相同的方式更新状态
    onTransformEnd({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      fontSize: newFontSize,
      // 使用scaleX=1和scaleY=1，让字体大小控制字词的实际大小
      scaleX: 1,
      scaleY: 1,
    });
  };

  // Render slider outside of Konva canvas using React Portal
  useEffect(() => {
    // Clean up function to remove slider on unmount
    return () => {
      const existingSlider = document.getElementById("text-font-size-slider");
      if (existingSlider && existingSlider.parentNode) {
        existingSlider.parentNode.removeChild(existingSlider);
      }
    };
  }, []);

  // Create or update the slider element
  useEffect(() => {
    // Remove existing slider if any
    const existingSlider = document.getElementById("text-font-size-slider");
    if (existingSlider) {
      existingSlider.parentNode?.removeChild(existingSlider);
    }

    // Create slider when text is selected (available during both editing and non-editing)
    if (isSelected) {
      // Create slider container
      const sliderContainer = document.createElement("div");
      sliderContainer.id = "text-font-size-slider";
      sliderContainer.style.position = "absolute";
      sliderContainer.style.top = `${sliderPosition.y}px`;
      sliderContainer.style.left = `${sliderPosition.x}px`;
      sliderContainer.style.width = "200px";
      sliderContainer.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      sliderContainer.style.padding = "8px";
      sliderContainer.style.borderRadius = "4px";
      sliderContainer.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
      sliderContainer.style.zIndex = "1000";
      sliderContainer.style.display = "flex";
      sliderContainer.style.flexDirection = "column";
      sliderContainer.style.gap = "4px";

      // Create label
      const label = document.createElement("div");
      label.style.fontSize = "12px";
      label.style.color = "#333";
      label.style.userSelect = "none"; // Prevent text selection
      label.textContent = `文字サイズ: ${item.fontSize || 24}px`;

      // Create slider input
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "8";
      slider.max = "72";
      slider.value = (item.fontSize || 24).toString();
      slider.style.width = "100%";
      slider.style.accentColor = "#3b82f6";

      // 滑块事件处理 - 简化实现
      slider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const newFontSize = parseInt(target.value, 10);
        
        // 更新标签文本
        label.textContent = `文字サイズ: ${newFontSize}px`;
        
        // 更新内部状态以触发UI立即更新
        setInternalFontSize(newFontSize);
        
        // 同步到编辑器（如果存在）
        if (isEditing) {
          const textarea = document.querySelector("textarea");
          if (textarea) {
            textarea.style.fontSize = `${newFontSize}px`;
          }
        }
      });
      
      // 滑块拖动结束时更新到父组件
      slider.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const finalFontSize = parseInt(target.value, 10);
        

        
        // 理清这里的逻辑：把fontSize作为全新的字段添加到item
        // 这会触发StoryEditor里的updateItemPos函数更新状态
        onChange({
          fontSize: finalFontSize,
          scaleX: 1,  // 确保缩放比例始终为1，让字体大小控制实际大小
          scaleY: 1
        });
      });


      // Append elements to container
      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);

      // Append container to body
      document.body.appendChild(sliderContainer);
    }

    // Clean up function
    return () => {
      if (existingSlider) {
        existingSlider.parentNode?.removeChild(existingSlider);
      }
    };
  }, [isSelected, isEditing, item.fontSize, sliderPosition, onChange]);

  return (
    <>
      <Text
        ref={textRef}
        x={item.x}
        y={item.y}
        text={item.content}
        fontSize={internalFontSize}
        fontFamily={mapFontFamily(item.fontFamily)}
        fill={item.fill}
        draggable
        rotation={item.rotation}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        width={item.width || CANVAS_WIDTH / 2}
        height={item.height}
        lineHeight={1.2}
        align={item.align || "left"}
        wrap="word"
        onDragStart={() => onChange({ isDragging: true })}
        onDragEnd={(e) => {
          onChange({
            isDragging: false,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onClick={() => {
          onSelect();
        }}
        onTap={() => {
          onSelect();
          
          // 实现双击检测逻辑
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTapTime;
          
          // 如果两次点击间隔小于 300ms，视为双击
          if (tapLength < 300 && tapLength > 0) {
            if (onOpenBottomEditor) {
              onOpenBottomEditor(item.id, item.content);
            } else if (isSelected && !isEditing) {
              handleTextClick();
            }
          }
          
          setLastTapTime(currentTime);
        }}
        onDblClick={() => {
          // 双击时打开底部编辑器（如果提供了回调）
          if (onOpenBottomEditor) {
            onOpenBottomEditor(item.id, item.content);
          } else if (isSelected && !isEditing) {
            // 向后兼容：如果没有提供底部编辑器回调，使用原来的编辑方式
            handleTextClick();
          }
        }}
        perfectDrawEnabled={false}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit size to prevent scaling to zero
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            // 限制最大宽度为 canvas 宽度
            if (newBox.width > CANVAS_WIDTH) {
              newBox.width = CANVAS_WIDTH;
            }
            return newBox;
          }}
          keepRatio={true} // Force aspect ratio preservation
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} // Only use corner anchors for proportional scaling
          anchorSize={15} // Larger anchor points for easier touch
          anchorCornerRadius={5} // Rounded corners for better touch feel
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
          anchorStrokeWidth={2}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          borderDash={[4, 4]}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotateAnchorOffset={30} // More space for rotation handle
        />
      )}
    </>
  );
};

export default TextElement;
