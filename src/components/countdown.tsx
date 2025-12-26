'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface CountdownProps {
	endTime: number // 结束时间戳（毫秒）
	className?: string
	showSeconds?: boolean // 是否显示秒数，默认true
	showLabels?: boolean // 是否显示文字标签（小时、分钟等），默认true
}

interface TimeLeft {
	hours: number
	minutes: number
	seconds: number
}

export default function Countdown({ endTime, className, showSeconds = true, showLabels = true }: CountdownProps) {
	const t = useTranslations('productCard')
	const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 })
	const isMobile = useIsMobile()

	useEffect(() => {
		const calculateTimeLeft = (): TimeLeft => {
			const now = Date.now()
			const difference = endTime - now

			if (difference > 0) {
				const hours = Math.floor(difference / (1000 * 60 * 60))
				const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
				const seconds = Math.floor((difference % (1000 * 60)) / 1000)

				return { hours, minutes, seconds }
			}

			return { hours: 0, minutes: 0, seconds: 0 }
		}

		// 立即计算一次
		setTimeLeft(calculateTimeLeft())

		// 设置定时器，每秒更新一次
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft())
		}, 1000)

		// 清理定时器
		return () => clearInterval(timer)
	}, [endTime])

	const formatNumber = (num: number): string => {
		return num.toString().padStart(2, '0')
	}

	// 移动端倒计时
	if (isMobile) {
		return (
			<div className={`w-full ${className || ''}`}>
				{/* 倒计时数字 */}
				<div className="flex items-center justify-center gap-2.5 text-center px-3">
					<div className="flex flex-col items-center">
						<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
							<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
								{formatNumber(timeLeft.hours)}
							</span>
						</div>
						{showLabels && (
							<span className="text-[#6E6E70] text-xs uppercase mt-1" style={{ fontFamily: 'Poppins' }}>
								{t('hours')}
							</span>
						)}
					</div>
					<div className="flex flex-col items-center">
						<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
							<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
								{formatNumber(timeLeft.minutes)}
							</span>
						</div>
						{showLabels && (
							<span className="text-[#6E6E70] text-xs uppercase mt-1" style={{ fontFamily: 'Poppins' }}>
								{t('minutes')}
							</span>
						)}
					</div>
					{showSeconds && (
						<div className="flex flex-col items-center">
							<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
								<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
									{formatNumber(timeLeft.seconds)}
								</span>
							</div>
							{showLabels && (
								<span className="text-[#6E6E70] text-xs uppercase mt-1" style={{ fontFamily: 'Poppins' }}>
									{t('seconds')}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
		)
	}

	// 桌面端倒计时
	return (
		<div className={`w-full ${className || ''}`}>
			<div className="flex justify-between items-center text-sm mb-1">
				<span className="text-secondary">{t('progress')}</span>
				<span className="text-secondary">100%</span>
			</div>
			<div className="w-full h-3 overflow-hidden rounded-full bg-white/5">
				<div className="bg-brand h-full rounded-full w-full"></div>
			</div>
			<div className="flex items-center justify-center gap-2.5 text-center px-3 mt-3">
				<div className="flex flex-col items-center gap-0">
					<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
						<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
							{formatNumber(timeLeft.hours)}
						</span>
					</div>
					<span className="text-secondary text-xs uppercase tracking-tight font-medium mt-0.5" style={{ fontFamily: 'Poppins' }}>
						{t('hours')}
					</span>
				</div>
				<div className="flex flex-col items-center gap-0">
					<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
						<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
							{formatNumber(timeLeft.minutes)}
						</span>
					</div>
					<span className="text-secondary text-xs uppercase tracking-tight font-medium mt-0.5" style={{ fontFamily: 'Poppins' }}>
						{t('minutes')}
					</span>
				</div>
				<div className="flex flex-col items-center gap-0">
					<div className="flex items-center justify-center w-16 h-12 rounded-lg bg-white/5">
						<span className="text-white font-semibold text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
							{formatNumber(timeLeft.seconds)}
						</span>
					</div>
					<span className="text-secondary text-xs uppercase tracking-tight font-medium mt-0.5" style={{ fontFamily: 'Poppins' }}>
						{t('seconds')}
					</span>
				</div>
			</div>
		</div>
	)
}
