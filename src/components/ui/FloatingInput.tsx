'use client'

import React, { useState, forwardRef, InputHTMLAttributes } from 'react'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, error, leftIcon, rightIcon, className = '', id, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false)
        const inputId = id || `floating-input-${Math.random().toString(36).substr(2, 9)}`
        const hasValue = value && value.toString().length > 0

        return (
            <div className="w-full relative mb-4">
                <div
                    className={`
            relative flex items-center w-full h-16
            bg-gray-50 dark:bg-gray-700/50
            border-2 rounded-xl transition-all duration-300
            ${error
                            ? 'border-red-500 focus-within:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                            : isFocused
                                ? 'border-indigo-500 bg-white dark:bg-gray-800 shadow-lg shadow-indigo-500/10'
                                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                        }
            ${className}
          `}
                >
                    {leftIcon && (
                        <div className={`pl-4 flex items-center justify-center h-full pointer-events-none ${isFocused ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {leftIcon}
                        </div>
                    )}
                    <div className="relative flex-1 h-full">
                        <input
                            ref={ref}
                            id={inputId}
                            value={value}
                            {...props}
                            className={`
                w-full h-full px-4 pt-5 pb-0
                bg-transparent
                text-gray-900 dark:text-gray-100 font-medium text-base
                placeholder-transparent
                focus:outline-none focus:ring-0
                peer
                autofill:bg-transparent
              `}
                            onFocus={(e) => {
                                setIsFocused(true)
                                props.onFocus?.(e)
                            }}
                            onBlur={(e) => {
                                setIsFocused(false)
                                props.onBlur?.(e)
                            }}
                            placeholder={label}
                        />
                        <label
                            htmlFor={inputId}
                            className={`
                absolute left-4 transition-all duration-200 pointer-events-none truncate max-w-[calc(100%-1rem)]
                ${isFocused || hasValue
                                    ? 'top-2 text-[10px] uppercase tracking-wider font-bold'
                                    : 'top-1/2 -translate-y-1/2 text-base font-normal'
                                }
                ${error
                                    ? 'text-red-500'
                                    : isFocused
                                        ? 'text-indigo-600'
                                        : 'text-gray-500 dark:text-gray-400'
                                }
              `}
                        >
                            {label}
                        </label>
                    </div>
                    {rightIcon && (
                        <div className="pr-4 flex items-center justify-center h-full text-gray-400 hover:text-gray-600 cursor-pointer z-10">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="absolute -bottom-5 left-1 text-xs font-medium text-red-500 animate-slideDown">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

FloatingInput.displayName = 'FloatingInput'

export { FloatingInput }
