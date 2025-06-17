import { useState, useRef, useEffect } from 'react'

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';
export type Tool = 'select' | 'text' | 'pen' | 'pencil' | 'eraser' | 'highlighter' | ShapeType;
export type Point = { x: number, y: number }
export type DrawingObject = { type: 'stroke', data: Stroke } | { type: 'shape', data: Shape } | { type: 'text', data: TextObject }
export interface Stroke {
    points: Point[],
    color: string,
    size: number,
    tool: Tool
}
export interface Shape {
    type: ShapeType
    start: Point
    end: Point
    color: string
    size: number
    tool: Tool
}
export interface TextObject {
    text: string,
    position: Point,
    color: string,
    size: number,
    font: string
}
type Options = Omit<Stroke, 'points'> & { backgroundColor?: string }

// Add resizing handle type
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

function drawStroke(ctx: CanvasRenderingContext2D, { points, color, size, tool }: Stroke) {
    if (points.length === 0) return

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    switch (tool) {
        case 'pencil':
            ctx.globalAlpha = 0.7
            ctx.lineWidth = Math.max(1, size * 0.7)
            break;
        case 'highlighter':
            ctx.globalAlpha = 0.3
            ctx.lineWidth = size * 2
            break;
        default:
            ctx.lineWidth = size
            ctx.globalAlpha = 1.0
            break;
    }

    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineCap = tool === 'highlighter' ? 'square' : 'round';

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, { start, end, color, size, type }: Shape) {
    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.beginPath();
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1.0;

    switch (type) {
        case 'rectangle':
            ctx.roundRect(start.x, start.y, width, height, 20);
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2, true);
            break;
        case 'line':
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            break;
        case 'arrow':
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLength = Math.min(size * 3, 30);
            const headWidth = headLength * 0.6;

            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
                end.x - headLength * Math.cos(angle) + headWidth * Math.cos(angle - Math.PI / 2),
                end.y - headLength * Math.sin(angle) + headWidth * Math.sin(angle - Math.PI / 2)
            );
            ctx.lineTo(
                end.x - headLength * Math.cos(angle) + headWidth * Math.cos(angle + Math.PI / 2),
                end.y - headLength * Math.sin(angle) + headWidth * Math.sin(angle + Math.PI / 2)
            );
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            break;
    }

    ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, { text, position, color, size, font }: TextObject) {
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.fillText(text, position.x, position.y);
}

