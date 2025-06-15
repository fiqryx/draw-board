import { useState, useRef, useEffect, useCallback } from 'react'

export type Tool = 'pen' | 'pencil' | 'eraser' | 'highlighter'
export type Point = { x: number, y: number }
export type Stroke = { points: Point[], color: string, size: number, tool: Tool }
type Options = Omit<Stroke, 'points'> & { backgroundColor?: string }

function drawCanvas(ctx: CanvasRenderingContext2D, { points, color, size, tool }: Stroke) {
    if (points.length === 0) return

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (tool === 'pencil') {
        ctx.globalAlpha = 0.7
        ctx.lineWidth = Math.max(1, size * 0.7)
    } else if (tool === 'highlighter') {
        ctx.globalAlpha = 0.3
        ctx.lineWidth = size * 2
    } else {
        ctx.lineWidth = size
        ctx.globalAlpha = 1.0
    }

    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineCap = tool === 'highlighter' ? 'square' : 'round';

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
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

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [history, setHistory] = useState<Stroke[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const render = () => {
        const canvas = ref?.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw all strokes
        strokes.forEach((item) => {
            if (item.tool === 'eraser') {
                item.color = backgroundColor;
            }
            drawCanvas(ctx, item);
        });

        // live drawing
        if (isDrawing && currentStroke.length > 0) {
            drawCanvas(ctx, {
                tool,
                size,
                points: currentStroke,
                color: tool === 'eraser' ? backgroundColor : color,
            })
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

    const createHistory = (newStrokes: Stroke[]) => {
        setHistory(prev => {
            const updates = prev.slice(0, historyIndex + 1);
            return [...updates, newStrokes];
        });
        setHistoryIndex(prev => prev + 1);
    }

    const onDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = ref.current;
        if (!isDrawing || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setCurrentStroke(prev => [...prev, { x, y }])
    }

    const onStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);

        const canvas = ref.current;
        if (!canvas) return

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentStroke([{ x, y }]);
    }

    const onStopDrawing = () => {
        if (!isDrawing || currentStroke.length === 0) {
            setIsDrawing(false)
            setCurrentStroke([])
            return
        }

        const newStroke: Stroke = { color, size, tool, points: currentStroke }
        const newStrokes = [...strokes, newStroke];

        setStrokes(newStrokes);
        createHistory(newStrokes);
        setCurrentStroke([]);
        setIsDrawing(false);
    }

    const clear = () => {
        if (strokes.length === 0) return
        setStrokes([]);
        createHistory([]);
    }

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
        }
    }

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
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
        a.setAttribute('download', `drawboard.png`);
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
        isBlank: strokes.length === 0,
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