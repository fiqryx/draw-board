import { cn } from '~/lib/utils';
import { Link } from 'react-router';
import { AuroraText } from './ui/aurora-text';

function Hero({ className, ...props }: React.ComponentProps<'section'>) {
    return (
        <section {...props} className={cn('relative z-10 py-20 px-6', className)}>
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                    Unleash Your{' '}
                    <AuroraText colors={['#f87171', '#facc15', '#c084fc']}>Creativity</AuroraText>
                </h1>
                <p className="text-xl max-w-2xl mx-auto mb-10 text-gray-600 dark:text-slate-300 leading-relaxed">
                    A powerful, intuitive drawing board with all the tools you need to bring your ideas to life.
                    Create stunning artwork with our advanced rainbow-powered interface.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/board" className="group px-8 py-4 bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 text-white rounded-xl hover:from-red-600 hover:via-yellow-600 hover:to-purple-600 transition-all duration-300 text-lg font-semibold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 relative overflow-hidden">
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                    <button className="px-8 py-4 xborder-2 border-purple-400 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-white/50 dark:hover:bg-stone-700/30 transition-all duration-300 text-lg font-semibold backdrop-blur-sm hover:scale-105 relative overflow-hidden">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 opacity-20 blur-sm"></div>
                        <span className="relative z-10">Learn More</span>
                    </button>
                </div>
            </div>
        </section>
    )
}
Hero.displayName = "Hero"

export { Hero }