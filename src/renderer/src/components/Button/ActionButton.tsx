import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export type ActionButtonProps = ComponentProps<'button'> & {
  title?: string
}

export const ActionButton = ({ className, children, title, ...props }: ActionButtonProps) => {
  return (
    <>
      <button
        className={twMerge(
          'px-2 py-1 rounded-md border border-zinc-400/50 hover:bg-zinc-600/50 transition-colors duration-100 relative group', // Ensure group and relative are present
          className
        )}
        {...props}
      >
        {children}
        {title && (
          <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full -mb-14 opacity-0 transition-opacity group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {title}
          </span>
        )}
      </button>
    </>
  )
}
