import { cn } from '~/lib/utils'
import { useState, useEffect } from 'react';
import { useBoard, type Tool } from './use-board';
import { Button, ColorButton } from './components/button';
import { useTheme } from '~/components/providers/theme-provider'
import {
    Pen,
    Pencil,
    Eraser,
    Undo,
    Redo,
    Sun,
    Moon,
    Trash2,
    CircleHelp,
    Highlighter,
    Download,
    Square,
    Circle,
    Slash
} from 'lucide-react'

const helpers = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y or Ctrl+Shift+Z' },
    { label: 'Clear', shortcut: 'Ctrl+K' },
    { label: 'Download', shortcut: 'Ctrl+D' },
    { label: 'Pen', shortcut: 'Ctrl+P' },
    { label: 'Pencil', shortcut: 'Ctrl+I' },
    { label: 'Highlighter', shortcut: 'Ctrl+U' },
    { label: 'Eraser', shortcut: 'Ctrl+E' },
    { label: 'Rectangle', shortcut: 'Ctrl+R' },
    { label: 'Circle', shortcut: 'Ctrl+C' },
    { label: 'Line', shortcut: 'Ctrl+L' },
    { label: 'Dark/Light', shortcut: 'Ctrl+M' },
    { label: 'Size +', shortcut: 'Ctrl+] or Ctrl+Scroll Up' },
    { label: 'Size -', shortcut: 'Ctrl+[ or Ctrl+Scroll Down' },
    { label: 'Help', shortcut: 'Ctrl+H' },
];

export function meta() {
    return [
        { title: `${import.meta.env.VITE_APP_NAME} - Board` },
        { name: "description", content: "Simple & modern whiteboard application" },
    ];
}

