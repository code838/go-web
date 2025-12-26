'use client'

import { use, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useOrderDetail, useCancelOrder, usePayOrder, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import ChevronLeftSVG from '@/svgs/chevron-left.svg'
import CopyIconSVG from '@/svgs/copy-icon.svg'
import StatusDoneSVG from '@/svgs/status/status-done.svg'
import StatusPendingSVG from '@/svgs/status/status-pending.svg'
import StatusCancelSVG from '@/svgs/status/status-cancel.svg'
import StatusPayingSVG from '@/svgs/status/status-paying.svg'
import { toast } from '@/components/toast'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

type OrderDetailPageProps = {
	params: Promise<{ id: string }>
}

export default function OrderDetailPage(props: OrderDetailPageProps) {
	const t = useTranslations('orderDetail')
	const router = useRouter()
	const { userId } = useAuth()
	const searchParams = useSearchParams()
	const params = use(props.params)
	const orderId = params.id
	const queryClient = useQueryClient()
	const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [showPayDialog, setShowPayDialog] = useState(false)
	
	// 从 URL 查询参数获取订单类型
	const orderType = searchParams?.get('type')
	// 只有类型为 0（幸运记录）时，isOwner 才为 true
	const isOwner = orderType == '0'
	
	// 处理返回逻辑
	const handleBack = () => {
		router.back()
	}

	// 获取订单详情
	const { data: order, isLoading, error } = useOrderDetail({
		userId: userId ? Number(userId) : 0,
		orderId,
		isOwner
	})

	// 取消订单
	const cancelOrderMutation = useCancelOrder()
	
	// 订单支付
	const payOrderMutation = usePayOrder()

	// 复制到剪贴板
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(t('copySuccess', { item: label }))
		} catch (err) {
			toast.error(t('copyFailed'))
		}
	}

	// 获取状态文本和样式
	const getStatusInfo = (status: number | undefined | null) => {
		switch (status) {
			case 1:
				return { text: t('statusPending'), color: 'text-yellow-400' }
			case 2:
				return { text: t('statusCompleted'), color: 'text-white/50' }
			case 3:
				return { text: t('statusCancelled'), color: 'text-red-400' }
			default:
				return { text: t('statusUnknown'), color: 'text-[#6E6E70]' }
		}
	}

	// 获取状态图标
	const getStatusIcon = (status: number | undefined | null) => {
		switch (status) {
			case 1:
				return <StatusPendingSVG  />
			case 2:
				return <StatusDoneSVG />
			case 3:
				return <StatusCancelSVG />
			default:
				return <div className='w-2 h-2 rounded-full bg-[#6E6E70]' />
		}
	}

	// 获取订单类型名称
	const getOrderTypeName = (type: number | undefined) => {
		switch (type) {
			case 1: return t('shopping')
			case 2: return t('recharge')
			case 3: return t('withdraw')
			case 4: return t('swap')
			case 0: return t('winning')
			case 5: return t('commission')
			case 6: return t('freeCoins')
			default: return t('other')
		}
	}

	// 格式化时间
	const formatTime = (timestamp: number | undefined | null) => {
		if (!timestamp) return '--'
		const date = new Date(timestamp)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
	}

	// 截短地址或哈希
	const truncateAddress = (address: string | undefined | null) => {
		if (!address) return '--'
		if (address.length <= 12) return address
		return `${address.slice(0, 6)}...${address.slice(-4)}`
	}

	// 处理取消订单
	const handleCancelOrder = async () => {
		if (!userId || !orderId) return
		
		try {
			await cancelOrderMutation.mutateAsync({
				userId: Number(userId),
				orderId
			})
			
			toast.success(t('cancelSuccess'))
			setShowCancelDialog(false)
			
			// 刷新订单详情
			queryClient.invalidateQueries({ queryKey: ['order-detail', Number(userId), orderId, isOwner] })
			
			// 延迟返回上一页
			setTimeout(() => {
				handleBack()
			}, 1000)
		} catch (err: any) {
			toast.error(err?.response?.data?.msg || err?.message || t('cancelFailed'))
		}
	}

	// 处理去支付
	const handlePayOrder = async () => {
		if (!userId || !orderId) return
		
		try {
			await payOrderMutation.mutateAsync({
				userId: Number(userId),
				orderId
			})
			
			toast.success(t('paySuccess'))
			setShowPayDialog(false)
			
			// 刷新订单详情
			queryClient.invalidateQueries({ queryKey: ['order-detail', Number(userId), orderId, isOwner] })
		} catch (err: any) {
			toast.error(err?.response?.data?.msg || err?.message || t('payFailed'))
		}
	}

	// 显示加载状态：正在加载或者用户信息还未就绪
	if (isLoading || !userId) {
		return (
			<div className='min-h-screen  flex items-center justify-center'>
				<ContentLoading />
			</div>
		)
	}

	// 加载完成后，如果有错误或没有订单数据，显示订单不存在
	if (error || !order) {
		return (
			<div className='flex min-h-screen flex-col pb-24 lg:pb-8'>
				{/* Header */}
				<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]/80 pb-4 backdrop-blur-sm'>
					<button
						onClick={handleBack}
						className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10'
					>
						<ChevronLeftSVG />
					</button>
					<h1 className='flex-1 text-center text-lg font-medium text-white pr-10'>{t('title')}</h1>
				</div>

				<div className='flex flex-1 flex-col items-center justify-center py-20'>
					<div className='text-white/60 text-center'>
						<div className='text-lg mb-2'>{t('orderNotFound')}</div>
						<div className='text-sm'>{t('orderNotFoundDesc')}</div>
					</div>
				</div>
			</div>
		)
	}

	const statusInfo = getStatusInfo(order.status)

	return (
		<div className='flex min-h-screen flex-col pb-24 lg:pb-8'>
			{/* Header */}
			<div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]/80 pb-4 backdrop-blur-sm'>
				<button
					onClick={handleBack}
					className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10'
				>
					<ChevronLeftSVG />
				</button>
				<h1 className='flex-1 text-center text-lg font-medium text-white pr-9'>{t('title')}</h1>
			</div>

			<div className='px-4 py-6 space-y-8'>
				{/* 金额和状态 */}
				<div className='flex flex-col items-center text-center space-y-1'>
					<div className='text-[#6E6E70] text-sm'>{t('amount')}</div>
					<div className='text-[#E5AD54] text-3xl font-medium'>
						{Number(order.amount || 0).toFixed(2)} {order.coinName || 'USDT'}
					</div>
					<div className='flex items-center gap-1'>
						{getStatusIcon(order.status)}
						<span className={cn('text-sm', statusInfo.color)}>{statusInfo.text}</span>
					</div>
				</div>

				{/* 订单详情 */}
				<div className='rounded-xl bg-white/5 border border-[#303030] p-4 space-y-3'>
					{/* 类型 */}
					<DetailRow
						label={t('type')}
						value={getOrderTypeName(order.type)}
					/>

					{/* 订单号 */}
					<DetailRow
						label={t('orderNumber')}
						value={truncateAddress(order.orderId)}
						showCopy
						fullValue={order.orderId}
						onCopy={() => copyToClipboard(order.orderId || '', t('orderNumber'))}
					/>

					{/* 根据订单类型显示不同字段 */}
					{order.type === 3 && ( // 提现订单
						<>
							{/* 提现币种 */}
							<DetailRow
								label={t('withdrawCoin')}
								value={order.coinName || 'USDT'}
							/>

							{/* 提现金额 */}
							<DetailRow
								label={t('withdrawAmount')}
								value={`${Number(order.amount || 0).toFixed(2)} ${order.coinName || 'USDT'}`}
								valueColor='text-[#E5AD54]'
							/>

							{/* 手续费 */}
							<DetailRow
								label={t('fee')}
								value={`${Number(order.fee || 0).toFixed(2)} ${order.coinName || 'USDT'}`}
								valueColor='text-[#E5AD54]'
							/>

							{/* 到账金额 */}
							<DetailRow
								label={t('receivedAmount')}
								value={`${(Number(order.amount || 0) - Number(order.fee || 0)).toFixed(2)} ${order.coinName || 'USDT'}`}
								valueColor='text-[#E5AD54]'
							/>

							{/* 网络 */}
							<DetailRow
								label={t('network')}
								value={order.network || 'Ethereum'}
							/>

							{/* Hash */}
							{order.hash && (
								<DetailRow
									label={t('hash')}
									value={truncateAddress(order.hash)}
									showCopy
									fullValue={order.hash}
									onCopy={() => copyToClipboard(order.hash || '', t('hash'))}
								/>
							)}

							{/* 地址 */}
							{order.toAddress && (
								<DetailRow
									label={t('address')}
									value={truncateAddress(order.toAddress)}
									showCopy
									fullValue={order.toAddress}
									onCopy={() => copyToClipboard(order.toAddress || '', t('address'))}
								/>
							)}
						</>
					)}

					{order.type === 2 && ( // 充值订单
						<>
							{/* 充值币种 */}
							<DetailRow
								label={t('rechargeCoin')}
								value={order.coinName || 'USDT'}
							/>

							{/* 充值金额 */}
							<DetailRow
								label={t('amount')}
								value={`${Number(order.amount || 0).toFixed(2)} ${order.coinName || 'USDT'}`}
								valueColor='text-[#E5AD54]'
							/>

							{/* 网络 */}
							<DetailRow
								label={t('network')}
								value={order.network || 'Ethereum'}
							/>

							{/* Hash */}
							{order.hash && (
								<DetailRow
									label={t('hash')}
									value={truncateAddress(order.hash)}
									showCopy
									fullValue={order.hash}
									onCopy={() => copyToClipboard(order.hash || '', t('hash'))}
								/>
							)}

							{/* 地址 */}
							{order.fromAddress && (
								<DetailRow
									label={t('address')}
									value={truncateAddress(order.fromAddress)}
									showCopy
									fullValue={order.fromAddress}
									onCopy={() => copyToClipboard(order.fromAddress || '', t('address'))}
								/>
							)}
						</>
					)}

					{order.type === 4 && ( // 闪兑订单
						<>
							{/* 消耗币种 */}
							<DetailRow
								label={t('consumeCoin')}
								value="积分"
							/>

							{/* 闪兑币种 */}
							<DetailRow
								label={t('swapCoin')}
								value={order.coinName || 'USDT'}
							/>

							{/* 消耗数量 */}
							<DetailRow
								label={t('consumeAmount')}
								value={`${Number(order.num || 0).toFixed(0)} 积分`}
							/>

							{/* 闪兑金额 */}
							<DetailRow
								label={t('swapAmount')}
								value={`${Number(order.amount || 0).toFixed(2)} ${order.coinName || 'USDT'}`}
								valueColor='text-[#E5AD54]'
							/>
						</>
					)}

					{order.type === 1 && ( // 云购订单
						<>
							{/* 商品名 */}
							<DetailRow
								label={t('productTitle')}
								value={order.products?.[0]?.productName || order.productName || '--'}
							/>

							{/* 商品价格 */}
							<DetailRow
								label={t('productPrice')}
								value={`${Number(order.price || 0).toFixed(0)} USDT`}
							/>

							{/* 数量 */}
							<DetailRow
								label={t('quantity')}
								value={`x ${order.num || '1'}`}
							/>

							{/* 总计 */}
							<DetailRow
								label={t('total')}
								value={`${Number(order.amount || 0).toFixed(0)} USDT`}
								valueColor='text-[#E5AD54]'
							/>
						</>
					)}

					{order.type === 0 && ( // 中奖订单
						<>
							{/* 商品名 */}
							<DetailRow
								label={t('productTitle')}
								value={order.products?.[0]?.productName || order.productName || '--'}
							/>

							{/* 商品价格 */}
							<DetailRow
								label={t('productPrice')}
								value={`${Number(order.price || 0).toFixed(0)} USDT`}
							/>

							{/* 中奖编码 */}
							{order.coding && (
								<DetailRow
									label={t('winningCode')}
									value={order.coding.toString()}
									valueColor='text-[#6741FF]'
								/>
							)}

							{/* 商品价值 */}
							<DetailRow
								label={t('productValue')}
								value={`${Number(order.productValue || 0).toFixed(0)} USDT`}
								valueColor='text-[#E5AD54]'
							/>

							{/* 中奖时间 */}
							{order.ownerTime && (
								<DetailRow
									label={t('winningTime')}
									value={formatTime(order.ownerTime)}
									valueColor='text-[#6741FF]'
								/>
							)}
						</>
					)}

					{/* 申请时间/时间 */}
					<DetailRow
						label={order.type === 1 || order.type === 2 || order.type === 4 ? t('time') : t('createTime')}
						value={formatTime(order.createTime)}
					/>

					{/* 完成时间 - 只有在已完成状态时显示 */}
					{order.status === 1 && order.finishTime && (
						<DetailRow
							label={t('completeTime')}
							value={formatTime(order.finishTime)}
							valueColor='text-[#6741FF]'
						/>
					)}
				</div>
			</div>

			{/* 待支付订单底部按钮 - 只有云购类型订单才显示 */}
			{order.status === 1 && order.type === 1 && (
				<div className='flex gap-3 bg-[#0E0E10] px-4 pb-8'>
					<button
						onClick={() => setShowCancelDialog(true)}
						disabled={cancelOrderMutation.isPending}
						className='flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{cancelOrderMutation.isPending ? t('cancelling') : t('cancelOrder')}
					</button>
					<button
						onClick={() => setShowPayDialog(true)}
						disabled={payOrderMutation.isPending}
						className='flex-1 h-12 rounded-xl bg-gradient-to-r from-[#6741FF] to-[#9D4FFF] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{payOrderMutation.isPending ? t('paying') : t('goPay')}
					</button>
				</div>
			)}

			{/* 取消订单确认对话框 */}
			{showCancelDialog && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
					<div className='w-full max-w-sm bg-[#1A1A1C] rounded-2xl p-6 space-y-4'>
						<h3 className='text-lg font-medium text-white text-center'>{t('confirmCancel')}</h3>
						<p className='text-sm text-white/60 text-center'>{t('cancelConfirmMessage')}</p>
						<div className='flex gap-3 pt-2'>
							<button
								onClick={() => setShowCancelDialog(false)}
								disabled={cancelOrderMutation.isPending}
								className='flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-white font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{t('cancel')}
							</button>
							<button
								onClick={handleCancelOrder}
								disabled={cancelOrderMutation.isPending}
								className='flex-1 h-11 rounded-xl bg-gradient-to-r from-[#6741FF] to-[#9D4FFF] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{cancelOrderMutation.isPending ? t('cancelling') : t('confirm')}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 支付确认对话框 */}
			{showPayDialog && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
					<div className='w-full max-w-sm bg-[#1A1A1C] rounded-2xl p-6 space-y-4'>
						<h3 className='text-lg font-medium text-white text-center'>{t('confirmPay')}</h3>
						<p className='text-sm text-white/60 text-center'>{t('payConfirmMessage')}</p>
						<div className='flex gap-3 pt-2'>
							<button
								onClick={() => setShowPayDialog(false)}
								disabled={payOrderMutation.isPending}
								className='flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-white font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{t('cancel')}
							</button>
							<button
								onClick={handlePayOrder}
								disabled={payOrderMutation.isPending}
								className='flex-1 h-11 rounded-xl bg-gradient-to-r from-[#6741FF] to-[#9D4FFF] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{payOrderMutation.isPending ? t('paying') : t('confirm')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// 详情行组件
interface DetailRowProps {
	label: string
	value: string
	valueColor?: string
	showCopy?: boolean
	fullValue?: string
	onCopy?: () => void
}

function DetailRow({ label, value, valueColor = 'text-white/80', showCopy = false, fullValue, onCopy }: DetailRowProps) {
	return (
		<div className='flex items-center justify-between'>
			<span className='text-sm text-white/80'>{label}</span>
			<div className='flex items-center gap-1'>
				<span className={cn('text-sm', valueColor)}>{value}</span>
				{showCopy && onCopy && (
					<button
						onClick={onCopy}
						className='p-1 hover:bg-white/10 rounded transition-colors'
					>
						<CopyIconSVG className='w-4 h-4 text-white' />
					</button>
				)}
			</div>
		</div>
	)
}
