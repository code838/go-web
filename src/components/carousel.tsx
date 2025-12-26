'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCarousel, type Carousel as CarouselType } from '@/requests'
import { useLocale } from 'next-intl'
import { IMG_BASE_URL } from '@/consts'
import { toUnderscoreLocale } from '@/lib/locale'

interface CarouselProps {
	type: 1 | 2 // 1: 首页图, 2: 邀请页图
	className?: string
}

export default function Carousel({ type, className = '' }: CarouselProps) {
	const locale = toUnderscoreLocale(useLocale())
	const { data: carouselData } = useCarousel()
	const [currentIndex, setCurrentIndex] = useState(0)

	const images = carouselData
		?.find(item => item.type === type)
		?.images
		// .filter(img => img.language === locale)
		.sort((a, b) => a.showOrder - b.showOrder) // 按 showOrder 排序，值越小越靠前
		|| []

	// 自动轮播
	useEffect(() => {
		if (images.length <= 1) return

		const interval = setInterval(() => {
			setCurrentIndex(prev => (prev + 1) % images.length)
		}, 5000) // 每5秒切换一次

		return () => clearInterval(interval)
	}, [images.length])

	if (images.length === 0) {
		// 如果没有轮播图数据，显示默认图片
		const defaultImage = type === 1 ? '/images/hero-home.png' : '/images/hero-invite.png'
		return (
			<div className={className}>
				<img
					src={defaultImage}
					alt='Hero'
					className='w-full h-full object-cover'
				/>
			</div>
		)
	}

	return (
		<div className={`relative overflow-hidden ${className}`}>
			<AnimatePresence>
				<motion.img
					key={currentIndex}
					src={images[currentIndex].image ? `${IMG_BASE_URL}${images[currentIndex].image}` : ''}
					alt={`Slide ${currentIndex + 1}`}
					className='absolute top-0 left-0 w-full h-full object-cover'
					initial={{ x: '100%' }}
					animate={{ x: 0 }}
					exit={{ x: '-100%' }}
					transition={{
						type: 'tween',
						ease: 'easeInOut',
						duration: 0.5
					}}
				/>
			</AnimatePresence>

			{/* 指示器 */}
			{images.length > 1 && (
				<div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5'>
					{images.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentIndex(index)}
							className={`h-1.5 rounded-full transition-all ${index === currentIndex
								? 'w-6 bg-white'
								: 'w-1.5 bg-white/40'
								}`}
							aria-label={`Go to slide ${index + 1}`}
						/>
					))}
				</div>
			)}
		</div>
	)
}

