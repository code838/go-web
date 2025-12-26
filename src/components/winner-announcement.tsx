'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useHomeBuys } from '@/requests'
import type { WinnerInfo } from '@/types'
import AnnouncementSVG from '@/svgs/announcement.svg'
import { useTranslations } from 'next-intl'

export default function WinnerAnnouncement() {
	const t = useTranslations('home')
	const { data } = useHomeBuys()
	const [currentIndex, setCurrentIndex] = useState(0)

	const winners = data?.owners || []

	// 自动滚动显示中奖信息
	useEffect(() => {
		if (winners.length <= 1) return

		const interval = setInterval(() => {
			setCurrentIndex(prev => (prev + 1) % winners.length)
		}, 5000) // 每5秒切换一次，减少频率避免晃眼

		return () => clearInterval(interval)
	}, [winners.length])

	// 如果没有数据，显示默认文案
	if (winners.length === 0) {
		return (
			<section className='bg-white/5 rounded-xl flex items-center gap-2 py-3 px-4'>
				<AnnouncementSVG className='w-4 h-4 flex-shrink-0' />
				<div className='flex-1 text-white/80 text-base overflow-hidden text-sm'>
					<div className='whitespace-nowrap overflow-hidden text-ellipsis'>
						{t('announcementPrefix')} <span className='text-[#4A9EFF]'>{t('announcementUser')}</span> {t('announcementMiddle')} <span className='text-[#FFB800]'>{t('announcementValue')}</span> <span className='text-[#FFB800]'>{t('announcementProduct')}</span>
					</div>
				</div>
			</section>
		)
	}

	const currentWinner = winners[currentIndex]

	// 格式化时间显示（可选使用，当前未在UI中显示）
	const formatTime = (minutes: number) => {
		if (minutes < 1) return '刚刚'
		if (minutes < 60) return `${minutes} 分钟前`
		const hours = Math.floor(minutes / 60)
		if (hours < 24) return `${hours} 小时前`
		const days = Math.floor(hours / 24)
		return `${days} 天前`
	}

	return (
		<section className='bg-white/5 rounded-xl flex items-center gap-2 py-3 px-4 overflow-hidden'>
			<AnnouncementSVG className='w-4 h-4 flex-shrink-0' />
			<div className='flex-1 overflow-hidden'>
				<AnimatePresence mode="wait">
					<motion.div
						key={currentIndex}
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -20, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className='text-white/80 text-sm whitespace-nowrap overflow-hidden text-ellipsis'
					>
						<span className='text-white/60'>{t('winnerAnnouncementPrefix')}</span>{' '}
						<span className='text-[#4A9EFF] font-medium'>{currentWinner.nickName}</span>{' '}
						<span className='text-white/60'>{t('winnerAnnouncementMiddle')}</span>{' '}
						<span className='text-[#FFB800]'>${currentWinner.productValue}</span>{' '}
						<span className='text-white/60'>{t('winnerAnnouncementSuffix')}</span>
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	)
}

