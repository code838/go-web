'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import LoadMoreBtn from '@/components/load-more-btn'
import { useOrderList, type Order } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { ContentLoading } from '@/components/loading-spinner'

export default function CommissionDetailsPage() {
  const t = useTranslations('commissionDetails')
  const { userInfo } = useAuth()

  const [pageNo, setPageNo] = useState(1)
  const pageSize = 10

  // 获取返佣订单列表 (type=5)
  const { data: ordersData, isLoading } = useOrderList({
    userId: userInfo?.userId || 0,
    pageNo,
    pageSize,
    type: 5 // 返佣订单
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

  // 计算总佣金
  const totalCommission = records.reduce((sum, record) => {
    const amount = parseFloat(record.amount || '0')
    return sum + amount
  }, 0)

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

  // 获取返佣类型标签 (returnType: 1=注册, 2=云购)
  const getTypeLabel = (returnType?: string) => {
    if (returnType == '1') return t('typeRegister')
    if (returnType == '2') return t('typePurchase')
    return '-'
  }

  const handleLoadMore = () => {
    setPageNo(prev => prev + 1)
  }

  const hasMore = ordersData && ordersData.length === pageSize

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header with Title and Total */}
      <div className='flex items-center justify-between gap-[10px]'>
        <h2 className='text-base font-medium text-white/80'>{t('title')}</h2>
        <span className='text-sm font-medium text-secondary'>
          {t('total')}: {totalCommission.toFixed(2)} {t('pointsUnit')}
        </span>
      </div>

      {/* Table Container */}
      <div className='flex flex-col gap-3'>
        {/* Table */}
        <div className='bg-card flex flex-col rounded-xl'>
          {/* Table Header */}
          <div className='flex justify-stretch rounded-t-xl bg-white/5'>
            <div className='flex flex-1 items-center justify-center px-4 py-2'>
              <span className='text-secondary text-sm font-medium'>{t('userId')}</span>
            </div>
            <div className='flex flex-1 items-center justify-center px-4 py-2'>
              <span className='text-secondary text-sm font-medium'>{t('username')}</span>
            </div>
            <div className='flex flex-1 items-center justify-center px-4 py-2'>
              <span className='text-secondary text-sm font-medium'>{t('type')}</span>
            </div>
            <div className='flex flex-1 items-center justify-center px-4 py-2'>
              <span className='text-secondary text-sm font-medium'>{t('commission')}</span>
            </div>
            <div className='flex flex-1 items-center justify-center px-4 py-2'>
              <span className='text-secondary text-sm font-medium'>{t('time')}</span>
            </div>
          </div>

          {/* Table Body */}
          {isLoading && records.length === 0 ? (
            <ContentLoading text={t('loading')} className='py-10' />
          ) : records.length === 0 ? (
            <div className='flex items-center justify-center py-10'>
              <span className='text-sm text-white/60'>暂无佣金记录</span>
            </div>
          ) : (
            records.map((record, index) => (
              <div
                key={record.orderId}
                className={`flex justify-stretch border-[#0E0E10] ${
                  index !== records.length - 1 ? 'border-b' : ''
                } ${index === records.length - 1 ? 'rounded-b-xl' : ''} hover:bg-white/5`}>
                {/* User ID */}
                <div className='flex flex-1 items-center justify-center px-4 py-3'>
                  <span className='text-sm font-medium text-white/80'>
                    {record.inviteUserId || '-'}
                  </span>
                </div>

                {/* Username */}
                <div className='flex flex-1 items-center justify-center px-4 py-3'>
                  <span className='text-sm font-medium text-white/80'>
                    {record.inviteUserName || '-'}
                  </span>
                </div>

                {/* Type */}
                <div className='flex flex-1 items-center justify-center px-4 py-3'>
                  <span className='text-sm font-medium text-white/80'>
                    {getTypeLabel(record.returnType)}
                  </span>
                </div>

                {/* Commission */}
                <div className='flex flex-1 items-center justify-center px-4 py-3'>
                  <span className='text-sm font-medium text-[#E5AD54]'>
                    + {record.amount || '0'}
                  </span>
                </div>

                {/* Time */}
                <div className='flex flex-1 items-center justify-center px-4 py-3'>
                  <span className='text-xs font-medium text-white/80'>
                    {formatTime(record.createTime)}
                  </span>
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
    </div>
  )
}

