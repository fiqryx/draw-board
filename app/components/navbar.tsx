import { cn } from '~/lib/utils';
import { Link } from 'react-router';
import { useTheme } from './providers/theme-provider';
import { Edit2, Moon, Sun } from 'lucide-react';

function Navbar({
    className,
    ...props
}: React.ComponentProps<'nav'>) {
    const { theme, setTheme } = useTheme();

    return (
        <nav
            {...props}
            className={cn(
                'relative z-10 px-6 py-4 backdrop-blur-lg bg-white/70 dark:bg-stone-900/50 border-b border-gray-200 dark:border-slate-700',
                className
            )}>
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
                        <Edit2 className="text-white text-xl" />
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                        {import.meta.env.VITE_APP_NAME}
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-white/50 dark:bg-stone-700/50 backdrop-blur-sm border border-gray-300 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-stone-600/50 transition-all duration-300"
                    >
                        {theme === 'dark' ? <Sun /> : <Moon />}
                    </button>
                    <Link
                        to="/board"
                        className="px-6 py-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded-lg hover:from-red-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
                    >
                        Start Drawing
                    </Link>
                </div>
            </div>
        </nav>
    )
}
Navbar.DisplayName = "Navbar"

export { Navbar }