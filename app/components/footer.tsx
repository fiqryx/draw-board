import { cn } from '~/lib/utils';
import { Edit2, Github } from 'lucide-react';

function Footer({
    className,
    ...props
}: React.ComponentProps<'footer'>) {
    return (
        <footer
            {...props}
            className={cn(
                'relative z-10 py-8 px-6 backdrop-blur-lg bg-white/50 dark:bg-stone-900/50 border-t border-gray-200 dark:border-stone-700 mt-20',
                className
            )}
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
                        <Edit2 className="text-white text-lg" />
                    </div>
                    <span className="font-bold bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                        {import.meta.env.VITE_APP_NAME}
                    </span>
                </div>
                <div className="flex space-x-6">
                    <a href="#" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:scale-105">Terms</a>
                    <a href="#" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:scale-105">Privacy</a>
                    <a href="#" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:scale-105">Contact</a>
                    <a
                        target='_blank'
                        href={import.meta.env.VITE_GITHUB_URL || "#"}
                        className="flex items-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-105"
                    >
                        <Github className="size-4" />&nbsp;GitHub
                    </a>
                </div>
            </div>
        </footer>
    )
}
Footer.displayName = "Footer"

export { Footer }