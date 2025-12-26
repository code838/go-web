'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type DialogShellProps = {
	title: string
	children: ReactNode
	close?: () => void
	closeIcon?: ReactNode
	mobilePosition?: 'bottom' | 'center' // 移动端弹框位置
}

export default function DialogShell({ title, children, close, closeIcon, mobilePosition = 'center' }: DialogShellProps) {
	const isMobile = useMediaQuery('(max-width: 1024px)')

	// 移动端底部弹框时，禁止背景滚动
	useEffect(() => {
		if (isMobile && mobilePosition === 'bottom') {
			document.body.style.overflow = 'hidden'
			return () => {
				document.body.style.overflow = ''
			}
		}
	}, [isMobile, mobilePosition])

	// 移动端底部弹框样式
	if (isMobile && mobilePosition === 'bottom') {
		return (
			<div className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[4px]'>
				<div className='animate-in slide-in-from-bottom relative w-full space-y-6 rounded-t-xl border-t border-white/10 bg-[#0E0E10] px-4 pt-4 pb-8 duration-300'>
					<div className='flex items-center justify-center'>
						{title && <h3 className='text-center text-base font-semibold text-white/80'>{title}</h3>}
						<button onClick={close} className='absolute right-4 top-1'>
							{closeIcon ? closeIcon : <X className='h-5 w-5 text-white/80' />}
						</button>
					</div>
					{children}
				</div>
			</div>
		)
	}

	// 桌面端或移动端居中弹框样式（原有样式）
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[12px]'>
			<div className='animate-in zoom-in-90 relative w-[520px] space-y-6 rounded-3xl border border-white/10 bg-[#0a0a0a] px-[64px] py-6 backdrop-blur-[12px] duration-200'>
				{title && <h3 className='text-center text-2xl font-semibold'>{title}</h3>}
				<button onClick={close} className='absolute top-6 right-6'>
					{closeIcon ? closeIcon : <X className='text-subtitle h-6 w-6' />}
				</button>
				{children}
			</div>
		</div>
	)
}
