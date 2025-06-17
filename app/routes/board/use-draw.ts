import { useState, useRef, useEffect } from 'react';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';
export type Tool = 'select' | 'text' | 'pen' | 'pencil' | 'eraser' | 'highlighter' | 'hand' | ShapeType;
export type Point = { x: number; y: number };
export type DrawingObject =
    | { type: 'stroke'; data: Stroke }
    | { type: 'shape'; data: Shape }
    | { type: 'text'; data: TextObject };
export interface Stroke {
    points: Point[];
    color: string;
    size: number;
    tool: Tool;
}
export interface Shape {
    type: ShapeType;
    start: Point;
    end: Point;
    color: string;
    size: number;
    tool: Tool;
}
export interface TextObject {
    text: string;
    position: Point;
    color: string;
    size: number;
    font: string;
}
type Options = Omit<Stroke, 'points'> & { backgroundColor?: string };
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
interface SelectionBox {
    start: Point;
    end: Point;
}

function drawStroke(ctx: CanvasRenderingContext2D, { points, color, size, tool }: Stroke) {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    switch (tool) {
        case 'pencil':
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = Math.max(1, size * 0.7);
            break;
        case 'highlighter':
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = size * 2;
            break;
        default:
            ctx.lineWidth = size;
            ctx.globalAlpha = 1.0;
            break;
    }

    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineCap = tool === 'highlighter' ? 'square' : 'round';

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
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

function getCursor(tool: Tool) {
    switch (tool) {
        case 'eraser':
            return 'grab'
        case 'text':
            return 'text'
        case 'select':
            return 'default'
        case 'hand':
            return 'grab'
        default:
            return 'crosshair'
    }
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
}

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
}

function getTextBounds(text: TextObject, ctx: CanvasRenderingContext2D) {
    ctx.font = `${text.size}px ${text.font}`;
    const metrics = ctx.measureText(text.text);
    return {
        x: text.position.x,
        y: text.position.y - text.size,
        width: metrics.width,
        height: text.size * 1.2
    };
}

function isPointInBounds(point: Point, bounds: { x: number; y: number; width: number; height: number }) {
    return (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
    );
}

function isBoundsInSelection(
    bounds: { x: number; y: number; width: number; height: number },
    selection: SelectionBox
) {
    const minX = Math.min(selection.start.x, selection.end.x);
    const maxX = Math.max(selection.start.x, selection.end.x);
    const minY = Math.min(selection.start.y, selection.end.y);
    const maxY = Math.max(selection.start.y, selection.end.y);

    return (
        bounds.x + bounds.width >= minX &&
        bounds.x <= maxX &&
        bounds.y + bounds.height >= minY &&
        bounds.y <= maxY
    );
}

