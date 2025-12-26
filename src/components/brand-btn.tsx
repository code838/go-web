import { cn } from '@/lib/utils'

interface Props {
	children: React.ReactNode
	className?: string
	onClick?: () => void
	disabled?: boolean
}

export default function BrandBtn({ children, className, onClick, disabled }: Props) {
	return (
		<button
			className={cn(
				'to-brand h-10 rounded-lg bg-gradient-to-b from-[#A088FF] p-0.2 text-center text-sm text-white outline-[3px] outline-white/10 active:p-[1px] active:outline-1',
				disabled && 'opacity-50 cursor-not-allowed',
				className
			)}
			onClick={onClick}
			disabled={disabled}>
			<div className={cn('bg-brand h-full w-full rounded-lg px-4 font-semibold flex items-center justify-center', !disabled && 'hover:bg-brand/80')}>{children}</div>
		</button>
	)
}
