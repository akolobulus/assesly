
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import type { FieldDefinition } from './types';

interface FieldItemProps {
  field: FieldDefinition;
  onAddField: (field: FieldDefinition) => void; // Renamed from onClick for clarity
}

export function FieldItem({ field, onAddField }: FieldItemProps) {
  const IconComponent = field.icon;

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('application/json', JSON.stringify(field));
    // You can also set a drag image if desired:
    // event.dataTransfer.setDragImage(event.currentTarget, 0, 0);
  };

  return (
    <Button
      variant="outline"
      className="w-full h-auto flex flex-col items-center justify-center p-3 space-y-1.5 bg-card hover:bg-muted/50 border rounded-md shadow-sm cursor-grab"
      onClick={() => onAddField(field)}
      draggable="true"
      onDragStart={handleDragStart}
      title={`Drag or click to add ${field.name}`}
    >
      <IconComponent className="h-5 w-5 text-muted-foreground" />
      <span className="text-xs text-center text-muted-foreground">{field.name}</span>
    </Button>
  );
}
