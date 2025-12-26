'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useHomeBuys } from '@/requests'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import Account from './account'
import { IMG_BASE_URL } from '@/consts'
import { LoadingSpinner } from '@/components/loading-spinner'

// 自动滚动列表组件 - 无缝循环
interface AutoScrollListProps {
	children: React.ReactNode
	height: string
	duration?: number // 滚动完一轮的时间（秒）
}

function AutoScrollList({ children, height, duration = 20 }: AutoScrollListProps) {
	const [isPaused, setIsPaused] = useState(false)
	const contentWrapperRef = useRef<HTMLDivElement>(null)

	return (
		<div className='relative mt-3'>
			<style dangerouslySetInnerHTML={{
				__html: `
					@keyframes scrollUpAnimation {
						0% {
							transform: translateY(0);
						}
						100% {
							transform: translateY(-50%);
						}
					}
				`
			}} />
			
			<div className={`scrollbar-none ${height} overflow-hidden`}>
				{/* 使用 CSS 动画实现无缝滚动 */}
				<div
					ref={contentWrapperRef}
					style={{
						animation: isPaused ? 'none' : `scrollUpAnimation ${duration}s linear infinite`,
					}}
				>
					<div>{children}</div>
					<div aria-hidden="true">{children}</div>
				</div>
			</div>
			
			{/* 鼠标悬停区域 */}
			<div 
				className="absolute inset-0 z-10"
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
			/>
			
			<div className='from-panel pointer-events-none absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b to-transparent z-20' />
			<div className='from-panel pointer-events-none absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t to-transparent z-20' />
		</div>
	)
}

export default function Aside() {
	const { data: homeBuys, isLoading } = useHomeBuys()
	const t = useTranslations('aside')
	const router = useRouter()

	const formatTimeAgo = (minutes: number) => {
		if (minutes < 1) return t('justNow')
		if (minutes < 60) return t('minutesAgo', { minutes: Math.floor(minutes) })
		const hours = Math.floor(minutes / 60)
		if (hours < 24) return t('hoursAgo', { hours })
		const days = Math.floor(hours / 24)
		return t('daysAgo', { days })
	}

	return (
		<aside className='hidden w-full shrink-0 flex-col border-r lg:flex lg:h-screen lg:w-[300px]'>
			<div className='flex h-[120px] items-center justify-center border-b bg-[#17181F]'>
				<Link href='/' className='flex items-center gap-3 text-xl font-bold'>
					<img className='h-10 w-10' src='/favicon.png' />
					1U.VIP
				</Link>
			</div>
			<div className='bg-panel scrollbar-none flex flex-1 flex-col overflow-auto'>
				<section className='px-4 py-6'>
					<h3 className='text-brand text-sm'>{t('winnerTitle')}</h3>

					{isLoading ? (
						<div className='h-[200px] flex items-center justify-center'>
							<LoadingSpinner size='md' />
						</div>
					) : (
						<AutoScrollList height='h-[200px]' duration={60}>
							<div className='space-y-3'>
								{homeBuys?.owners && homeBuys.owners.length > 0 ? (
									homeBuys.owners.map((winner, idx) => (
										<div key={idx} className='text-secondary relative flex items-center gap-3 overflow-hidden rounded-xl bg-white/5 p-3 text-xs py-2'>
											<img
												// src={winner.image || '/favicon.png'}
												src={`${winner?.image?(IMG_BASE_URL+winner?.image):'/images/examples/eth.png'}`}
												alt={winner.nickName}
												className='h-9 w-9 rounded-full bg-white/10 object-cover'
											/>

											<div className='mr-10 flex-1 text-xs'>
												{t('congratsUser')} <span className='text-brand font-medium'>{winner.nickName}</span> {t('wonPrize')}{' '}
												<span className='text-gold font-medium'>${winner.productValue}</span> {t('product')}
											</div>

											<div className='absolute top-0 right-0 rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/30'>
												{formatTimeAgo(winner.time)}
											</div>

											{/* <button 
											onClick={() => router.push(`/product/${winner.productId}?serialNumber=${winner.serialNumber}&winner=true`)}
											className='text-brand text-[10px] font-medium hover:opacity-80 mt-auto mb-auto'
										>
											{t('view')}
										</button> */}
											<div
												className='text-brand text-[10px] font-medium hover:opacity-80 mt-auto mb-auto'
											></div>
										</div>
									))
								) : (
									<div className='text-secondary text-center text-xs'>{t('noWinners')}</div>
								)}
							</div>
						</AutoScrollList>
					)}
				</section>

				<section className='px-4 py-6'>
					<h3 className='text-brand text-sm'>{t('buyingTitle')}</h3>

					{isLoading ? (
						<div className='h-[200px] flex items-center justify-center'>
							<LoadingSpinner size='md' />
						</div>
					) : (
						<AutoScrollList height='h-[200px]' duration={60}>
							<div className='space-y-3'>
								{homeBuys?.buys && homeBuys.buys.length > 0 ? (
									homeBuys.buys.map((buyer, idx) => (
										<div key={idx} className='text-secondary relative flex items-center gap-3 overflow-hidden rounded-xl bg-white/5 p-3 text-xs py-2'>
											<img
												// src={buyer.image || '/favicon.png'}
												src={`${buyer?.image?(IMG_BASE_URL+buyer?.image):'/images/examples/eth.png'}`}
												alt={buyer.nickName}
												className='h-9 w-9 rounded-full bg-white/10 object-cover'
											/>
											<div className='mr-10 flex-1 text-xs'>
												{t('user')} <span className='text-brand font-medium'>{buyer.nickName}</span> {t('purchased')}{' '}
												<span className='font-medium text-yellow-400'>{buyer.productName}</span> {t('success')}
											</div>

											<div className='absolute top-0 right-0 rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/30'>
												{formatTimeAgo(buyer.time)}
											</div>
											<div
												className='text-brand text-[10px] font-medium hover:opacity-80 mt-auto mb-auto'
											></div>
										</div>
									))
								) : (
									<div className='text-secondary text-center text-xs'>{t('noBuyers')}</div>
								)}
							</div>
						</AutoScrollList>
					)}
				</section>

				<Account />
			</div>
		</aside>
	)
}

