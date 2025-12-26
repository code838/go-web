'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import LoadMoreBtn from '@/components/load-more-btn'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'
import OrderDetailDialog from '@/components/order-detail-dialog'

export default function LuckyRecordsPage() {
  const t = useTranslations('luckyRecords')
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 获取幸运订单列表 (type=0)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: 0 // 幸运订单
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

  const handleLoadMore = () => {
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  const tableGridClass =
    'grid grid-cols-[minmax(150px,1.6fr)_minmax(155px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(170px,1.3fr)_minmax(160px,1.4fr)]'

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-1'>
        <h2 className='text-base font-medium text-white/80'>{t('title')}</h2>
      </div>

      {/* Table Container */}
      <div className='flex flex-col gap-3'>
        {/* Table */}
        <div className='bg-card flex flex-col rounded-xl overflow-hidden'>
          {/* Table Header */}
          <div className={`${tableGridClass} rounded-t-xl bg-white/5`}>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center leading-tight'>{t('orderNumber')}</span>
            </div>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center truncate leading-tight'>{t('product')}</span>
            </div>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center truncate leading-tight'>{t('productValue')}</span>
            </div>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center truncate leading-tight'>{t('luckyCode')}</span>
            </div>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center leading-tight break-words whitespace-normal'>
                {t('quantity')}
              </span>
            </div>
            <div className='flex h-14 items-center justify-center px-4'>
              <span className='text-secondary text-sm font-medium text-center truncate leading-tight'>{t('time')}</span>
            </div>
          </div>

          {/* Table Body */}
          {isLoading && records.length === 0 ? (
            <ContentLoading text={t('loading')} className='py-10' />
          ) : records.length === 0 ? (
            <div className='flex items-center justify-center py-10'>
              <span className='text-sm text-white/60'>暂无幸运记录</span>
            </div>
          ) : (
            records.map((record, index) => (
              <div
                key={record.orderId}
                onClick={() => setSelectedOrder(record)}
                className={`${tableGridClass} cursor-pointer border-[#0E0E10] transition-colors hover:bg-white/5 ${
                  index !== records.length - 1 ? 'border-b' : ''
                } ${index === records.length - 1 ? 'rounded-b-xl' : ''}`}>
                {/* Order Number */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <span className='text-sm font-medium text-white/80 text-center leading-tight'>{truncateOrderId(record.orderId)}</span>
                </div>

                {/* Product */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <div className='flex items-center justify-center gap-1 min-w-0 max-w-full'>
                    <img 
                      src='/images/examples/eth.png' 
                      alt='' 
                      className='h-6 w-6 flex-shrink-0 rounded-full border border-white/10' 
                    />
                    <span className='text-sm font-medium text-white/80 truncate min-w-0 leading-tight'>
                      {record.productName || '-'}
                    </span>
                  </div>
                </div>

                {/* Product Value */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <span className='text-sm font-medium text-[#E5AD54] text-center truncate leading-tight'>{record.productValue || '-'}</span>
                </div>

                {/* Lucky Code */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <span className='text-sm font-medium text-[#67E8F2] text-center truncate leading-tight'>
                    {record.coding || '-'}
                  </span>
                </div>

                {/* Quantity */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <span className='text-sm font-medium text-white/80 text-center truncate flex-shrink-0 leading-tight'>x {record.num || 0}</span>
                </div>

                {/* Time */}
                <div className='flex h-14 items-center justify-center px-4 min-w-0'>
                  <span className='text-xs font-medium text-white/80 text-center whitespace-nowrap truncate leading-tight'>{formatTime(record.createTime)}</span>
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
      </div>

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

