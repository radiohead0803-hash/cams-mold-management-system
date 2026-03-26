import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for resizable table columns with localStorage persistence.
 * @param {string} storageKey - localStorage key for saving column widths
 * @param {Object} defaultWidths - { columnKey: defaultWidthPx, ... }
 * @param {number} minWidth - minimum column width in px (default 60)
 * @returns {{ columnWidths, handleMouseDown, resetWidths }}
 */
const useResizableColumns = (storageKey, defaultWidths, minWidth = 60) => {
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults so new columns get default widths
        return { ...defaultWidths, ...parsed };
      }
    } catch {
      // ignore
    }
    return { ...defaultWidths };
  });

  const dragState = useRef(null);

  // Persist to localStorage whenever widths change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnWidths));
    } catch {
      // ignore
    }
  }, [storageKey, columnWidths]);

  const handleMouseDown = useCallback((columnKey, e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent sort click
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || defaultWidths[columnKey] || 100;

    dragState.current = { columnKey, startX, startWidth };

    const onMouseMove = (moveEvent) => {
      if (!dragState.current) return;
      const diff = moveEvent.clientX - dragState.current.startX;
      const newWidth = Math.max(minWidth, dragState.current.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [dragState.current.columnKey]: newWidth }));
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [columnWidths, defaultWidths, minWidth]);

  const resetWidths = useCallback(() => {
    setColumnWidths({ ...defaultWidths });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [defaultWidths, storageKey]);

  return { columnWidths, handleMouseDown, resetWidths };
};

export default useResizableColumns;
