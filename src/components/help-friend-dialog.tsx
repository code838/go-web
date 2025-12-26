'use client'

import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast'

type HelpFriendDialogProps = {
	isOpen: boolean
	onClose: () => void
	onConfirm?: () => void
	title?: string
	subtitle?: string
	buttonText?: string
	extra?: ReactNode
	amountText?: string
	amountTag?: string
	variant?: 'full' | 'compact'
}

export default function HelpFriendDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	subtitle,
	buttonText,
	extra,
	amountText,
	amountTag,
	variant = 'full',
}: HelpFriendDialogProps) {
	const t = useTranslations('helpFriendDialog')
	if (!isOpen) return null
	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm()
			return
		}
		toast.success(t('helpSuccess'))
		onClose()
	}

	return (
		<div
			className='fixed inset-0 lg:left-[300px] z-50 flex items-start justify-center'
			// style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
		>
			<div className='relative w-[280px] max-w-[90vw] animate-in zoom-in-90 duration-200 mt-[120px] lg:mt-[200px]'>
				{/* 关闭按钮 */}
				<button
					onClick={onClose}
					className='absolute -top-8 -right-8 md:-top-12 md:-right-12 z-20 hover:opacity-80 transition-opacity'
					aria-label={t('closeAlt')}
				>
					<img src='/images/winning/winning-close.png' alt={t('closeAlt')} className='w-10 h-10 md:w-12 md:h-12' />
				</button>

				{/* 变体：compact（图2）与 full（图1） */}
				{variant === 'compact' ? (
					<div className='relative rounded-[28px] border border-white/10 bg-[#0F0F12] px-6 pt-16 pb-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden'>
						<img
							src='/images/winning/hand-heart.png'
							alt={t('handHeartAlt')}
							className='absolute -top-6 left-1/2 -translate-x-1/2 w-[160px] h-auto select-none pointer-events-none'
						/>
						<h3 className='text-[#310842] text-[20px] font-semibold tracking-wide uppercase'>{title ?? t('title')}</h3>
						<div className='relative mt-5'>
							<button
								onClick={handleConfirm}
								className='w-full py-3 rounded-full text-white text-[16px] font-bold hover:opacity-90 transition-opacity relative'
								style={{
									background: 'linear-gradient(90deg, #E344C3 0%, #9372FC 100%)',
									boxShadow: '0px 12px 28px rgba(147, 114, 252, 0.45)',
								}}
							>
								{buttonText ?? t('confirm')}
							</button>
							<img
								src='/images/winning/hand.png'
								alt={t('handAlt')}
								className='absolute -right-3 -bottom-1 w-[60px] h-auto select-none pointer-events-none'
							/>
						</div>
					</div>
				) : (
					<div
						className='relative rounded-[40px] px-5 pt-16 pb-7 text-center shadow-[0_16px_40px_rgba(0,0,0,0.55)]'
						style={{
							background: 'linear-gradient(180deg, #B1A1F6 0%, #F7F6FE 90%, #FFFFFF 100%)'
						}}
					>
						<img
							src='/images/winning/hand-heart.png'
							alt={t('handHeartAlt')}
							className='absolute -top-20 left-1/2 -translate-x-1/2 w-[140px] h-auto select-none pointer-events-none z-20'
						/>
						<div className='absolute top-[84px] left-1/2 -translate-x-1/2 h-3 w-5 rounded-b-[8px] bg-white/40' />
						<div className='mx-auto mt-3 w-[240px]'>
							<div className='relative rounded-[20px] bg-white py-4'>
								{/* 顶部小三角 */}
								<div className='absolute -top-2 left-1/2 -translate-x-1/2 h-0 w-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white' />
								<div className='text-[#6A2CA2] text-[30px] font-[500] tracking-wider uppercase mt-1'>{amountText ?? '100U'}</div>
								{(amountTag ?? t('amountTag')) && (
									<span className='absolute right-6 top-5 rounded-[16px] rounded-bl-none bg-[#F15BA6] px-2 py-[2px] pt-[4px] text-[11px] font-semibold text-white'>
										{amountTag ?? t('amountTag')}
									</span>
								)}
							</div>
						</div>
						<div className='mt-5 space-y-1'>
							<p className='text-[#611182] text-[20px] font-semibold'>{subtitle ?? t('subtitleLine1')}</p>
							<p className='text-[#611182] text-[26px] font-extrabold'>{title ?? t('titleLine2')}</p>
						</div>
						<div className='relative mx-auto mt-6 w-[240px]'>
							<button
								onClick={handleConfirm}
								className='w-full py-4 rounded-full text-white text-[16px] font-bold hover:opacity-90 transition-opacity relative'
								style={{
									background: 'linear-gradient(90deg, #E344C3 0%, #9372FC 100%)',
									boxShadow: '0px 16px 32px rgba(147, 114, 252, 0.5)',
								}}
							>
								{buttonText ?? t('goAppHelp')}
							</button>
							<img
								src='/images/winning/hand.png'
								alt={t('handAlt')}
								className='absolute -right-9 -bottom-13 w-[108px] h-auto select-none pointer-events-none z-10'
							/>
						</div>
					</div>
				)}

				{extra ? <div className='mt-3 text-left text-[#B5B5C3] text-xs'>{extra}</div> : null}
			</div>
		</div>
	)
}


