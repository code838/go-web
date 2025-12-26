'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChevronLeftIcon from '@/svgs/chevron-left.svg'
import Image from 'next/image'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'

interface InviteRecord {
	id: string
	userId: string
	username: string
	inviteTime: string
}

export default function InviteRecordsMobilePage() {
	const t = useTranslations('inviteRecordsMobile')
	const router = useRouter()
	const searchParams = useSearchParams()
	const { userInfo } = useAuth()
	const initialTab = searchParams.get('tab') === 'commission' ? 'commission' : 'invite'
	const [activeTab, setActiveTab] = useState<'invite' | 'commission'>(initialTab)

	// Mock invite records data
	const [inviteRecords] = useState<InviteRecord[]>([
		{
			id: '1',
			userId: '#15318',
			username: 'Darken',
			inviteTime: '2025/12/30 12:31:12',
		},
		{
			id: '2',
			userId: '#15319',
			username: 'Darken',
			inviteTime: '2025/12/30 12:31:12',
		},
	])

	const [pageNo, setPageNo] = useState(1)
	const pageSize = 20

	// 获取返佣订单列表
	const { data: ordersData, isLoading } = useOrderList({
		userId: userInfo?.userId || 0,
		pageNo,
		pageSize,
		type: 5, // 返佣订单
	})

	// 累积所有加载的订单
	const [allRecords, setAllRecords] = useState<Order[]>([])

	// 当获取到新数据时，累积订单
	useMemo(() => {
		if (ordersData && ordersData.length > 0) {
			if (pageNo === 1) {
				setAllRecords(ordersData)
			} else {
				setAllRecords((prev) => [...prev, ...ordersData])
			}
		}
	}, [ordersData, pageNo])

	const commissionRecords = allRecords

	// 格式化时间
	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
	}

	// 获取返佣类型标签
	const getTypeLabel = (returnType?: string) => {
		if (returnType === '1') return t('typeRegister')
		if (returnType === '2') return t('typePurchase')
		return '-'
	}

	return (
		<div className='flex min-h-screen flex-col gap-6 pb-6'>
			{/* Header */}
			<div className='flex items-center gap-2'>
				<button onClick={() => router.back()} className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5'>
					<ChevronLeftIcon />
				</button>
				<h1 className='text-primary text-base font-medium'>{t('title')}</h1>
			</div>

			{/* Tabs */}
			<div className='flex gap-2 border-b border-white/5'>
				<button
					onClick={() => setActiveTab('invite')}
					className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${
						activeTab === 'invite' ? 'border-white text-primary' : 'border-transparent text-secondary'
					}`}
				>
					{t('inviteRecords')}
				</button>
				<button
					onClick={() => setActiveTab('commission')}
					className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${
						activeTab === 'commission' ? 'border-white text-primary' : 'border-transparent text-secondary'
					}`}
				>
					{t('commissionRecords')}
				</button>
			</div>

			{/* Content */}
			<div className='flex flex-col gap-3'>
				{activeTab === 'invite' ? (
					// Invite Records
					inviteRecords.length === 0 ? (
						<div className='flex items-center justify-center py-10'>
							<span className='text-secondary text-sm'>{t('noInviteRecords')}</span>
						</div>
					) : (
						inviteRecords.map((record) => (
							<div key={record.id} className='bg-card flex items-center gap-3 rounded-xl p-4'>
								{/* Avatar */}
								<div className='relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/10'>
									<Image src='/images/examples/eth.png' alt={record.username} fill className='object-cover' />
								</div>

								{/* Info */}
								<div className='flex flex-1 flex-col gap-1'>
									<span className='text-primary text-sm'>{record.username}</span>
									<span className='text-secondary text-xs'>{record.inviteTime}</span>
								</div>

								{/* Points */}
								<div className='text-primary text-sm font-medium'>+1 {t('points')}</div>
							</div>
						))
					)
				) : // Commission Records
				isLoading && commissionRecords.length === 0 ? (
					<ContentLoading text={t('loading')} className='py-10' />
				) : commissionRecords.length === 0 ? (
					<div className='flex items-center justify-center py-10'>
						<span className='text-secondary text-sm'>{t('noCommissionRecords')}</span>
					</div>
				) : (
					commissionRecords.map((record) => (
						<div key={record.orderId} className='bg-card flex items-center gap-3 rounded-xl p-4'>
							{/* Avatar */}
							<div className='relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/10'>
								<Image src='/images/examples/eth.png' alt={record.inviteUserName || 'User'} fill className='object-cover' />
							</div>

							{/* Info */}
							<div className='flex flex-1 flex-col gap-1'>
								<span className='text-primary text-sm'>{getTypeLabel(record.returnType)}</span>
								<span className='text-secondary text-xs'>{formatTime(Number(record.createTime))}</span>
							</div>

							{/* Points */}
							<div className='text-primary text-sm font-medium'>
								+{record.amount || '0'} {t('points')}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	)
}

