import { cn } from "../../utils/utils";

export const Button = ({
    className,
    variant = "primary",
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-5 py-2";

    const variants = {
        primary: `bg-green-600 text-white hover:bg-green-600/90 shadow-md hover:shadow-lg transition-all`,
        outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
        ghost: "hover:bg-slate-100 text-slate-700",
    };

    return (
        <button className={cn(baseStyles, variants[variant], className)} {...props}>
            {children}
        </button>
    );
};