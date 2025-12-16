import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps {
    children: React.ReactNode
    className?: string
}

interface CardTitleProps {
    children: React.ReactNode
    className?: string
    as?: 'h1' | 'h2' | 'h3' | 'h4'
}

interface CardDescriptionProps {
    children: React.ReactNode
    className?: string
}

interface CardContentProps {
    children: React.ReactNode
    className?: string
}

interface CardFooterProps {
    children: React.ReactNode
    className?: string
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    }

    return (
        <div
            className={`
        relative overflow-hidden
        bg-white/40 dark:bg-black/40 backdrop-blur-xl
        border border-white/20 dark:border-white/10
        rounded-xl shadow-lg
        transition-all duration-300 ease-in-out
        hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]
        hover:bg-white/50 dark:hover:bg-black/50
        group
        ${paddingStyles[padding]}
        ${className}
      `}
        >
            {/* Colorful top border gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-400 via-purple-500 to-violet-600 opacity-80" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>{children}</div>
)

const CardTitle: React.FC<CardTitleProps> = ({
    children,
    className = '',
    as: Tag = 'h3',
}) => (
    <Tag
        className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
    >
        {children}
    </Tag>
)

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}>
        {children}
    </p>
)

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
)

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div
        className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
        {children}
    </div>
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
