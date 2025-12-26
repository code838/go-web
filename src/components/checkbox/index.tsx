import { cn } from '@/lib/utils'
import CheckedSVG from './checked.svg'
import UncheckedSVG from './unchecked.svg'

export interface CheckboxProps {
	checked: boolean
	className?: string
	onChange?: () => void
	disabled?: boolean
}
export default function Checkbox({ checked, className, onChange, disabled = false }: CheckboxProps) {
	const handleClick = (e: React.MouseEvent) => {
		if (onChange && !disabled) {
			e.stopPropagation()
			onChange()
		}
	}

	return (
		<button 
			type='button' 
			onClick={handleClick} 
			disabled={disabled}
			className={cn(
				'inline-flex items-center justify-center',
				disabled && 'opacity-50 cursor-not-allowed'
			)}
		>
			{checked ? <CheckedSVG className={cn('h-6 w-6', className)} /> : <UncheckedSVG className={cn('h-6 w-6', className)} />}
		</button>
	)
}
