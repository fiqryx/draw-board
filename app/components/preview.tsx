import { cn } from '~/lib/utils';
import { Edit2 } from 'lucide-react';

function Preview({
    className,
    ...props
}: React.ComponentProps<'section'>) {
    return (
        <section {...props} className={cn('relative z-10 py-16 px-6', className)}>
            <div className="max-w-6xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-300 dark:border-slate-600 backdrop-blur-lg bg-white/50 dark:bg-stone-900/50 hover:bg-white/70 dark:hover:bg-stone-800/50 transition-all duration-500 hover:scale-[1.02]">
                    <div className="p-4 flex items-center bg-gradient-to-r from-red-600/30 via-purple-600/30 to-blue-600/30 backdrop-blur-lg">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-500 shadow-lg shadow-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50"></div>
                        </div>
                        <div className="flex-1 text-center text-sm font-medium text-white">
                            app.drawboard.com
                        </div>
                    </div>
                    <div className="h-96 bg-gray-100/70 dark:bg-stone-800/70 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 opacity-50"></div>
                        <div className="text-center p-8 relative z-10">
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 shadow-2xl shadow-purple-500/30 inline-block mb-6">
                                <Edit2 className="text-white text-6xl" />
                            </div>
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                Drawing Board Preview
                            </h3>
                            <p className="text-gray-600 dark:text-slate-300">Start creating your masterpiece with rainbow magic!</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
Preview.displayName = "Preview"

export { Preview }