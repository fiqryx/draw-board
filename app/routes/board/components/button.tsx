import { cn } from "~/lib/utils";

function Button({
    className,
    disabled,
    ...props
}: React.ComponentProps<'button'>) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={cn(
                "p-2 rounded-full text-white hover:bg-zinc-600 data-[active=true]:bg-zinc-500 data-[active=true]:hover:bg-zinc-500",
                "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
                "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
                className
            )}
        />
    );
}
Button.displayName = "Button"

function ColorButton({
    className,
    ...props
}: React.ComponentProps<'button'>) {
    return (
        <button
            {...props}
            className={cn(
                'size-5 rounded-sm bg-black shadow-md hover:scale-110 transition-transform',
                'data-[active=true]:ring-2 data-[active=true]:ring-zinc-500',
                className
            )}
        />
    );
}
ColorButton.displayName = "ColorButton"

export { Button, ColorButton }