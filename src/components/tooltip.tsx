'use client'

import clsx from 'clsx'
import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createPortal } from 'react-dom'

interface Props {
	value: string
	className?: string
	style?: CSSProperties
	normalWord?: boolean
	ellipsis?: boolean
	offsetLeft?: number
	tooltipWidth?: number
}

export default function TooltipSpan({ className, style, ellipsis, value, children, normalWord = false, offsetLeft = 0, tooltipWidth = 280 }: PropsWithChildren<Props>) {
	const [open, setOpen] = useState(false)
	const triggerRef = useRef<HTMLSpanElement | null>(null)
	const [coords, setCoords] = useState<{ bottom: number; left: number; width: number; height: number; centerX: number } | null>(null)

	const updatePosition = () => {
		const el = triggerRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		const centerX = rect.left + rect.width / 2
		setCoords({ 
			bottom: window.innerHeight - rect.top, 
			left: rect.left, 
			width: rect.width, 
			height: rect.height,
			centerX
		})
	}

	useEffect(() => {
		updatePosition()
		const handle = () => updatePosition()
		window.addEventListener('scroll', handle, true)
		window.addEventListener('resize', handle)
		return () => {
			window.removeEventListener('scroll', handle, true)
			window.removeEventListener('resize', handle)
		}
	}, [open])

	return (
		<>
			<span
				onMouseLeave={() => setOpen(false)}
				ref={triggerRef}
				onMouseEnter={() => {
					setOpen(true)
					updatePosition()
				}}
				className={clsx(className, 'cursor-pointer')}
				style={{ ...style }}>
				{children}
			</span>

			{open &&
				coords &&
				typeof window !== 'undefined' &&
				createPortal(
					<motion.div
						initial={{ scale: 0.4, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.2, type: 'spring' }}
						className='fixed bottom-0 left-0 z-[9999]'
						style={{
							left: coords.left + coords.width / 2 + offsetLeft,
							bottom: coords.bottom
						}}>
						<div className='relative flex translate-x-[-50%] flex-col items-center'>
							<div
								className={clsx(
									'bg-bg relative z-10 block rounded-xl border px-3 py-2 text-xs leading-relaxed font-normal whitespace-normal shadow-lg',
									!normalWord && 'break-all'
								)}
								style={{ width: tooltipWidth > 200 ? 'max-content' : `${tooltipWidth}px`, maxWidth: `${tooltipWidth}px` }}>
								{value}
							</div>
							<div className='bg-bg relative bottom-2 z-10 mt-[1.5px] inline-block h-3 w-3 rotate-45 rounded border-2 !border-t-0 !border-l-0'></div>
						</div>
					</motion.div>,
					document.body
				)}
		</>
	)
}
