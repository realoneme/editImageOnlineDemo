"use client";

import { useRef, useEffect } from "react";
import { Image, Transformer } from "react-konva";
import useImage from "use-image";
import { StoryItem } from "@/types/story";

interface ImageElementProps {
  item: StoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<StoryItem>) => void;
  onTransformEnd: (newAttrs: Partial<StoryItem>) => void;
}

const ImageElement = ({ item, isSelected, onSelect, onChange, onTransformEnd }: ImageElementProps) => {
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image] = useImage(item.content);

  // Handle transformer updates
  useEffect(() => {
    if (isSelected && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle transform end
  const handleTransformEnd = () => {
    const node = imageRef.current;
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
      <Image
        ref={imageRef}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        offsetX={item.width ? item.width / 2 : 0}
        offsetY={item.height ? item.height / 2 : 0}
        draggable
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        alt={item.content.split('/').pop() || 'Story image'}
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
        perfectDrawEnabled={false}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit size to prevent scaling to zero
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
        />
      )}
    </>
  );
};

export default ImageElement;
