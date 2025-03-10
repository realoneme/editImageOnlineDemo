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
  // Reference to the stage container for positioning
  const [sliderPosition, setSliderPosition] = useState({ x: 0, y: 0 });

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
    textarea.style.fontFamily = item.fontFamily || "Arial";
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
      } catch {
      }
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

  // Handle transform end
  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;

    // Calculate proportional scale
    const scaleX = node.scaleX();

    // We use the same scale for X and Y to maintain proportion
    const newScaleX = scaleX;

    // Calculate adjusted width and height
    const width = node.width() * newScaleX;

    // Calculate new font size based on scale
    // We take the original font size and scale it proportionally
    const originalFontSize = item.fontSize || 24;
    const newFontSize = Math.round(originalFontSize * newScaleX);

    // Set scale to 1 to avoid double scaling when font size changes
    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: 1,
      scaleY: 1,
      width,
      fontSize: newFontSize, // Update font size instead of scale
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

      // Add event listener to slider
      slider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const fontSize = parseInt(target.value, 10);
        onChange({ fontSize });
        label.textContent = `文字サイズ: ${fontSize}px`;

        // If in editing mode, also update the textarea font size
        if (isEditing) {
          const textarea = document.querySelector("textarea");
          if (textarea) {
            textarea.style.fontSize = `${fontSize}px`;
          }
        }
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
        fontSize={item.fontSize}
        fontFamily={item.fontFamily}
        fill={item.fill}
        draggable
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        width={item.width || 250}
        height={item.height}
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
          if (isSelected && !isEditing) {
            handleTextClick();
          }
        }}
        onTap={() => {
          onSelect();
          if (isSelected && !isEditing) {
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