function getShapeBounds(shape: Shape) {
    if (shape.type === 'circle') {
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

        return {
            x: shape.start.x - radius,
            y: shape.start.y - radius,
            width: radius * 2,
            height: radius * 2
        };
    }

    const minX = Math.min(shape.start.x, shape.end.x);
    const minY = Math.min(shape.start.y, shape.end.y);
    const maxX = Math.max(shape.start.x, shape.end.x);
    const maxY = Math.max(shape.start.y, shape.end.y);

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

function getStrokeBounds(points: Point[]) {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

function getTextBounds(text: TextObject, ctx: CanvasRenderingContext2D) {
    ctx.font = `${text.size}px ${text.font}`;
    const metrics = ctx.measureText(text.text);
    return {
        x: text.position.x,
        y: text.position.y - text.size,
        width: metrics.width,
        height: text.size * 1.2
    };
};

export function useDraw({
    color,
    size,
    tool,
    backgroundColor = '#ffffff'
}: Options) {
    const ref = useRef<HTMLCanvasElement>(null);

    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [current, setCurrent] = useState<Stroke | Shape | TextObject | null>(null);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [history, setHistory] = useState<DrawingObject[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<Point | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const [isEditingText, setIsEditingText] = useState<boolean>(false);
    const [textPosition, setTextPosition] = useState<Point | null>(null);

    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
    const [initialBounds, setInitialBounds] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [initialMousePos, setInitialMousePos] = useState<Point | null>(null);
    const [resizeStartData, setResizeStartData] = useState<DrawingObject | null>(null);

    // Add requestAnimationFrame for smooth rendering
    const animationFrameRef = useRef<number | null>(null);
    const needsRender = useRef<boolean>(false);

    const render = () => {
        const canvas = ref?.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw all objects
        objects.forEach((item, idx) => {
            if (item.type === 'stroke') {
                if (item.data.tool === 'eraser') {
                    item.data.color = backgroundColor;
                }
                drawStroke(ctx, item.data);
            } else if (item.type === 'shape') {
                drawShape(ctx, item.data);
            } else if (item.type === 'text') {
                drawText(ctx, item.data);
            }

            if (tool === 'select' && idx === selectedIndex) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.8;

                let bounds;
                if (item.type === 'stroke') {
                    bounds = getStrokeBounds(item.data.points);
                } else if (item.type === 'shape') {
                    bounds = getShapeBounds(item.data);
                } else if (item.type === 'text') {
                    bounds = getTextBounds(item.data, ctx);
                }

                if (bounds) {
                    // Draw selection rectangle
                    ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);

                    // Draw resize handles
                    const handleSize = 8;
                    ctx.fillStyle = '#3b82f6';
                    ctx.globalAlpha = 1.0;
                    ctx.setLineDash([]);

                    // Top-left
                    ctx.fillRect(bounds.x - 5 - handleSize / 2, bounds.y - 5 - handleSize / 2, handleSize, handleSize);
                    // Top-right
                    ctx.fillRect(bounds.x + bounds.width + 5 - handleSize / 2, bounds.y - 5 - handleSize / 2, handleSize, handleSize);
                    // Bottom-left
                    ctx.fillRect(bounds.x - 5 - handleSize / 2, bounds.y + bounds.height + 5 - handleSize / 2, handleSize, handleSize);
                    // Bottom-right
                    ctx.fillRect(bounds.x + bounds.width + 5 - handleSize / 2, bounds.y + bounds.height + 5 - handleSize / 2, handleSize, handleSize);
                }

                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;
            }
        });

        // live drawing
        if (isDrawing && current) {
            const background = tool === 'eraser' ? backgroundColor : color;
            if ('points' in current) {
                drawStroke(ctx, { ...current, color: background });
            } else if ('type' in current) {
                drawShape(ctx, { ...current, color: background });
            }
        }

        ctx.globalAlpha = 1.0;
    };

    // Optimized rendering with requestAnimationFrame
    const scheduleRender = () => {
        if (!needsRender.current) {
            needsRender.current = true;
            animationFrameRef.current = requestAnimationFrame(() => {
                render();
                needsRender.current = false;
            });
        }
    };

    const getPosition = (x: number, y: number) => {
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            let bounds;

            if (obj.type === 'stroke') {
                bounds = getStrokeBounds(obj.data.points);
            } else if (obj.type === 'shape') {
                bounds = getShapeBounds(obj.data);
            } else if (obj.type === 'text') {
                const ctx = ref.current?.getContext('2d');
                if (!ctx) continue;
                bounds = getTextBounds(obj.data, ctx);
            }

            if (bounds && x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return i;
            }
        }
        return null;
    };

    const getResizeHandle = (x: number, y: number, bounds: { x: number, y: number, width: number, height: number }): ResizeHandle => {
        const handleSize = 8;
        const tolerance = handleSize;

        // Top-left
        const tlX = bounds.x - 5;
        const tlY = bounds.y - 5;
        if (Math.abs(x - tlX) <= tolerance && Math.abs(y - tlY) <= tolerance) {
            return 'top-left';
        }

        // Top-right
        const trX = bounds.x + bounds.width + 5;
        const trY = bounds.y - 5;
        if (Math.abs(x - trX) <= tolerance && Math.abs(y - trY) <= tolerance) {
            return 'top-right';
        }

        // Bottom-left
        const blX = bounds.x - 5;
        const blY = bounds.y + bounds.height + 5;
        if (Math.abs(x - blX) <= tolerance && Math.abs(y - blY) <= tolerance) {
            return 'bottom-left';
        }

        // Bottom-right
        const brX = bounds.x + bounds.width + 5;
        const brY = bounds.y + bounds.height + 5;
        if (Math.abs(x - brX) <= tolerance && Math.abs(y - brY) <= tolerance) {
            return 'bottom-right';
        }

        return null;
    };

    // Helper function to check if click is on resize handle for the currently selected object
    const checkResizeHandleForSelected = (x: number, y: number): ResizeHandle => {
        if (selectedIndex === null) return null;

        const obj = objects[selectedIndex];
        if (!obj) return null;

        let bounds;
        if (obj.type === 'stroke') {
            bounds = getStrokeBounds(obj.data.points);
        } else if (obj.type === 'shape') {
            bounds = getShapeBounds(obj.data);
        } else if (obj.type === 'text') {
            const ctx = ref.current?.getContext('2d');
            if (!ctx) return null;
            bounds = getTextBounds(obj.data, ctx);
        }

        if (bounds) {
            return getResizeHandle(x, y, bounds);
        }

        return null;
    };

    // Optimized resize function with bounds checking
    const performResize = (x: number, y: number) => {
        if (!isResizing || selectedIndex === null || !resizeHandle || !initialBounds || !initialMousePos || !resizeStartData) {
            return;
        }

        const newObjects = [...objects];
        const obj = newObjects[selectedIndex];

        const deltaX = x - initialMousePos.x;
        const deltaY = y - initialMousePos.y;

        if (obj.type === 'stroke' && resizeStartData.type === 'stroke') {
            // Calculate new bounds based on resize handle with minimum size constraints
            let newBounds = { ...initialBounds };
            const minSize = 10;

            if (resizeHandle === 'top-left') {
                newBounds.x = Math.min(initialBounds.x + deltaX, initialBounds.x + initialBounds.width - minSize);
                newBounds.y = Math.min(initialBounds.y + deltaY, initialBounds.y + initialBounds.height - minSize);
                newBounds.width = Math.max(minSize, initialBounds.width - deltaX);
                newBounds.height = Math.max(minSize, initialBounds.height - deltaY);
            } else if (resizeHandle === 'top-right') {
                newBounds.y = Math.min(initialBounds.y + deltaY, initialBounds.y + initialBounds.height - minSize);
                newBounds.width = Math.max(minSize, initialBounds.width + deltaX);
                newBounds.height = Math.max(minSize, initialBounds.height - deltaY);
            } else if (resizeHandle === 'bottom-left') {
                newBounds.x = Math.min(initialBounds.x + deltaX, initialBounds.x + initialBounds.width - minSize);
                newBounds.width = Math.max(minSize, initialBounds.width - deltaX);
                newBounds.height = Math.max(minSize, initialBounds.height + deltaY);
            } else if (resizeHandle === 'bottom-right') {
                newBounds.width = Math.max(minSize, initialBounds.width + deltaX);
                newBounds.height = Math.max(minSize, initialBounds.height + deltaY);
            }

            // Safe division with fallback
            const scaleX = initialBounds.width > 0 ? newBounds.width / initialBounds.width : 1;
            const scaleY = initialBounds.height > 0 ? newBounds.height / initialBounds.height : 1;

            // Use original data for consistent scaling
            const originalPoints = resizeStartData.data.points;
            const newPoints = originalPoints.map(point => {
                const relativeX = initialBounds.width > 0 ? (point.x - initialBounds.x) / initialBounds.width : 0;
                const relativeY = initialBounds.height > 0 ? (point.y - initialBounds.y) / initialBounds.height : 0;

                return {
                    x: newBounds.x + relativeX * newBounds.width,
                    y: newBounds.y + relativeY * newBounds.height
                };
            });

            newObjects[selectedIndex] = {
                ...obj,
                data: {
                    ...obj.data,
                    points: newPoints
                }
            };
        } else if (obj.type === 'shape' && resizeStartData.type === 'shape') {
            // Use original shape data for consistent resizing
            const originalShape = resizeStartData.data;
            let newStart = { ...originalShape.start };
            let newEnd = { ...originalShape.end };

            if (resizeHandle === 'top-left') {
                newStart = { x: originalShape.start.x + deltaX, y: originalShape.start.y + deltaY };
            } else if (resizeHandle === 'top-right') {
                newStart = { ...originalShape.start, y: originalShape.start.y + deltaY };
                newEnd = { ...originalShape.end, x: originalShape.end.x + deltaX };
            } else if (resizeHandle === 'bottom-left') {
                newStart = { ...originalShape.start, x: originalShape.start.x + deltaX };
                newEnd = { ...originalShape.end, y: originalShape.end.y + deltaY };
            } else if (resizeHandle === 'bottom-right') {
                newEnd = { x: originalShape.end.x + deltaX, y: originalShape.end.y + deltaY };
            }

            newObjects[selectedIndex] = {
                ...obj,
                data: {
                    ...obj.data,
                    start: newStart,
                    end: newEnd
                }
            };
        } else if (obj.type === 'text' && resizeStartData.type === 'text') {
            // For text, resize by changing font size based on horizontal drag
            const originalSize = resizeStartData.data.size;
            const scale = Math.max(0.5, Math.min(3, 1 + deltaX / 100)); // Limit scale range
            const newSize = Math.max(8, Math.min(100, originalSize * scale));

            newObjects[selectedIndex] = {
                ...obj,
                data: {
                    ...obj.data,
                    size: newSize
                }
            };
        }

        setObjects(newObjects);
    };

    const onTouch = (callback: (e: React.MouseEvent<HTMLCanvasElement>) => void) =>
        (e: React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault();
            const touch = e.touches[0];
            callback({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => { },
                target: ref.current
            } as any);
        };

    const createHistory = (newObjects: DrawingObject[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, newObjects];
        });
        setHistoryIndex(prev => prev + 1);
    };

    const onDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = ref.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Handle resizing with optimized function
        if (isResizing) {
            performResize(x, y);
            scheduleRender();
            return;
        }

        if (isDragging && selectedIndex !== null && dragOffset) {
            const newObjects = [...objects];
            const obj = newObjects[selectedIndex];

            if (obj.type === 'stroke') {
                const offsetX = x - dragOffset.x;
                const offsetY = y - dragOffset.y;

                const firstPoint = obj.data.points[0];
                const deltaX = offsetX - firstPoint.x;
                const deltaY = offsetY - firstPoint.y;

                const newPoints = obj.data.points.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));

                newObjects[selectedIndex] = {
                    ...obj,
                    data: {
                        ...obj.data,
                        points: newPoints
                    }
                };
            } else if (obj.type === 'shape') {
                const offsetX = x - dragOffset.x - obj.data.start.x;
                const offsetY = y - dragOffset.y - obj.data.start.y;

                newObjects[selectedIndex] = {
                    ...obj,
                    data: {
                        ...obj.data,
                        start: {
                            x: obj.data.start.x + offsetX,
                            y: obj.data.start.y + offsetY
                        },
                        end: {
                            x: obj.data.end.x + offsetX,
                            y: obj.data.end.y + offsetY
                        }
                    }
                };
            } else if (obj.type === 'text') {
                newObjects[selectedIndex] = {
                    ...obj,
                    data: {
                        ...obj.data,
                        position: {
                            x: x - dragOffset.x,
                            y: y - dragOffset.y
                        }
                    }
                };
            }

            setObjects(newObjects);
            scheduleRender();
            return;
        }

        if (!isDrawing) return;

        if (['pen', 'pencil', 'eraser', 'highlighter'].includes(tool)) {
            setCurrent(prev => {
                if (!prev || 'type' in prev) return prev;
                return {
                    ...prev,
                    points: [...(prev as Stroke).points, { x, y }]
                };
            });
        } else if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
            setCurrent(prev => {
                if (!prev || !('type' in prev)) return prev;
                return {
                    ...prev,
                    end: { x, y }
                };
            });
        }
        scheduleRender();
    };

    const onStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = ref.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'select') {
            // First check if we're clicking on a resize handle for the currently selected object
            const handle = checkResizeHandleForSelected(x, y);
            if (handle && selectedIndex !== null) {
                // We clicked on a resize handle, don't change selection
                const obj = objects[selectedIndex];
                let bounds;

                if (obj.type === 'stroke') {
                    bounds = getStrokeBounds(obj.data.points);
                } else if (obj.type === 'shape') {
                    bounds = getShapeBounds(obj.data);
                } else if (obj.type === 'text') {
                    const ctx = ref.current?.getContext('2d');
                    if (!ctx) return;
                    bounds = getTextBounds(obj.data, ctx);
                }

                if (bounds) {
                    setIsResizing(true);
                    setResizeHandle(handle);
                    setInitialBounds(bounds);
                    setInitialMousePos({ x, y });
                    setResizeStartData(JSON.parse(JSON.stringify(obj))); // Deep copy for original data
                }
                return;
            }

            // If not on a resize handle, check for object selection
            const index = getPosition(x, y);
            setSelectedIndex(index);

            if (index !== null) {
                const obj = objects[index];
                let objPosition = { x: 0, y: 0 };

                if (obj.type === 'stroke') {
                    const firstPoint = obj.data.points[0];
                    objPosition = { x: firstPoint.x, y: firstPoint.y };
                } else if (obj.type === 'shape') {
                    objPosition = { x: obj.data.start.x, y: obj.data.start.y };
                } else if (obj.type === 'text') {
                    objPosition = { x: obj.data.position.x, y: obj.data.position.y };
                }

                setDragOffset({
                    x: x - objPosition.x,
                    y: y - objPosition.y
                });
                setIsDragging(true);
            }
            return;
        }

        if (tool === 'text') {
            setTextPosition({ x, y });
            setIsEditingText(true);
            return;
        }

        setIsDrawing(true);

        if (['pen', 'pencil', 'eraser', 'highlighter'].includes(tool)) {
            setCurrent({ color, size, tool, points: [{ x, y }] });
        } else if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
            setCurrent({ color, size, tool, type: tool as ShapeType, start: { x, y }, end: { x, y } });
        }
    };

    const addText = (text: string, font: string = 'Arial') => {
        if (!textPosition || !text.trim()) {
            setIsEditingText(false);
            setTextPosition(null);
            return;
        }

        const newText: TextObject = {
            text,
            position: textPosition,
            color,
            size: size * 3,
            font
        };

        const newObject: DrawingObject = { type: 'text', data: newText };
        const newObjects = [...objects, newObject];

        setObjects(newObjects);
        createHistory(newObjects);
        setIsEditingText(false);
        setTextPosition(null);
    };

    const onStopDrawing = () => {
        if (isResizing) {
            // Create history when resize is complete
            createHistory([...objects]);
            setIsResizing(false);
            setResizeHandle(null);
            setInitialBounds(null);
            setInitialMousePos(null);
            setResizeStartData(null);
            return;
        }

        if (isDragging) {
            // Create history when drag is complete
            createHistory([...objects]);
            setIsDragging(false);
            setDragOffset(null);
            return;
        }

        if (!isDrawing || !current) {
            setCurrent(null);
            setIsDrawing(false);
            return;
        }

        const newObject: DrawingObject = 'points' in current
            ? { type: 'stroke', data: current }
            : 'type' in current
                ? { type: 'shape', data: current }
                : { type: 'text', data: current };

        const newObjects = [...objects, newObject];

        setObjects(newObjects);
        createHistory(newObjects);
        setCurrent(null);
        setIsDrawing(false);
    };

    const clear = () => {
        if (objects.length === 0) return;
        setObjects([]);
        createHistory([]);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    };

    const toImage = (type: string = 'png', quality?: number) => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        context.fillStyle = backgroundColor;
        context.globalCompositeOperation = 'destination-over';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const a = document.createElement('a');
        a.setAttribute('download', `drawboard.${type}`);
        a.setAttribute('href', canvas.toDataURL(type, quality));
        a.click();

        context.putImageData(imageData, 0, 0);
        context.globalCompositeOperation = 'source-over';
    };

    useEffect(() => {
        scheduleRender();
    }, [objects, current, selectedIndex]);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;

        // Add cursor styling based on hover state
        const handleMouseMove = (e: MouseEvent) => {
            if (tool !== 'select' || selectedIndex === null) {
                canvas.style.cursor = 'default';
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const obj = objects[selectedIndex];
            if (!obj) return;

            let bounds;
            if (obj.type === 'stroke') {
                bounds = getStrokeBounds(obj.data.points);
            } else if (obj.type === 'shape') {
                bounds = getShapeBounds(obj.data);
            } else if (obj.type === 'text') {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                bounds = getTextBounds(obj.data, ctx);
            }

            if (bounds) {
                const handle = getResizeHandle(x, y, bounds);
                if (handle) {
                    switch (handle) {
                        case 'top-left':
                        case 'bottom-right':
                            canvas.style.cursor = 'nw-resize';
                            break;
                        case 'top-right':
                        case 'bottom-left':
                            canvas.style.cursor = 'ne-resize';
                            break;
                    }
                } else if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    canvas.style.cursor = 'move';
                } else {
                    canvas.style.cursor = 'default';
                }
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [tool, selectedIndex, objects]);

    return {
        ref,
        isBlank: objects.length === 0,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        isEditingText,
        textPosition,
        addText,
        onDrawing,
        onStartDrawing,
        onStopDrawing,
        onStartTouch: onTouch(onStartDrawing),
        onMoveTouch: onTouch(onDrawing),
        clear,
        undo,
        redo,
        toImage
    };
}