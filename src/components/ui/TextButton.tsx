interface TextButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'default' | 'small'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function TextButton({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'default',
  disabled = false,
  type = 'button',
  className = '' 
}: TextButtonProps) {
  const variantClasses = {
    default: 'border-black text-black hover:bg-black hover:text-white',
    success: 'text-green-600 border-green-600 hover:!bg-green-600 hover:!text-white hover:!border-green-600',
    warning: 'warning hover:bg-yellow-500 hover:text-white',
    error: 'error'
  }

  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    small: 'px-2 py-1 text-xs'
  }

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-block border font-mono font-medium
        transition-colors duration-200 uppercase tracking-wide
        ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}
      `}
    >
      {children}
    </button>
  )
}
