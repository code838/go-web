'use client'

import { useTranslations } from 'next-intl'
import { useInviteRecords, type InviteRecord } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { IMG_BASE_URL } from '@/consts'

export default function InviteRecordsPage() {
  const t = useTranslations('inviteRecords')
  const { userId } = useAuth()

  // 获取邀请记录
  const { data: records, isLoading } = useInviteRecords(userId ? Number(userId) : undefined)
  
  // 确保 records 是数组
  const recordsList = records || []

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

  return (
    <div className='flex w-full flex-col gap-3'>
      {/* Header */}
      <div className='flex items-center gap-1'>
        <h2 className='text-base font-medium text-white/80'>{t('title')}</h2>
      </div>

      {/* Table Container */}
      <div className='flex flex-col gap-3'>
        {/* Table */}
        <div className='bg-card flex flex-col rounded-xl'>
          {/* Table Header */}
          <div className='grid grid-cols-[160px_1fr_180px] items-center rounded-t-xl bg-white/5'>
            <div className='flex items-center justify-center px-4 py-3'>
              <span className='text-secondary text-sm font-medium'>{t('userId')}</span>
            </div>
            <div className='flex items-center justify-center px-4 py-3'>
              <span className='text-secondary text-sm font-medium'>{t('nickname')}</span>
            </div>
            <div className='flex items-center justify-center px-4 py-3'>
              <span className='text-secondary text-sm font-medium'>{t('assistTime')}</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className='flex items-center justify-center py-8'>
              <span className='text-sm text-white/60'>{t('loading')}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && recordsList.length === 0 && (
            <div className='flex items-center justify-center py-8'>
              <span className='text-sm text-white/60'>{t('noRecords')}</span>
            </div>
          )}

          {/* Table Body */}
          {!isLoading && recordsList.map((record, index) => (
            <div
              key={`${record.userId}-${record.time}-${index}`}
              className={`grid grid-cols-[160px_1fr_180px] items-center border-[#0E0E10] ${
                index !== recordsList.length - 1 ? 'border-b' : ''
              } ${index === recordsList.length - 1 ? 'rounded-b-xl' : ''} hover:bg-white/5`}>
              {/* User ID */}
              <div className='flex items-center justify-center px-4 py-4'>
                <span className='text-sm font-medium text-white/80 flex-shrink-0'>{record.userId}</span>
              </div>

              {/* Avatar & Nickname */}
              <div className='flex items-center justify-center px-4 py-4'>
                <div className='flex items-center gap-3'>
                  <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
                    <img
                      src={record.photo ? `${IMG_BASE_URL}${record.photo}` : '/images/examples/eth.png'}
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <span className='text-sm font-medium text-white/80'>{record.nickName || '-'}</span>
                </div>
              </div>

              {/* Invite Time */}
              <div className='flex items-center justify-center px-4 py-4'>
                <span className='text-sm font-medium text-white/80 flex-shrink-0'>{formatTime(record.time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


