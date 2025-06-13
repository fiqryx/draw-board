import { cn } from '~/lib/utils';
import { Link } from 'react-router';

function CTA({
    className,
    ...props
}: React.ComponentProps<'section'>) {
    return (
        <section {...props} className={cn('relative z-10 py-20 px-6', className)}>
            <div className="max-w-4xl mx-auto text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-blue-600/20 rounded-3xl blur-2xl"></div>
                <div className="relative backdrop-blur-lg bg-white/50 dark:bg-stone-900/50 rounded-3xl p-12 border border-gray-300 dark:border-slate-600">
                    <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                        Ready to Create Magic?
                    </h2>
                    <p className="text-xl mb-8 text-gray-600 dark:text-slate-300 leading-relaxed">
                        Join thousands of artists, designers, and creators who use {import.meta.env.VITE_APP_NAME} every day to bring their visions to life.
                    </p>
                    <Link to="/board" className="group px-10 py-5 bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 text-white rounded-xl hover:from-red-600 hover:via-yellow-600 hover:to-purple-600 transition-all duration-300 text-lg font-bold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 relative overflow-hidden">
                        <span className="relative z-10">Start Drawing Now</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                </div>
            </div>
        </section>
    )
}
CTA.displayName = "CTA"

export { CTA }