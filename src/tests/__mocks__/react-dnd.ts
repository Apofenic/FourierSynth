/**
 * Mock for react-dnd
 */

import React from 'react';

export const useDrag = () => [
  { isDragging: false },
  (ref: any) => ref,
  () => {},
];

export const useDrop = () => [
  { isOver: false, canDrop: true },
  (ref: any) => ref,
];

export function DndProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

