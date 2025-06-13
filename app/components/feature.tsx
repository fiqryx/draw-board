import { cn } from '~/lib/utils';
import { Edit2, Sliders, Moon } from 'lucide-react';

function Feature({
    className,
    ...props
}: React.ComponentProps<'section'>) {
    return (
        <section {...props} className={cn('relative z-10 py-20 px-6', className)}>
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                    Powerful Features
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Edit2 className="size-5" />}
                        title="Multiple Tools"
                        description="Pen, Pencil, and Eraser tools with customizable sizes, colors, and rainbow gradient effects."
                        gradient="from-red-500 via-orange-500 to-yellow-500"
                    />
                    <FeatureCard
                        icon={<Sliders className="size-5" />}
                        title="Undo/Redo"
                        description="Full history support with unlimited undo and redo capabilities for seamless creativity."
                        gradient="from-green-500 via-blue-500 to-indigo-500"
                    />
                    <FeatureCard
                        icon={<Moon className="size-5" />}
                        title="Dark Mode"
                        description="Eye-friendly rainbow themes for comfortable drawing in any lighting condition."
                        gradient="from-purple-500 via-pink-500 to-red-500"
                    />
                </div>
            </div>
        </section>
    )
}
Feature.displayName = "Feature"

function FeatureCard({ icon, title, description, gradient }: {
    icon: React.ReactNode,
    title: string,
    description: string,
    gradient: string
}) {
    return (
        <div className="group p-8 rounded-2xl backdrop-blur-lg bg-white/50 dark:bg-stone-900/50 border border-gray-300 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-stone-800/50 transition-all duration-500 hover:scale-105 hover:border-gray-400 dark:hover:border-slate-500 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            <div className={`p-4 rounded-xl bg-gradient-to-r ${gradient} shadow-2xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-red-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
FeatureCard.displayName = "FeatureCard"

export {
    Feature,
    FeatureCard
}