import { cn } from '~/lib/utils'
import { useTheme } from '~/components/providers/theme-provider'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Pen, Pencil, Eraser, Undo, Redo, Sun, Moon, Trash2, CircleHelp, Highlighter, Download } from 'lucide-react'

type Point = {
    x: number
    y: number
}

type Tool = 'pen' | 'pencil' | 'eraser' | 'highlighter'

type Stroke = {
    points: Point[]
    color: string
    size: number
    tool: Tool
}

const helpItems = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y or Ctrl+Shift+Z' },
    { label: 'Clear', shortcut: 'Ctrl+K' },
    { label: 'Download', shortcut: 'Ctrl+D' },
    { label: 'Pen', shortcut: 'Ctrl+P' },
    { label: 'Pencil', shortcut: 'Ctrl+I' },
    { label: 'Highlighter', shortcut: 'Ctrl+U' },
    { label: 'Eraser', shortcut: 'Ctrl+E' },
    { label: 'Dark/Light', shortcut: 'Ctrl+L' },
    { label: 'Size +', shortcut: 'Ctrl+] or Scroll Up' },
    { label: 'Size -', shortcut: 'Ctrl+[ or Scroll Down' },
    { label: 'Help', shortcut: 'Ctrl+H' },
]

export default function App() {
    const { theme, setTheme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [color, setColor] = useState<string>('#000000');
    const [tool, setTool] = useState<Tool>('pen');
    const [size, setSize] = useState<number>(5);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [history, setHistory] = useState<Stroke[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw all strokes
        strokes.forEach(stroke => {
            if (stroke.points.length === 0) return

            ctx.beginPath()
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

            // Set stroke properties
            if (stroke.tool === 'pencil') {
                ctx.globalAlpha = 0.7
                ctx.lineWidth = Math.max(1, stroke.size * 0.7)
            } else if (stroke.tool === 'highlighter') {
                ctx.globalAlpha = 0.3
                ctx.lineWidth = stroke.size * 2
            } else {
                ctx.lineWidth = stroke.size
                ctx.globalAlpha = 1.0
            }

            if (stroke.tool === 'eraser') {
                ctx.strokeStyle = theme === 'dark' ? '#292524' : '#ffffff'
            } else {
                ctx.strokeStyle = stroke.color
            }

            ctx.lineCap = stroke.tool === 'highlighter' ? 'square' : 'round'
            ctx.lineJoin = 'round'

            // Draw the stroke
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
            }
            ctx.stroke()
        })

        // Draw current stroke if drawing
        if (isDrawing && currentStroke.length > 0) {
            ctx.beginPath()
            ctx.moveTo(currentStroke[0].x, currentStroke[0].y)

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

            if (tool === 'eraser') {
                ctx.strokeStyle = theme === 'dark' ? '#292524' : '#ffffff'
            } else {
                ctx.strokeStyle = color
            }

            ctx.lineCap = tool === 'highlighter' ? 'square' : 'round'
            ctx.lineJoin = 'round'

            for (let i = 1; i < currentStroke.length; i++) {
                ctx.lineTo(currentStroke[i].x, currentStroke[i].y)
            }
            ctx.stroke()
        }

        ctx.globalAlpha = 1.0
    }, [strokes, currentStroke, isDrawing, tool, color, size, theme]);

    const addToHistory = useCallback((newStrokes: Stroke[]) => {
        setHistory(prev => {
            // Remove any future history if we're not at the end
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, newStrokes];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentStroke([{ x, y }]);
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setCurrentStroke(prev => [...prev, { x, y }])
    }

    const stopDrawing = () => {
        if (!isDrawing || currentStroke.length === 0) {
            setIsDrawing(false)
            setCurrentStroke([])
            return
        }

        // Add the completed stroke to strokes
        const newStroke: Stroke = {
            points: currentStroke,
            color,
            size,
            tool
        }

        const newStrokes = [...strokes, newStroke];
        setStrokes(newStrokes);
        addToHistory(newStrokes);
        setCurrentStroke([]);
        setIsDrawing(false);
    }

    const donwloadImage = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // draw background
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = theme === 'dark' ? '#292524' : '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        // create download link
        const a = document.createElement('a');
        a.setAttribute('download', `drawboard.png`);
        a.setAttribute('href', canvas.toDataURL('png'));
        a.click();
        // restore original canvas state
        context.putImageData(imageData, 0, 0);
        context.globalCompositeOperation = 'source-over';
    };

    const clearCanvas = useCallback(() => {
        if (strokes.length === 0) return
        setStrokes([]);
        addToHistory([]);
    }, [strokes, addToHistory]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
        }
    }, [historyIndex, history]);

    useEffect(() => {
        redrawCanvas()
    }, [redrawCanvas]);

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            redrawCanvas()
        }

        window.addEventListener('resize', resizeCanvas)
        resizeCanvas()

        return () => window.removeEventListener('resize', resizeCanvas)
    }, [redrawCanvas]);

    // Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) redo()
                        else undo()
                        break
                    case 'y':
                        redo()
                    case 'd':
                        donwloadImage()
                        break
                    case 'l':
                        setTheme(theme === 'dark' ? 'light' : 'dark')
                        break
                    case 'e':
                        setTool('eraser')
                        break
                    case 'p':
                        setTool('pen')
                        break
                    case 'i':
                        setTool('pencil')
                        break
                    case 'u':
                        setTool('highlighter')
                        break
                    case 'k':
                        clearCanvas()
                        break
                    case 'h':
                        setShowShortcuts(prev => !prev)
                        break
                    case ']':
                        setSize(prev => Math.min(prev + 1, 50))
                        break
                    case '[':
                        setSize(prev => Math.max(prev - 1, 1))
                        break
                }
            }
        }

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    setSize(prev => Math.min(prev + 1, 50))
                } else {
                    setSize(prev => Math.max(prev - 1, 1))
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('wheel', handleWheel, { passive: false })
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('wheel', handleWheel)
        }
    }, [undo, redo, clearCanvas, theme]);

    return (
        <div className="h-screen overflow-hidden">
            <div className={cn('relative h-full')}>
                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const syntheticEvent = {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            preventDefault: () => { },
                            target: canvasRef.current
                        };
                        startDrawing(syntheticEvent as any);
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const syntheticEvent = {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            preventDefault: () => { },
                            target: canvasRef.current
                        };
                        draw(syntheticEvent as any);
                    }}
                    onTouchEnd={stopDrawing}
                    className={cn(
                        'absolute inset-0 w-full h-full cursor-crosshair bg-white dark:bg-stone-800',
                        tool === 'eraser' && 'cursor-grab',
                    )}
                />

                <div className="absolute hidden sm:flex items-center top-4 left-4 bg-zinc-700 shadow-lg rounded-lg p-2 text-sm">
                    <span className="font-semibold capitalize">{tool}</span>
                    <span className="mx-2">•</span>
                    <span id="currentColor" className="font-mono">{color}</span>
                    <span className="mx-2">•</span>
                    <span id="currentSize" className="font-mono">{size}px</span>
                </div>

                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center bg-zinc-700 shadow-lg rounded-lg gap-2 p-1">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className={cn(
                            'p-2 rounded-full text-white',
                            historyIndex <= 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-zinc-600'
                        )}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className='size-5' />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className={cn(
                            'p-2 rounded-full text-white',
                            historyIndex >= history.length - 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-zinc-600'
                        )}
                        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                    >
                        <Redo className='size-5' />
                    </button>
                    <button
                        onClick={clearCanvas}
                        disabled={strokes.length === 0}
                        className={cn(
                            'p-2 rounded-full text-white',
                            strokes.length === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-zinc-600'
                        )}
                        title="Clear (Ctrl+K)"
                    >
                        <Trash2 className='size-5' />
                    </button>
                    <button
                        onClick={donwloadImage}
                        disabled={strokes.length === 0}
                        className={cn(
                            'p-2 rounded-full text-white',
                            strokes.length === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-zinc-600'
                        )}
                        title="Download (Ctrl+D)"
                    >
                        <Download className='size-5' />
                    </button>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full text-white hover:bg-zinc-600"
                        title={`${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+L)`}
                    >
                        <Sun className='size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block' />
                        <Moon className='size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dark:hidden' />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="absolute bottom-0 sm:bottom-4 sm:left-1/2 w-full sm:w-fit transform sm:-translate-x-1/2 bg-zinc-700 shadow-lg sm:rounded-lg p-2 flex flex-wrap items-center gap-2 z-10">
                    {/* Color picker */}
                    <button className={'size-8 rounded-full bg-black shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500'} data-active={color === '#000000'} onClick={() => setColor('#000000')} />
                    <button className="size-8 rounded-full bg-red-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                    <button className="size-8 rounded-full bg-blue-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                    <button className="size-8 rounded-full bg-green-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#10b981'} onClick={() => setColor('#10b981')} />
                    <button className="size-8 rounded-full bg-yellow-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#eab308'} onClick={() => setColor('#eab308')} />
                    <button className="size-8 rounded-full bg-purple-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#8b5cf6'} onClick={() => setColor('#8b5cf6')} />
                    <button className="size-8 rounded-full bg-pink-500 shadow-md hover:scale-110 transition-transform data-[active=true]:ring-2 data-[active=true]:ring-zinc-500" data-active={color === '#ec4899'} onClick={() => setColor('#ec4899')} />

                    {/* Customize color picker */}
                    <input
                        type="color"
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer"
                    />

                    {/* Tool selection */}
                    <button
                        onClick={() => setTool('pen')}
                        className={cn('p-2 rounded-full text-white hover:bg-zinc-600', tool === 'pen' ? 'bg-zinc-500' : '')}
                        title="Pen (Ctrl+P)"
                    >
                        <Pen className='size-5' />
                    </button>

                    <button
                        onClick={() => setTool('pencil')}
                        className={cn('p-2 rounded-full text-white hover:bg-zinc-600', tool === 'pencil' ? 'bg-zinc-500' : '')}
                        title="Pencil (Ctrl+I)"
                    >
                        <Pencil className='size-5' />
                    </button>

                    <button
                        onClick={() => setTool('highlighter')}
                        className={cn('p-2 rounded-full text-white hover:bg-zinc-600', tool === 'highlighter' ? 'bg-zinc-500' : '')}
                        title="Highlighter (Ctrl+U)"
                    >
                        <Highlighter className='size-5' />
                    </button>

                    <button
                        onClick={() => setTool('eraser')}
                        className={cn('p-2 rounded-full text-white hover:bg-zinc-600', tool === 'eraser' ? 'bg-zinc-500' : '')}
                        title="Eraser (Ctrl+E)"
                    >
                        <Eraser className='size-5' />
                    </button>

                    {/* Size Slider */}
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={size}
                        className="w-20"
                        onChange={(e) => setSize(parseInt(e.target.value))}
                    />
                    <span className="text-xs w-4 text-white">{size}</span>

                    <button
                        onClick={() => setShowShortcuts(prev => !prev)}
                        className="p-2 rounded-full text-white hover:bg-zinc-600"
                        title="Show Shortcuts (Ctrl+H)"
                    >
                        <CircleHelp className='size-5' />
                    </button>
                </div>

                {/* Shortcuts Modal */}
                {showShortcuts && (
                    <div
                        onMouseDown={() => setShowShortcuts(false)}
                        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-zinc-700 shadow-xl rounded-lg p-4 z-20 w-72 text-white"
                    >
                        <div className="relative flex justify-between items-center mb-2">
                            <h3 className="font-bold">Keyboard Shortcuts</h3>
                            <button
                                onClick={() => setShowShortcuts(false)}
                                className="absolute -top-2 -right-2 p-1 rounded-full hover:bg-zinc-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            {helpItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span>{item.label}:</span>
                                    <span className="font-mono">{item.shortcut}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}