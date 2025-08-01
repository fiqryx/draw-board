import { cn } from '~/lib/utils'
import { useState, useEffect, useRef } from 'react';
import { Label } from '~/components/ui/label';
import { useDraw, type Tool } from './use-draw';
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
    Slash,
    MousePointer2,
    Palette,
    Type,
    MoveRight,
    ZoomIn,
    ZoomOut,
    Hand
} from 'lucide-react'
import { Textarea } from '~/components/ui/textarea';

const helpers = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y or Ctrl+Shift+Z' },
    { label: 'Clear', shortcut: 'Ctrl+C' },
    { label: 'Download', shortcut: 'Ctrl+D' },
    { label: 'Hand', shortcut: '1' },
    { label: 'Choice', shortcut: '2' },
    { label: 'Pen', shortcut: '3' },
    { label: 'Pencil', shortcut: '4' },
    { label: 'Highlighter', shortcut: '5' },
    { label: 'Eraser', shortcut: '6' },
    { label: 'Line', shortcut: '7' },
    { label: 'Arrow', shortcut: '8' },
    { label: 'Rectangle', shortcut: '9' },
    { label: 'Circle', shortcut: '0' },
    { label: 'Text', shortcut: '-' },
    { label: 'Dark/Light', shortcut: 'Ctrl+L' },
    { label: 'Size +', shortcut: 'Ctrl+]' },
    { label: 'Size -', shortcut: 'Ctrl+[' },
    // { label: 'Options', shortcut: 'Ctrl+O' },
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

    const textRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState<string>('');

    const [showHelp, setShowHelp] = useState<boolean>(false);
    const [showOptions, setShowOptions] = useState<boolean>(false);

    const {
        ref,
        isBlank,
        canUndo,
        canRedo,
        isEditingText,
        textPosition,
        selected,
        onDrawing,
        onStartDrawing,
        onStopDrawing,
        onStartTouch,
        onMoveTouch,
        clear,
        undo,
        redo,
        toImage,
        addText,
        selectAll,
        deleteSelected,
        zoom,
        zoomIn,
        zoomOut,
        resetZoom
    } = useDraw({
        color,
        size,
        tool,
        backgroundColor: theme === 'dark' ? '#292524' : '#ffffff'
    });

    const handleTextSubmit = () => {
        addText(text);
        setText('');
        setTool('select');
    };

    const handleSelectAll = () => {
        setTool('select');
        selectAll();
    }

    useEffect(() => {
        if (isEditingText && textRef.current) {
            setTimeout(() => {
                textRef.current?.focus();
            }, 10);
        }
    }, [isEditingText, textPosition]);

    // shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditingText || document.activeElement?.tagName === 'INPUT') return
            e.preventDefault();
            if (e.metaKey || e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) redo()
                        else undo()
                        break
                    case 'a':
                        handleSelectAll()
                        break
                    case 'y':
                        redo()
                        break
                    case 'd':
                        toImage()
                        break
                    case 'm':
                        setTheme(theme === 'dark' ? 'light' : 'dark')
                        break
                    case 'c':
                        clear()
                        break
                    case 'o':
                        setShowOptions(prev => !prev)
                        break
                    case 'h':
                        setShowHelp(prev => !prev)
                        break
                    case ']':
                        setSize(prev => Math.min(prev + 1, 50))
                        break
                    case '[':
                        setSize(prev => Math.max(prev - 1, 1))
                        break
                }
            } else {
                switch (e.key.toLowerCase()) {
                    case '1':
                        setTool('hand');
                        break;
                    case '2':
                        setTool('select');
                        break;
                    case '3':
                        setTool('pen');
                        break;
                    case '4':
                        setTool('pencil');
                        break;
                    case '5':
                        setTool('highlighter');
                        break;
                    case '6':
                        setTool('eraser');
                        break;
                    case '7':
                        setTool('line');
                        break;
                    case '8':
                        setTool('arrow');
                        break;
                    case '9':
                        setTool('rectangle');
                        break;
                    case '0':
                        setTool('circle');
                        break;
                    case '-':
                        setTool('text');
                        break;
                    case 'delete':
                        deleteSelected();
                        break
                }
            }
        }

        // const handleWheel = (e: WheelEvent) => {
        //     if (e.ctrlKey || e.metaKey) {
        //         e.preventDefault();
        //         if (e.deltaY < 0) {
        //             setSize(prev => Math.min(prev + 1, 50))
        //         } else {
        //             setSize(prev => Math.max(prev - 1, 1))
        //         }
        //     }
        // };

        window.addEventListener('keydown', handleKeyDown)
        // window.addEventListener('wheel', handleWheel, { passive: false })
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            // window.removeEventListener('wheel', handleWheel)
        }
    }, [undo, redo, clear, theme, isEditingText]);

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
                    className="absolute inset-0 w-full h-full bg-white dark:bg-stone-800"
                />

                {isEditingText && textPosition && (
                    <div
                        className='absolute z-10'
                        style={{ left: textPosition.x, top: textPosition.y }}
                    >
                        <form onSubmit={handleTextSubmit}>
                            <Textarea
                                ref={textRef}
                                value={text}
                                onBlur={handleTextSubmit}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') handleTextSubmit();
                                }}
                                className="rounded-lg resize-none xbg-white/90 border-none focus-visible:ring-0"
                                style={{
                                    color,
                                    fontFamily: 'Arial',
                                    fontSize: `${size * 3}px`,
                                }}
                            />
                        </form>
                    </div>
                )}

                <div className="absolute hidden sm:flex items-center bottom-4 left-4 bg-zinc-700 shadow-lg rounded-lg p-2 text-xs">
                    <Button tabIndex={-1} onClick={zoomOut}>
                        <ZoomOut />
                    </Button>
                    <span className="font-semibold capitalize">{Math.round(zoom * 100).toFixed(0)}%</span>
                    <Button tabIndex={-1} onClick={zoomIn}>
                        <ZoomIn />
                    </Button>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{color}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{size}px</span>
                </div>

                <div className="absolute not-sm:top-2 right-2 sm:bottom-4 sm:right-4 flex items-center bg-zinc-700 shadow-lg rounded-lg gap-2 p-1">
                    <Button tabIndex={-1} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                        <Undo />
                    </Button>
                    <Button tabIndex={-1} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)">
                        <Redo />
                    </Button>
                    <Button
                        tabIndex={-1}
                        onClick={() => selected.length > 0 ? deleteSelected() : clear()}
                        disabled={isBlank}
                        title={selected.length > 0 ? 'Delete (Delete)' : 'Clear (Ctrl+C)'}
                    >
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

                <div className="absolute not-sm:bottom-0 sm:top-4 sm:left-1/2 w-full sm:w-fit transform sm:-translate-x-1/2 bg-zinc-700 shadow-lg sm:rounded-lg p-2 flex flex-wrap items-center gap-2 z-10">
                    <Button title="Hand (1)" data-active={tool === 'hand'} onClick={() => setTool('hand')}>
                        <Hand />
                    </Button>
                    <Button title="Choice (2)" data-active={tool === 'select'} onClick={() => setTool('select')}>
                        <MousePointer2 />
                    </Button>
                    <Button title="Pen (3)" data-active={tool === 'pen'} onClick={() => setTool('pen')}>
                        <Pen />
                    </Button>
                    <Button title="Pencil (4)" data-active={tool === 'pencil'} onClick={() => setTool('pencil')}>
                        <Pencil />
                    </Button>
                    <Button title="Highlighter (5)" data-active={tool === 'highlighter'} onClick={() => setTool('highlighter')}>
                        <Highlighter />
                    </Button>
                    <Button title="Eraser (6)" data-active={tool === 'eraser'} onClick={() => setTool('eraser')}>
                        <Eraser />
                    </Button>
                    <Button title="Line (7)" data-active={tool === 'line'} onClick={() => setTool('line')}>
                        <Slash />
                    </Button>
                    <Button title="Arrow (8)" data-active={tool === 'arrow'} onClick={() => setTool('arrow')}>
                        <MoveRight />
                    </Button>
                    <Button title="Rectangle (9)" data-active={tool === 'rectangle'} onClick={() => setTool('rectangle')}>
                        <Square />
                    </Button>
                    <Button title="Circle (0)" data-active={tool === 'circle'} onClick={() => setTool('circle')}>
                        <Circle />
                    </Button>
                    <Button title="Text (-)" data-active={tool === 'text'} onClick={() => setTool('text')}>
                        <Type />
                    </Button>
                    <Button title="Options (Ctrl+O)" data-active={showOptions} className='lg:hidden' onClick={() => setShowOptions(prev => !prev)}>
                        <Palette />
                    </Button>
                    <Button title="Help (Ctrl+H)" onClick={() => setShowHelp(prev => !prev)}>
                        <CircleHelp />
                    </Button>
                </div>

                <div
                    className={cn(
                        'absolute grid gap-4 left-4 top-1/6 z-20 w-52 bg-zinc-700 p-2.5 rounded-lg',
                        showOptions ? 'grid' : 'hidden lg:grid'
                    )}
                >
                    <div className="grid gap-1">
                        <Label className='text-xs'>Strokes</Label>
                        <div className="grid grid-cols-6 items-center gap-1">
                            <ColorButton className="bg-red-500" data-active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                            <ColorButton className="bg-blue-500" data-active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                            <ColorButton className="bg-green-500" data-active={color === '#10b981'} onClick={() => setColor('#10b981')} />
                            <ColorButton className="bg-yellow-500" data-active={color === '#eab308'} onClick={() => setColor('#eab308')} />
                            <ColorButton className="bg-purple-500" data-active={color === '#8b5cf6'} onClick={() => setColor('#8b5cf6')} />
                            <input type="color" className="size-7 cursor-pointer" onChange={(e) => setColor(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label className='text-xs'>Size</Label>
                        <input min="1" max="50" type="range" value={size} className="w-full" onChange={(e) => setSize(parseInt(e.target.value))} />
                        <div className="flex items-center">
                            <span className="text-xs w-4 text-white">0</span>
                            <span className="text-xs w-4 text-white ml-auto">50</span>
                        </div>
                    </div>
                </div>

                {showHelp && (
                    <div
                        style={{ scrollbarWidth: 'thin' }}
                        className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-zinc-700 shadow-xl rounded-lg p-4 z-20 w-72 max-h-96 overflow-auto text-white"
                    >
                        <div className="relative flex justify-between items-center mb-2">
                            <h3 className="font-bold">Keyboard Shortcuts</h3>
                            <button
                                onClick={() => setShowHelp(false)}
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