'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import LoadMoreBtn from '@/components/load-more-btn'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import TooltipSpan from '@/components/tooltip'
import OrderDetailDialog from '@/components/order-detail-dialog'

export default function SwapRecordsPage() {
  const t = useTranslations()
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 获取闪兑订单列表 (type=4)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: 4 // 闪兑订单
  })

  // 累积所有加载的订单
  const [allRecords, setAllRecords] = useState<Order[]>([])

  // 当获取到新数据时，累积订单
  useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      if (pageNo === 1) {
        setAllRecords(ordersData)
      } else {
        setAllRecords(prev => [...prev, ...ordersData])
      }
    }
  }, [ordersData, pageNo])

  const records = allRecords

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
  const truncateOrderId = (orderId: string, startLen = 8, endLen = 6) => {
    if (orderId.length <= startLen + endLen) {
      return orderId
    }
    return `${orderId.slice(0, startLen)}...${orderId.slice(-endLen)}`
  }

  // API 状态: 1=待支付, 2=已支付, 3=订单取消
  const getStatusLabel = (status: number) => {
    const statusMap = {
      1: t('swapRecords.statusProcessing'),
      2: t('swapRecords.statusCompleted'),
      3: t('swapRecords.statusFailed')
    }
    return statusMap[status as keyof typeof statusMap] || '-'
  }

  const handleLoadMore = () => {
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-[10px]'>
        <h2 className='text-base font-medium text-white/80'>{t('swapRecords.title')}</h2>
      </div>

      {/* Table */}
      <div className='bg-card flex flex-col rounded-xl'>
        {/* Table Header */}
        <div className='grid grid-cols-[minmax(100px,1fr)_minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(100px,1fr)_minmax(160px,1.6fr)] items-center rounded-t-xl bg-white/5'>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.sourceAsset')}</span>
          </div>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.sourceAmount')}</span>
          </div>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.targetAsset')}</span>
          </div>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.targetAmount')}</span>
          </div>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.status')}</span>
          </div>
          <div className='flex items-center justify-center px-3 py-3'>
            <span className='text-secondary text-sm font-medium'>{t('swapRecords.time')}</span>
          </div>
        </div>

        {/* Table Body */}
        {isLoading && records.length === 0 ? (
          <ContentLoading text={t('swapRecords.loading')} className='py-10' />
        ) : records.length === 0 ? (
          <div className='flex items-center justify-center py-10'>
            <span className='text-sm text-white/60'>{t('swapRecords.noSwapRecords')}</span>
          </div>
        ) : (
          records.map((record, index) => (
            <div
              key={record.orderId}
              onClick={() => setSelectedOrder(record)}
              className={`grid cursor-pointer grid-cols-[minmax(100px,1fr)_minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(100px,1fr)_minmax(160px,1.6fr)] items-center border-[#0E0E10] transition-colors hover:bg-white/5 ${
                index !== records.length - 1 ? 'border-b' : ''
              } ${index === records.length - 1 ? 'rounded-b-xl' : ''}`}>
              {/* Source Asset */}
              <div className='flex items-center justify-center px-3 py-4'>
                <span className='text-sm font-medium text-white/80'>{record.coinName || '-'}</span>
              </div>

              {/* Source Amount */}
              <div className='flex items-center justify-center px-3 py-4'>
                <TooltipSpan value={record.amount || '-'} tooltipWidth={200}>
                  <span className='block max-w-full truncate text-sm font-medium text-white/80'>
                    {record.num || '-'}
                  </span>
                </TooltipSpan>
              </div>

              {/* Target Asset */}
              <div className='flex items-center justify-center px-3 py-4'>
                <span className='text-sm font-medium text-white/80'>{record.toAssert || '-'}</span>
              </div>

              {/* Target Amount */}
              <div className='flex items-center justify-center px-3 py-4'>
                <TooltipSpan value={record.recvAmount || '-'} tooltipWidth={200}>
                  <span className='block max-w-full truncate text-sm font-medium text-white/80'>
                    {record.recvAmount || '-'}
                  </span>
                </TooltipSpan>
              </div>

              {/* Status */}
              <div className='flex items-center justify-center px-3 py-4'>
                <span className='text-sm font-medium text-white/80'>{getStatusLabel(record.status)}</span>
              </div>

              {/* Time */}
              <div className='flex items-center justify-center px-3 py-4'>
                <span className='text-sm font-medium text-white/80'>{formatTime(record.createTime)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className='flex justify-center gap-[10px]'>
          <LoadMoreBtn onClick={handleLoadMore} disabled={isLoading} />
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


