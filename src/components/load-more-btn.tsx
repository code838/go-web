'use client'

import { useTranslations } from 'next-intl'

interface LoadMoreBtnProps {
	onClick?: () => void
	disabled?: boolean
}

export default function LoadMoreBtn({ onClick, disabled }: LoadMoreBtnProps) {
	const t = useTranslations('common')
	
	return (
		<div className='text-center'>
			<button
				onClick={onClick}
				disabled={disabled}
				className='text-primary bg-button flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50'>
				{disabled && (
					<svg
						className='h-4 w-4 animate-spin'
						xmlns='http://www.w3.org/2000/svg'
						fill='none'
						viewBox='0 0 24 24'>
						<circle
							className='opacity-25'
							cx='12'
							cy='12'
							r='10'
							stroke='currentColor'
							strokeWidth='4'></circle>
						<path
							className='opacity-75'
							fill='currentColor'
							d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
					</svg>
				)}
				{disabled ? t('loadingText') : t('loadMore')}
			</button>
		</div>
	)
}