export default function Page() {
    const { theme, setTheme } = useTheme();

    const [color, setColor] = useState<string>('#000000');
    const [tool, setTool] = useState<Tool>('pen');
    const [size, setSize] = useState<number>(5);
    const [isHelpOpen, setOpenHelp] = useState<boolean>(false);

    const {
        ref,
        isBlank,
        canUndo,
        canRedo,
        onDrawing,
        onStartDrawing,
        onStopDrawing,
        onStartTouch,
        onMoveTouch,
        clear,
        undo,
        redo,
        toImage
    } = useBoard({
        color,
        size,
        tool,
        backgroundColor: theme === 'dark' ? '#292524' : '#ffffff'
    });

    // shortcut
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
                        toImage()
                        break
                    case 'm':
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
                    case 'r':
                        setTool('rectangle');
                        break;
                    case 'c':
                        setTool('circle');
                        break;
                    case 'l':
                        setTool('line');
                        break
                    case 'k':
                        clear()
                        break
                    case 'h':
                        setOpenHelp(prev => !prev)
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
    }, [undo, redo, clear, theme]);

    return (
        <div className="h-screen overflow-hidden">
            <div className="relative h-full">
                <canvas
                    ref={ref}
                    onMouseMove={onDrawing}
                    onMouseDown={onStartDrawing}
                    onMouseUp={onStopDrawing}
                    onMouseLeave={onStopDrawing}
                    onTouchStart={onStartTouch}
                    onTouchMove={onMoveTouch}
                    onTouchEnd={onStopDrawing}
                    className={cn(
                        'absolute inset-0 w-full h-full cursor-crosshair bg-white dark:bg-stone-800',
                        tool === 'eraser' && 'cursor-grab',
                    )}
                />

                <div className="absolute hidden sm:flex items-center top-4 left-4 bg-zinc-700 shadow-lg rounded-lg p-2 text-sm">
                    <span className="font-semibold capitalize">{tool}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{color}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{size}px</span>
                </div>

                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center bg-zinc-700 shadow-lg rounded-lg gap-2 p-1">
                    <Button tabIndex={-1} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                        <Undo />
                    </Button>
                    <Button tabIndex={-1} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)">
                        <Redo />
                    </Button>
                    <Button tabIndex={-1} onClick={clear} disabled={isBlank} title="Clear (Ctrl+K)">
                        <Trash2 />
                    </Button>
                    <Button tabIndex={-1} onClick={() => toImage()} disabled={isBlank} title="Download (Ctrl+D)">
                        <Download />
                    </Button>
                    <Button tabIndex={-1} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={`${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+M)`}>
                        <Sun className='rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block' />
                        <Moon className='rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dark:hidden' />
                    </Button>
                </div>

                <div className="absolute bottom-0 sm:bottom-4 sm:left-1/2 w-full sm:w-fit transform sm:-translate-x-1/2 bg-zinc-700 shadow-lg sm:rounded-lg p-2 flex flex-wrap items-center gap-2 z-10">
                    <ColorButton className="bg-black" data-active={color === '#000000'} onClick={() => setColor('#000000')} />
                    <ColorButton className="bg-red-500" data-active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                    <ColorButton className="bg-blue-500" data-active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                    <ColorButton className="bg-green-500" data-active={color === '#10b981'} onClick={() => setColor('#10b981')} />
                    <ColorButton className="bg-yellow-500" data-active={color === '#eab308'} onClick={() => setColor('#eab308')} />
                    <ColorButton className="bg-purple-500" data-active={color === '#8b5cf6'} onClick={() => setColor('#8b5cf6')} />
                    <ColorButton className="bg-pink-500" data-active={color === '#ec4899'} onClick={() => setColor('#ec4899')} />

                    {/* Customize color */}
                    <input type="color" className="size-8 cursor-pointer" onChange={(e) => setColor(e.target.value)} />

                    {/* Tool selection */}
                    <Button title="Pen (Ctrl+P)" data-active={tool === 'pen'} onClick={() => setTool('pen')}>
                        <Pen />
                    </Button>
                    <Button title="Pencil (Ctrl+I)" data-active={tool === 'pencil'} onClick={() => setTool('pencil')}>
                        <Pencil />
                    </Button>
                    <Button title="Highlighter (Ctrl+U)" data-active={tool === 'highlighter'} onClick={() => setTool('highlighter')}>
                        <Highlighter />
                    </Button>
                    <Button title="Eraser (Ctrl+E)" data-active={tool === 'eraser'} onClick={() => setTool('eraser')}>
                        <Eraser />
                    </Button>
                    <Button title="Line (Ctrl+L)" data-active={tool === 'line'} onClick={() => setTool('line')}>
                        <Slash />
                    </Button>
                    <Button title="Rectangle (Ctrl+R)" data-active={tool === 'rectangle'} onClick={() => setTool('rectangle')}>
                        <Square />
                    </Button>
                    <Button title="Circle (Ctrl+C)" data-active={tool === 'circle'} onClick={() => setTool('circle')}>
                        <Circle />
                    </Button>

                    {/* Size Slider */}
                    <input min="1" max="50" type="range" value={size} className="w-20" onChange={(e) => setSize(parseInt(e.target.value))} />
                    <span className="text-xs w-4 text-white">{size}</span>

                    {/* Help Shortcut */}
                    <Button title="Help (Ctrl+H)" onClick={() => setOpenHelp(prev => !prev)}>
                        <CircleHelp />
                    </Button>
                </div>

                {isHelpOpen && (
                    <div
                        onMouseDown={() => setOpenHelp(false)}
                        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-zinc-700 shadow-xl rounded-lg p-4 z-20 w-72 text-white"
                    >
                        <div className="relative flex justify-between items-center mb-2">
                            <h3 className="font-bold">Keyboard Shortcuts</h3>
                            <button
                                onClick={() => setOpenHelp(false)}
                                className="absolute -top-2 -right-2 p-1 rounded-full hover:bg-zinc-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            {helpers.map((item, idx) => (
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