// Utility to get bounding box for multiple objects
function getGroupBounds(objects: DrawingObject[], indices: number[], ctx: CanvasRenderingContext2D): { x: number; y: number; width: number; height: number } | null {
    if (indices.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const idx of indices) {
        const obj = objects[idx];
        let bounds;
        if (obj.type === 'stroke') bounds = getStrokeBounds(obj.data.points);
        else if (obj.type === 'shape') bounds = getShapeBounds(obj.data);
        else if (obj.type === 'text') bounds = ctx ? getTextBounds(obj.data, ctx) : null;
        if (!bounds) continue;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    if (minX === Infinity) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Helper: scale a point relative to an anchor
function scalePoint(point: Point, anchor: Point, scaleX: number, scaleY: number): Point {
    return {
        x: anchor.x + (point.x - anchor.x) * scaleX,
        y: anchor.y + (point.y - anchor.y) * scaleY
    };
}

// Helper: resize a single DrawingObject
function resizeObject(
    originalObj: DrawingObject,
    newBounds: { x: number; y: number; width: number; height: number },
    initialBounds: { x: number; y: number; width: number; height: number },
    scaleX: number,
    scaleY: number,
    anchor: Point
): DrawingObject {
    if (originalObj.type === 'stroke') {
        const newPoints = originalObj.data.points.map(point => scalePoint(point, anchor, scaleX, scaleY));
        return { ...originalObj, data: { ...originalObj.data, points: newPoints } };
    } else if (originalObj.type === 'shape') {
        return {
            ...originalObj,
            data: {
                ...originalObj.data,
                start: scalePoint(originalObj.data.start, anchor, scaleX, scaleY),
                end: scalePoint(originalObj.data.end, anchor, scaleX, scaleY)
            }
        };
    } else if (originalObj.type === 'text') {
        const avgScale = (scaleX + scaleY) / 2;
        return {
            ...originalObj,
            data: {
                ...originalObj.data,
                position: scalePoint(originalObj.data.position, anchor, scaleX, scaleY),
                size: Math.max(8, Math.min(200, originalObj.data.size * avgScale))
            }
        };
    }
    return originalObj;
}

export function useDraw({
    color,
    size,
    tool,
    backgroundColor = '#ffffff'
}: Options) {
    const ref = useRef<HTMLCanvasElement>(null);

    const needsRender = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [current, setCurrent] = useState<Stroke | Shape | TextObject | SelectionBox | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<DrawingObject[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<Point | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isEditingText, setIsEditingText] = useState(false);
    const [textPosition, setTextPosition] = useState<Point | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
    const [initialBounds, setInitialBounds] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const [initialMousePos, setInitialMousePos] = useState<Point | null>(null);
    const [resizeStartData, setResizeStartData] = useState<DrawingObject[]>([]);

    const [canvasOffset, setCanvasOffset] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point | null>(null);

    const render = () => {
        const canvas = ref?.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvasOffset.x, canvasOffset.y);
        ctx.scale(zoom, zoom);

        // Draw all objects
        objects.forEach((item) => {
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
        });

        // Draw selection for selected objects
        if (tool === 'select' && selectedIndices.length > 0) {
            // Draw group bounding box and handles
            const groupBounds = getGroupBounds(objects, selectedIndices, ctx);
            if (groupBounds) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.8;
                ctx.strokeRect(groupBounds.x - 5, groupBounds.y - 5, groupBounds.width + 10, groupBounds.height + 10);
                // Draw resize handles for group
                const handleSize = 8;
                ctx.fillStyle = '#3b82f6';
                ctx.globalAlpha = 1.0;
                ctx.setLineDash([]);
                // Top-left
                ctx.fillRect(groupBounds.x - 5 - handleSize / 2, groupBounds.y - 5 - handleSize / 2, handleSize, handleSize);
                // Top-right
                ctx.fillRect(groupBounds.x + groupBounds.width + 5 - handleSize / 2, groupBounds.y - 5 - handleSize / 2, handleSize, handleSize);
                // Bottom-left
                ctx.fillRect(groupBounds.x - 5 - handleSize / 2, groupBounds.y + groupBounds.height + 5 - handleSize / 2, handleSize, handleSize);
                // Bottom-right
                ctx.fillRect(groupBounds.x + groupBounds.width + 5 - handleSize / 2, groupBounds.y + groupBounds.height + 5 - handleSize / 2, handleSize, handleSize);
                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;
            }
        }

        // Draw selection box if we're selecting multiple items
        if (tool === 'select' && isDrawing && current && 'start' in current && 'end' in current) {
            const { start, end } = current as SelectionBox;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            // Draw semi-transparent fill
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fillRect(x, y, width, height);

            // Draw border
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.strokeRect(x, y, width, height);

            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        }

        // Live drawing
        if (isDrawing && current && (('points' in current) || ('type' in current))) {
            const background = tool === 'eraser' ? backgroundColor : color;
            if ('points' in current) {
                drawStroke(ctx, { ...current, color: background });
            } else if ('type' in current) {
                drawShape(ctx, { ...current, color: background });
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    };

    const scheduleRender = () => {
        if (!needsRender.current) {
            needsRender.current = true;
            animationFrameRef.current = requestAnimationFrame(() => {
                render();
                needsRender.current = false;
            });
        }
    };

    const screenToCanvas = (screenX: number, screenY: number) => {
        return {
            x: (screenX - canvasOffset.x) / zoom,
            y: (screenY - canvasOffset.y) / zoom
        };
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

            if (bounds && isPointInBounds({ x, y }, bounds)) {
                return i;
            }
        }
        return null;
    };

    const getObjectsInSelection = (selection: SelectionBox) => {
        const selected: number[] = [];
        objects.forEach((obj, idx) => {
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

            if (bounds && isBoundsInSelection(bounds, selection)) {
                selected.push(idx);
            }
        });
        return selected;
    };

    const getResizeHandle = (
        x: number,
        y: number,
        bounds: { x: number; y: number; width: number; height: number }
    ): ResizeHandle => {
        const handleSize = 8;
        const tolerance = handleSize;
        // Top-left
        const tlX = bounds.x - 5;
        const tlY = bounds.y - 5;
        if (Math.abs(x - tlX) <= tolerance && Math.abs(y - tlY) <= tolerance) return 'top-left';
        // Top-right
        const trX = bounds.x + bounds.width + 5;
        const trY = bounds.y - 5;
        if (Math.abs(x - trX) <= tolerance && Math.abs(y - trY) <= tolerance) return 'top-right';
        // Bottom-left
        const blX = bounds.x - 5;
        const blY = bounds.y + bounds.height + 5;
        if (Math.abs(x - blX) <= tolerance && Math.abs(y - blY) <= tolerance) return 'bottom-left';
        // Bottom-right
        const brX = bounds.x + bounds.width + 5;
        const brY = bounds.y + bounds.height + 5;
        if (Math.abs(x - brX) <= tolerance && Math.abs(y - brY) <= tolerance) return 'bottom-right';
        return null;
    };

    const performResize = (x: number, y: number) => {
        if (!isResizing || selectedIndices.length === 0 || !resizeHandle || !initialBounds || !initialMousePos) {
            return;
        }
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Group resize ---
        if (selectedIndices.length > 1) {
            // Determine anchor (opposite corner of the handle)
            let anchor = { x: initialBounds.x, y: initialBounds.y };
            if (resizeHandle === 'top-left') {
                anchor = { x: initialBounds.x + initialBounds.width, y: initialBounds.y + initialBounds.height };
            } else if (resizeHandle === 'top-right') {
                anchor = { x: initialBounds.x, y: initialBounds.y + initialBounds.height };
            } else if (resizeHandle === 'bottom-left') {
                anchor = { x: initialBounds.x + initialBounds.width, y: initialBounds.y };
            } // else bottom-right: anchor is top-left

            // Calculate new bounds
            let mouseCorner = { x, y };
            let newX = Math.min(anchor.x, mouseCorner.x);
            let newY = Math.min(anchor.y, mouseCorner.y);
            let newWidth = Math.max(10, Math.abs(mouseCorner.x - anchor.x));
            let newHeight = Math.max(10, Math.abs(mouseCorner.y - anchor.y));
            let scaleX = newWidth / initialBounds.width;
            let scaleY = newHeight / initialBounds.height;
            scaleX = Math.max(0.2, Math.min(5, scaleX));
            scaleY = Math.max(0.2, Math.min(5, scaleY));
            const newBounds = { x: newX, y: newY, width: newWidth, height: newHeight };

            // Resize all selected objects
            const updatedObjects = [...objects];
            selectedIndices.forEach((idx, i) => {
                const originalObj = resizeStartData[i];
                if (!originalObj) return;
                updatedObjects[idx] = resizeObject(originalObj, newBounds, initialBounds, scaleX, scaleY, anchor);
            });
            setObjects(updatedObjects);
            return;
        }
        // --- Single select resize ---
        if (selectedIndices.length === 1 && resizeStartData.length === 1) {
            const obj = objects[selectedIndices[0]];
            const originalObj = resizeStartData[0];
            const deltaX = x - initialMousePos.x;
            const deltaY = y - initialMousePos.y;
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
            // Clamp scale
            const scaleX = initialBounds.width > 0 ? Math.max(0.2, Math.min(5, newBounds.width / initialBounds.width)) : 1;
            const scaleY = initialBounds.height > 0 ? Math.max(0.2, Math.min(5, newBounds.height / initialBounds.height)) : 1;
            // For single select, anchor is the corner opposite the handle
            let anchor = { x: initialBounds.x, y: initialBounds.y };
            if (resizeHandle === 'top-left') {
                anchor = { x: initialBounds.x + initialBounds.width, y: initialBounds.y + initialBounds.height };
            } else if (resizeHandle === 'top-right') {
                anchor = { x: initialBounds.x, y: initialBounds.y + initialBounds.height };
            } else if (resizeHandle === 'bottom-left') {
                anchor = { x: initialBounds.x + initialBounds.width, y: initialBounds.y };
            } // else bottom-right: anchor is top-left
            const updatedObjects = [...objects];
            updatedObjects[selectedIndices[0]] = resizeObject(originalObj, newBounds, initialBounds, scaleX, scaleY, anchor);
            setObjects(updatedObjects);
            return;
        }
    };

    const moveSelectedObjects = (offsetX: number, offsetY: number) => {
        const newObjects = [...objects];

        selectedIndices.forEach(index => {
            const obj = newObjects[index];
            if (!obj) return;

            if (obj.type === 'stroke') {
                const newPoints = obj.data.points.map(point => ({
                    x: point.x + offsetX,
                    y: point.y + offsetY
                }));
                newObjects[index] = {
                    ...obj,
                    data: {
                        ...obj.data,
                        points: newPoints
                    }
                };
            } else if (obj.type === 'shape') {
                newObjects[index] = {
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
                newObjects[index] = {
                    ...obj,
                    data: {
                        ...obj.data,
                        position: {
                            x: obj.data.position.x + offsetX,
                            y: obj.data.position.y + offsetY
                        }
                    }
                };
            }
        });

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
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (isPanning && panStart && tool === 'hand') {
            const deltaX = screenX - panStart.x;
            const deltaY = screenY - panStart.y;
            setCanvasOffset(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));
            setPanStart({ x: screenX, y: screenY });
            scheduleRender();
            return;
        }

        const { x, y } = screenToCanvas(screenX, screenY);

        if (isResizing) {
            performResize(x, y);
            scheduleRender();
            return;
        }

        if (isDragging && selectedIndices.length > 0 && dragOffset) {
            const firstObj = objects[selectedIndices[0]];
            let objPosition = { x: 0, y: 0 };

            if (firstObj.type === 'stroke') {
                const firstPoint = firstObj.data.points[0];
                objPosition = { x: firstPoint.x, y: firstPoint.y };
            } else if (firstObj.type === 'shape') {
                objPosition = { x: firstObj.data.start.x, y: firstObj.data.start.y };
            } else if (firstObj.type === 'text') {
                objPosition = { x: firstObj.data.position.x, y: firstObj.data.position.y };
            }

            const offsetX = x - objPosition.x - dragOffset.x;
            const offsetY = y - objPosition.y - dragOffset.y;

            moveSelectedObjects(offsetX, offsetY);
            scheduleRender();
            return;
        }

        if (!isDrawing) return;

        if (tool === 'select' && current && 'start' in current && 'end' in current) {
            setCurrent({
                start: (current as SelectionBox).start,
                end: { x, y }
            });
        } else if (['pen', 'pencil', 'eraser', 'highlighter'].includes(tool)) {
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
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (tool === 'hand') {
            setIsPanning(true);
            setPanStart({ x: screenX, y: screenY });
            canvas.style.cursor = 'grabbing';
            return;
        }

        const { x, y } = screenToCanvas(screenX, screenY);

        if (tool === 'select') {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (selectedIndices.length > 0) {
                const groupBounds = getGroupBounds(objects, selectedIndices, ctx);
                if (groupBounds && groupBounds.width > 0 && groupBounds.height > 0) {
                    const handle = getResizeHandle(x, y, groupBounds);
                    if (handle) {
                        setIsResizing(true);
                        setResizeHandle(handle);
                        setInitialBounds(groupBounds);
                        setInitialMousePos({ x, y });
                        // Store a deep copy of all selected objects for group resize
                        setResizeStartData(selectedIndices.map(idx => JSON.parse(JSON.stringify(objects[idx]))));
                        return;
                    }
                }
            }
            // Single selection: use per-object bounds
            if (ctx && selectedIndices.length === 1) {
                const obj = objects[selectedIndices[0]];
                let bounds;
                if (obj.type === 'stroke') bounds = getStrokeBounds(obj.data.points);
                else if (obj.type === 'shape') bounds = getShapeBounds(obj.data);
                else if (obj.type === 'text') bounds = getTextBounds(obj.data, ctx);
                if (bounds && bounds.width > 0 && bounds.height > 0) {
                    const handle = getResizeHandle(x, y, bounds);
                    if (handle) {
                        setIsResizing(true);
                        setResizeHandle(handle);
                        setInitialBounds(bounds);
                        setInitialMousePos({ x, y });
                        setResizeStartData(JSON.parse(JSON.stringify(obj)));
                        return;
                    }
                }
            }
            // Multiple selection: use group bounds
            if (ctx && selectedIndices.length > 1) {
                const groupBounds = getGroupBounds(objects, selectedIndices, ctx);
                if (groupBounds && groupBounds.width > 0 && groupBounds.height > 0) {
                    const handle = getResizeHandle(x, y, groupBounds);
                    if (handle) {
                        setIsResizing(true);
                        setResizeHandle(handle);
                        setInitialBounds(groupBounds);
                        setInitialMousePos({ x, y });
                        setResizeStartData([]);
                        return;
                    }
                }
            }

            const clickedIndex = getPosition(x, y);
            const isClickOnSelected = clickedIndex !== null && selectedIndices.includes(clickedIndex);

            if (e.shiftKey && clickedIndex !== null) {
                if (isClickOnSelected) {
                    setSelectedIndices(prev => prev.filter(i => i !== clickedIndex));
                } else {
                    setSelectedIndices(prev => [...prev, clickedIndex]);
                }

                if (selectedIndices.length > 0) {
                    const obj = objects[selectedIndices[0]];
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

            if (clickedIndex === null) {
                setCurrent({ start: { x, y }, end: { x, y } });
                setSelectedIndices([]);
                setIsDrawing(true);
                return;
            }

            if (!isClickOnSelected) {
                setSelectedIndices([clickedIndex]);
            }

            const obj = objects[clickedIndex];
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
        setSelectedIndices([newObjects.length - 1]);
    };

    const onStopDrawing = () => {
        if (isPanning) {
            setIsPanning(false);
            setPanStart(null);
            const canvas = ref.current;
            if (canvas) {
                canvas.style.cursor = getCursor(tool);
            }
            return;
        }

        if (isResizing) {
            createHistory([...objects]);
            setIsResizing(false);
            setResizeHandle(null);
            setInitialBounds(null);
            setInitialMousePos(null);
            setResizeStartData([]);
            return;
        }

        if (isDragging) {
            createHistory([...objects]);
            setIsDragging(false);
            setDragOffset(null);
            return;
        }

        if (tool === 'select' && current && 'start' in current && 'end' in current) {
            const selection = current as SelectionBox;
            const selected = getObjectsInSelection(selection);
            if (selected.length > 0) {
                setSelectedIndices(selected);
            }
            setCurrent(null);
            setIsDrawing(false);
            return;
        }

        if (!isDrawing || !current) {
            setCurrent(null);
            setIsDrawing(false);
            return;
        }

        if (('points' in current) || ('type' in current)) {
            const newObject: DrawingObject = 'points' in current
                ? { type: 'stroke', data: current }
                : { type: 'shape', data: current };

            const newObjects = [...objects, newObject];

            setObjects(newObjects);
            createHistory(newObjects);
            setSelectedIndices([newObjects.length - 1]);
            setCurrent(null);
            setIsDrawing(false);
        }
    };

    const zoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 5));
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.2));
    };

    const resetZoom = () => {
        setZoom(1);
        setCanvasOffset({ x: 0, y: 0 });
    };

    const clear = () => {
        if (objects.length === 0) return;
        setObjects([]);
        setSelectedIndices([]);
        createHistory([]);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
            setSelectedIndices([]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
            setSelectedIndices([]);
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

    const deleteSelected = () => {
        if (selectedIndices.length === 0) return;
        const newObjects = objects.filter((_, idx) => !selectedIndices.includes(idx));
        setObjects(newObjects);
        setSelectedIndices([]);
        createHistory(newObjects);
    };

    useEffect(() => {
        scheduleRender();
    }, [objects, current, selectedIndices, canvasOffset]);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (tool !== 'select' || selectedIndices.length === 0) {
                canvas.style.cursor = getCursor(tool);
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const groupBounds = getGroupBounds(objects, selectedIndices, ctx);
            if (!groupBounds) {
                canvas.style.cursor = getCursor(tool);
                return;
            }
            const handle = getResizeHandle(x, y, groupBounds);
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
            } else if (
                x >= groupBounds.x &&
                x <= groupBounds.x + groupBounds.width &&
                y >= groupBounds.y &&
                y <= groupBounds.y + groupBounds.height
            ) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = getCursor(tool);
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
    }, [tool, selectedIndices, zoom, objects]);

    // Alternative approach using refs to capture current state
    const zoomRef = useRef(zoom);
    const offsetRef = useRef(canvasOffset);

    useEffect(() => {
        zoomRef.current = zoom;
        offsetRef.current = canvasOffset;
    });

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const zoomChange = e.deltaY > 0 ? -0.1 : 0.1; // 10% decrease or increase

                const currentZoom = zoomRef.current;
                const currentOffset = offsetRef.current;
                const newZoom = Math.max(0.2, Math.min(5, currentZoom + zoomChange));

                // Calculate the point in world space that the mouse is pointing to
                const worldPointX = (mouseX - currentOffset.x) / currentZoom;
                const worldPointY = (mouseY - currentOffset.y) / currentZoom;

                // Calculate new offset so that the world point stays under the mouse
                const newOffset = {
                    x: mouseX - worldPointX * newZoom,
                    y: mouseY - worldPointY * newZoom
                };

                setZoom(newZoom);
                setCanvasOffset(newOffset);
            } else if (e.shiftKey) {
                // Horizontal scrolling with Shift+wheel
                e.preventDefault();
                const currentOffset = offsetRef.current;
                const scrollSpeed = 50;

                const newOffset = {
                    x: currentOffset.x - e.deltaY * scrollSpeed / 100,
                    y: currentOffset.y
                };

                setCanvasOffset(newOffset);
            } else {
                // Pan behavior for vertical scrolling
                e.preventDefault();
                const currentOffset = offsetRef.current;
                const scrollSpeed = 50; // Adjust this value to control scroll sensitivity

                const newOffset = {
                    x: currentOffset.x,
                    y: currentOffset.y - e.deltaY * scrollSpeed / 100 // Invert deltaY for natural scrolling
                };

                setCanvasOffset(newOffset);
            }
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, []);

    return {
        ref,
        isBlank: objects.length === 0,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        isEditingText,
        textPosition,
        selected: selectedIndices,
        addText,
        onDrawing,
        onStartDrawing,
        onStopDrawing,
        onStartTouch: onTouch(onStartDrawing),
        onMoveTouch: onTouch(onDrawing),
        clear,
        undo,
        redo,
        toImage,
        deleteSelected,
        selectAll: () => setSelectedIndices(objects.map((_, idx) => idx)),
        zoom,
        zoomIn,
        zoomOut,
        resetZoom
    };
}