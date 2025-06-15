import { useState, useRef, useEffect } from 'react'

export type ShapeType = 'rectangle' | 'circle' | 'line'
export type Tool = 'pen' | 'pencil' | 'eraser' | 'highlighter' | ShapeType
export type Point = { x: number, y: number }
export type DrawingObject = { type: 'stroke', data: Stroke } | { type: 'shape', data: Shape }
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
type Options = Omit<Stroke, 'points'> & { backgroundColor?: string }

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

function drawShape(ctx: CanvasRenderingContext2D, { start, end, color, size, tool, type }: Shape) {
    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.beginPath();
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1.0;

    switch (type) {
        case 'rectangle':
            ctx.rect(start.x, start.y, width, height);
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            break;
        case 'line':
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            break;
    }

    ctx.stroke();
}

export function useBoard({
    color,
    size,
    tool,
    backgroundColor = '#ffffff'
}: Options) {
    const ref = useRef<HTMLCanvasElement>(null);

    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [current, setCurrent] = useState<Stroke | Shape | null>(null);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [history, setHistory] = useState<DrawingObject[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const render = () => {
        const canvas = ref?.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw all strokes
        objects.forEach((item) => {
            if (item.data.tool === 'eraser') {
                item.data.color = backgroundColor;
            }

            item.type === 'stroke' ? drawStroke(ctx, item.data)
                : drawShape(ctx, item.data)
        });

        // live drawing
        if (isDrawing && current) {
            const background = tool === 'eraser' ? backgroundColor : color;
            if ('points' in current) {
                drawStroke(ctx, { ...current, color: background });
            } else {
                drawShape(ctx, { ...current, color: background });
            }
        }

        ctx.globalAlpha = 1.0;
    }

    const onTouch = (callback: (e: React.MouseEvent<HTMLCanvasElement>) => void) =>
        (e: React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault();
            const touch = e.touches[0];
            callback({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => { },
                target: ref.current
            } as any)
        }

    const createHistory = (newObjects: DrawingObject[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, newObjects];
        });
        setHistoryIndex(prev => prev + 1);
    }

    const onDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = ref.current;
        if (!isDrawing || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (tool === 'pen' || tool === 'pencil' || tool === 'highlighter' || tool === 'eraser') {
            setCurrent(prev => {
                if (!prev || 'type' in prev) return prev; // Skip if it's a shape
                return {
                    ...prev,
                    points: [...prev.points, { x, y }]
                };
            });
        } else {
            setCurrent(prev => {
                if (!prev || !('type' in prev)) return prev; // Skip if it's a stroke
                return {
                    ...prev,
                    end: { x, y }
                };
            });
        }
    }

    const onStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = ref.current;
        if (!canvas) return

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        if (tool === 'pen' || tool === 'pencil' || tool === 'highlighter' || tool === 'eraser') {
            setCurrent({ color, size, tool, points: [{ x, y }] });
        } else {
            setCurrent({ color, size, tool, type: tool, start: { x, y }, end: { x, y } });
        }
    }

    const onStopDrawing = () => {
        if (!isDrawing || !current) {
            setCurrent(null);
            setIsDrawing(false);
            return
        }

        const newObject: DrawingObject = 'points' in current
            ? { type: 'stroke', data: current }
            : { type: 'shape', data: current };

        const newObjects = [...objects, newObject];

        setObjects(newObjects);
        createHistory(newObjects);
        setCurrent(null);
        setIsDrawing(false);
    }

    const clear = () => {
        if (objects.length === 0) return
        setObjects([]);
        createHistory([]);
    }

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    }

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    }

    const toImage = (type: string = 'png', quality?: number) => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // draw background
        context.fillStyle = backgroundColor;
        context.globalCompositeOperation = 'destination-over';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // create download link
        const a = document.createElement('a');
        a.setAttribute('download', `drawboard.${type}`);
        a.setAttribute('href', canvas.toDataURL(type, quality));
        a.click();

        // restore original canvas state
        context.putImageData(imageData, 0, 0);
        context.globalCompositeOperation = 'source-over';
    }

    useEffect(() => { render(); }, [render]);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            render()
        }

        window.addEventListener('resize', resizeCanvas)
        resizeCanvas()

        return () => window.removeEventListener('resize', resizeCanvas)
    }, [render]);

    return {
        ref,
        isBlank: objects.length === 0,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        onDrawing,
        onStartDrawing,
        onStopDrawing,
        onStartTouch: onTouch(onStartDrawing),
        onMoveTouch: onTouch(onDrawing),
        clear,
        undo,
        redo,
        toImage
    }
}