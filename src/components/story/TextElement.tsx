"use client";

import { useState, useRef, useEffect } from "react";
import { Text, Transformer } from "react-konva";
import { StoryItem } from "@/types/story";

interface TextElementProps {
  item: StoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<StoryItem>) => void;
  onTextChange: (text: string) => void;
  onTransformEnd: (newAttrs: Partial<StoryItem>) => void;
}

const TextElement = ({ item, isSelected, onSelect, onChange, onTextChange, onTransformEnd }: TextElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);

  // Handle node selection and transformer updates
  useEffect(() => {
    if (isSelected && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle double click to edit text
  const handleDblClick = () => {
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
    textarea.style.height = `${textNode.height() * textNode.scaleY()}px`;
    textarea.style.fontSize = `${item.fontSize}px`;
    textarea.style.border = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.overflow = "hidden";
    textarea.style.background = "transparent";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = "1";
    textarea.style.fontFamily = item.fontFamily || "Arial";
    textarea.style.color = item.fill || "#ffffff";
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = "center";
    textarea.style.transform = `rotate(${item.rotation}deg)`;

    textarea.focus();

    // Handle text changes
    const handleTextareaChange = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      const newText = target.value;
      onTextChange(newText);
    };

    // Handle blur - finish editing
    const handleBlur = () => {
      document.body.removeChild(textarea);
      setIsEditing(false);

      window.removeEventListener("click", handleClickOutside);
      textarea.removeEventListener("change", handleTextareaChange);
      textarea.removeEventListener("keydown", handleKeyDown);
    };

    // Click outside handler
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target !== textarea) {
        handleBlur();
      }
    };

    // Handle enter key to finish editing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        handleBlur();
      }
    };

    textarea.addEventListener("change", handleTextareaChange);
    textarea.addEventListener("keydown", handleKeyDown);
    setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
    });
  };

  // Handle transform end
  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    onTransformEnd({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX,
      scaleY,
    });
  };

  return (
    <>
      <Text
        ref={textRef}
        x={item.x}
        y={item.y}
        text={item.content}
        fontSize={item.fontSize}
        fontFamily={item.fontFamily}
        fill={item.fill}
        draggable
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        onDragStart={() => onChange({ isDragging: true })}
        onDragEnd={(e) => {
          onChange({
            isDragging: false,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
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
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default TextElement;
