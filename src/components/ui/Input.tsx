import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    label?: string
    error?: string
    helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, leftIcon, rightIcon, label, error, helperText, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative w-full">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                            error ? "border-red-500 focus-visible:ring-red-500" : "",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {(error || helperText) && (
                    <p className={cn("text-xs mt-1", error ? "text-red-500 font-medium" : "text-gray-500")}>
                        {error || helperText}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
