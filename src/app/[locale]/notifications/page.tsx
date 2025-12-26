'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuth } from '@/hooks/useAuth'
import { useMessage } from '@/requests/index'
import ChevronLeftSVG from '@/svgs/chevron-left.svg'
import NotificationSVG from '@/svgs/notification.svg'
import type { Notification } from '@/types'
import { useMemo } from 'react'

export default function NotificationsPage() {
	const t = useTranslations('notifications')
	const router = useRouter()
	const isMobile = useMediaQuery('(max-width: 1024px)')
	const { userId } = useAuth()

	// 获取消息数据
	const { data: messages = [], isLoading } = useMessage()

	// 将 Message 数据转换为 Notification 格式
	const notifications: Notification[] = useMemo(() => {
		return messages.map(msg => ({
			id: String(msg.id || Date.now()),
			title: msg.title,
			content: msg.content,
			time: msg.createtime,
			read: false, // 后端没有提供已读状态，默认未读
			type: 'system' as const // 后端没有提供类型，默认系统消息
		}))
	}, [messages])

	// 格式化时间
	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		const now = new Date()
		const diff = now.getTime() - date.getTime()
		
		// 小于1小时显示分钟
		if (diff < 60 * 60 * 1000) {
			const minutes = Math.floor(diff / (60 * 1000))
			return minutes <= 0 ? t('justNow') : t('minutesAgo', { minutes })
		}
		
		// 小于24小时显示小时
		if (diff < 24 * 60 * 60 * 1000) {
			const hours = Math.floor(diff / (60 * 60 * 1000))
			return t('hoursAgo', { hours })
		}
		
		// 超过24小时显示具体日期
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		
		return `${year}/${month}/${day} ${hours}:${minutes}`
	}

	// 获取通知类型的显示文本
	const getNotificationTypeText = (type: Notification['type']) => {
		switch (type) {
			case 'system': return t('typeSystem')
			case 'order': return t('typeOrder')
			case 'promotion': return t('typePromotion')
			case 'security': return t('typeSecurity')
			default: return t('typeSystem')
		}
	}

	// 手机模式渲染
	if (isMobile) {
		return (
			<div className='min-h-screen pb-24'>
				{/* Header */}
				<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]/80 pb-4 backdrop-blur-sm'>
					<button
						onClick={() => router.back()}
						className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10'
					>
						<ChevronLeftSVG />
					</button>
					<h1 className='flex-1 text-center text-lg font-semibold text-white/80 pr-10'>{t('title')}</h1>
				</div>

				<div className='px-4 py-6'>
					{isLoading ? (
						// 加载状态
						<div className='flex flex-col items-center justify-center py-20'>
							<div className='h-8 w-8 animate-spin rounded-full border-2 border-[#6741FF] border-t-transparent' />
							<p className='mt-4 text-sm text-white/60'>{t('loading')}</p>
						</div>
					) : notifications.length === 0 ? (
						// 空状态
						<div className='flex flex-col items-center justify-center py-20'>
							<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5'>
								<NotificationSVG className='text-white/40' />
							</div>
							<h3 className='mb-2 text-sm font-medium text-white/80'>{t('noNotifications')}</h3>
							{/* <p className='text-center text-sm text-white/60'>{t('noNotificationsDesc')}</p> */}
						</div>
					) : (
						// 通知列表
						<div className='space-y-3'>
							{notifications.map((notification) => (
								<div
									key={notification.id}
									className={`rounded-xl border p-4 transition-colors ${
										notification.read
											? 'border-[#303030] bg-white/5'
											: 'border-[#6741FF]/20 bg-[#6741FF]/5'
									}`}
								>
									<div className='mb-2 flex items-start justify-between'>
										<div className='flex-1'>
											<h4 className='text-sm font-medium text-white/80'>
												{notification.title}
											</h4>
											<p className='mt-1 text-xs text-[#6741FF]'>
												{getNotificationTypeText(notification.type)}
											</p>
										</div>
										{!notification.read && (
											<div className='h-2 w-2 rounded-full bg-[#6741FF]' />
										)}
									</div>
									<div 
										className='mb-3 text-sm text-white/60 leading-relaxed break-words overflow-hidden [&_p]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2'
										dangerouslySetInnerHTML={{ __html: notification.content }}
									/>
									<p className='text-xs text-white/40'>
										{formatTime(notification.time)}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		)
	}

	// PC模式渲染
	return (
		<div className='container mx-auto max-w-4xl px-6 py-8'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold text-white'>{t('title')}</h1>
				{/* <p className='mt-2 text-white/60'>{t('description')}</p> */}
			</div>

			{isLoading ? (
				// 加载状态
				<div className='rounded-xl border border-[#303030] bg-white/5 p-12'>
					<div className='flex flex-col items-center justify-center text-center'>
						<div className='h-12 w-12 animate-spin rounded-full border-2 border-[#6741FF] border-t-transparent' />
						<p className='mt-6 text-white/60'>{t('loading')}</p>
					</div>
				</div>
			) : notifications.length === 0 ? (
				// 空状态
				<div className='rounded-xl border border-[#303030] bg-white/5 p-12'>
					<div className='flex flex-col items-center justify-center text-center'>
						<div className='mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/5'>
							<NotificationSVG className='text-white/40' />
						</div>
						<h2 className='mb-3 text-md text-white/80'>{t('noNotifications')}</h2>
						{/* <p className='max-w-md text-white/60'>{t('noNotificationsDesc')}</p> */}
					</div>
				</div>
			) : (
				// 通知列表
				<div className='space-y-4'>
					{notifications.map((notification) => (
						<div
							key={notification.id}
							className={`rounded-xl border p-6 transition-colors ${
								notification.read
									? 'border-[#303030] bg-white/5'
									: 'border-[#6741FF]/20 bg-[#6741FF]/5'
							}`}
						>
							<div className='flex items-start justify-between'>
								<div className='flex-1'>
									<div className='mb-2 flex items-center gap-3'>
										<h3 className='text-lg font-medium text-white/80'>
											{notification.title}
										</h3>
										<span className='rounded-full bg-[#6741FF]/20 px-2 py-1 text-xs text-[#6741FF]'>
											{getNotificationTypeText(notification.type)}
										</span>
										{!notification.read && (
											<div className='h-2 w-2 rounded-full bg-[#6741FF]' />
										)}
									</div>
									<div 
										className='mb-4 text-white/70 leading-relaxed break-words overflow-hidden [&_p]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2'
										dangerouslySetInnerHTML={{ __html: notification.content }}
									/>
									<p className='text-sm text-white/50'>
										{formatTime(notification.time)}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
