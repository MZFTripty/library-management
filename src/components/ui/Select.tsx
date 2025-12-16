'use client'

import React, { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string
    error?: string
    helperText?: string
    options: SelectOption[]
    placeholder?: string
    onChange?: (value: string) => void
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            helperText,
            options,
            placeholder,
            className = '',
            id,
            onChange,
            ...props
        },
        ref
    ) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            if (onChange) {
                onChange(e.target.value)
            }
        }

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        onChange={handleChange}
                        className={`
              w-full px-4 py-2.5 pr-10 text-sm
              appearance-none
              bg-white dark:bg-slate-800
              border rounded-lg
              text-slate-900 dark:text-slate-100
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
              ${error
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'
                            }
              ${className}
            `}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export { Select }
export type { SelectProps, SelectOption }
