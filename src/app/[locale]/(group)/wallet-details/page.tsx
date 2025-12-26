'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import LoadMoreBtn from '@/components/load-more-btn'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import TooltipSpan from '@/components/tooltip'
import OrderDetailDialog from '@/components/order-detail-dialog'

export default function WalletDetailsPage() {
  const t = useTranslations()
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 获取所有订单列表 (不传 type，查询所有记录)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize
    // 不传 type 参数，获取所有类型的订单
  })

  // 累积所有加载的订单
  const [allDetails, setAllDetails] = useState<Order[]>([])

  // 当获取到新数据时，累积订单
  useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      if (pageNo === 1) {
        setAllDetails(ordersData)
      } else {
        setAllDetails(prev => [...prev, ...ordersData])
      }
    }
  }, [ordersData, pageNo])

  // 监听数据加载完成，重置加载更多状态
  useEffect(() => {
    if (!isLoading && isLoadingMore) {
      setIsLoadingMore(false)
    }
  }, [isLoading, isLoadingMore])

  const details = allDetails

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }

  // 截取订单号显示
  const truncateOrderId = (orderId: string, startLen = 6, endLen = 4) => {
    if (!orderId || orderId.length <= startLen + endLen) {
      return orderId || '-'
    }
    return `${orderId.slice(0, startLen)}...${orderId.slice(-endLen)}`
  }

  // 获取订单类型标签 (type: 0=幸运订单, 1=云购订单, 2=充值, 3=提现, 4=闪兑, 5=返佣, 6=免费领币)
  const getTypeLabel = (type: number) => {
    const typeMap: Record<number, string> = {
      0: t('walletDetails.typeLucky'),
      1: t('walletDetails.typePurchase'),
      2: t('walletDetails.typeRecharge'),
      3: t('walletDetails.typeWithdraw'),
      4: t('walletDetails.typeSwap'),
      5: t('walletDetails.typeCommission'),
      6: t('walletDetails.typeFreeCoins')
    }
    return typeMap[type] || '-'
  }

  // 根据订单类型显示金额 (type: 0=幸运订单, 1=云购, 2=充值, 3=提现, 4=闪兑, 5=返佣, 6=免费领币)
  const getAmountDisplay = (order: Order) => {
    const type = order.type
    // 充值(2)、闪兑(4)、返佣(5)、免费领币(6) 显示为正数（绿色）
    // 提现(3)、云购(1)、幸运订单(0) 显示为负数（红色）
    const isPositive = type === 2 || type === 4 || type === 5 || type === 6
    const sign = isPositive ? '+' : '-'
    const colorClass = isPositive ? 'text-[#1AF578]' : 'text-[#F75353]'
    
    // 闪兑订单：显示目标币种（toAssert）和到账金额（recvAmount）
    // 返佣订单：显示积分单位
    // 其他订单：优先使用 recvAmount，否则使用 amount，币种为 coinName
    let amount: string
    let coinName: string
    
    if (type === 4) {
      // 闪兑：显示目标币种
      amount = order.recvAmount || order.amount || '0'
      coinName = order.toAssert || 'USDT'
    } else if (type === 5) {
      // 返佣：显示积分
      amount = order.amount || '0'
      coinName = t('walletDetails.pointsUnit')
    } else {
      // 其他类型：显示原币种
      amount = order.recvAmount || order.amount || '0'
      coinName = order.coinName || 'USDT'
    }

    return (
      <span className={`text-sm font-medium ${colorClass}`}>
        {sign}{amount} {coinName}
      </span>
    )
  }

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-[10px]'>
        <h2 className='text-base font-medium text-white/80'>{t('walletDetails.title')}</h2>
      </div>

      {/* Table */}
      <div className='bg-card flex flex-col rounded-xl'>
        {/* Table Header */}
        <div className='flex justify-stretch rounded-t-xl bg-white/5'>
          <div className='flex flex-1 items-center justify-center px-1 py-2'>
            <span className='text-secondary text-sm font-medium'>{t('walletDetails.orderId')}</span>
          </div>
          <div className='flex flex-1 items-center justify-center px-1 py-2'>
            <span className='text-secondary text-sm font-medium'>{t('walletDetails.type')}</span>
          </div>
          <div className='flex flex-1 items-center justify-center px-1 py-2'>
            <span className='text-secondary text-sm font-medium'>{t('walletDetails.amount')}</span>
          </div>
          <div className='flex flex-1 items-center justify-center px-1 py-2'>
            <span className='text-secondary text-sm font-medium'>{t('walletDetails.time')}</span>
          </div>
        </div>

        {/* Table Body */}
        {isLoading && details.length === 0 ? (
          <ContentLoading text={t('walletDetails.loading')} className='py-10' />
        ) : details.length === 0 ? (
          <div className='flex items-center justify-center py-10'>
            <span className='text-sm text-white/60'>{t('walletDetails.noData')}</span>
          </div>
        ) : (
          details.map((detail, index) => (
            <div
              key={detail.orderId}
              onClick={() => setSelectedOrder(detail)}
              className={`flex cursor-pointer justify-stretch py-4 transition-colors hover:bg-white/5 ${index === details.length - 1 ? 'rounded-b-xl' : ''}`}>
              {/* Order ID */}
              <div className='flex flex-1 items-center justify-center gap-1 px-1 py-2'>
                <TooltipSpan value={detail.orderId} tooltipWidth={300}>
                  <span className='text-sm font-medium text-white/80'>{truncateOrderId(detail.orderId)}</span>
                </TooltipSpan>
              </div>

              {/* Type */}
              <div className='flex flex-1 items-center justify-center gap-1 px-1 py-2'>
                <span className='text-sm font-medium text-white/80'>{getTypeLabel(detail.type)}</span>
              </div>

              {/* Amount */}
              <div className='flex flex-1 items-center justify-center gap-1 px-1 py-2'>
                {getAmountDisplay(detail)}
              </div>

              {/* Time */}
              <div className='flex flex-1 items-center justify-center px-1 py-2'>
                <span className='text-xs font-medium text-white/80'>{formatTime(detail.createTime)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className='flex justify-center gap-[10px]'>
          <LoadMoreBtn onClick={handleLoadMore} disabled={isLoadingMore} />
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

