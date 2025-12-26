'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/toast'
import { INVITE_URL } from '@/consts'

interface LotteryLimitDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function LotteryLimitDialog({ isOpen, onClose }: LotteryLimitDialogProps) {
  const t = useTranslations('lotteryLimitDialog')
  const { userInfo } = useAuth()

  if (!isOpen) return null

  // 获取完整的邀请链接
  const getFullInviteLink = (inviteLink?: string): string => {
    if (!inviteLink) return ''
    // 将 /invite 替换为 /invite-join
    const updatedLink = inviteLink.replace('/invite', '/invite-join')
    return `${INVITE_URL}${updatedLink}`
  }

  const handleCopyInviteLink = async () => {
    const fullInviteLink = userInfo?.inviteLink
    
    if (!fullInviteLink) {
      toast.error(t('noInviteLink'))
      return
    }

    try {
      await navigator.clipboard.writeText(fullInviteLink)
      toast.success(t('inviteLinkCopied'))
      onClose() // 复制成功后关闭弹框
    } catch (err) {
      console.error('Failed to copy invite link:', err)
      toast.error(t('noInviteLink'))
    }
  }

  return (
    <div className='fixed inset-0 lg:left-[300px] z-50 flex items-start justify-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className='relative w-[300px] max-w-[90vw] animate-in zoom-in-90 duration-200 mt-[120px] lg:mt-[200px]'>
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className='absolute -top-8 -right-8 md:-top-12 md:-right-12 z-20 hover:opacity-80 transition-opacity'
        >
          <img 
            src='/images/winning/winning-close.png' 
            alt='Close'
            className='w-10 h-10'
          />
        </button>

        {/* 主卡片 */}
        <div 
          className='rounded-[40px] px-5 py-5'
          style={{
            background: 'linear-gradient(180deg, #B1A1F6 0%, #F7F6FE 90%, #FFFFFF 100%)'
          }}
        >
          {/* 标题 */}
          <h3 className='text-[#310842] text-[24px] font-semibold text-center mb-6 uppercase'>
            {t('title')}
          </h3>

          {/* 白色信息卡片 */}
          <div className='bg-white rounded-[20px] p-6 mb-6 relative'>
            {/* 装饰图标 - 右上角 */}
            {/* <div className='absolute top-3 right-3'>
              <svg width='21' height='21' viewBox='0 0 21 21' fill='none'>
                <rect x='0.5' y='0.5' width='20' height='20' rx='4' fill='white' stroke='#E5E5E5'/>
                <path d='M10.5 5L13 10L10.5 15L8 10L10.5 5Z' fill='#F0F0F0'/>
              </svg>
            </div> */}

            {/* 文字内容 */}
            <div className='text-center mb-6'>
              <p className='text-[#804E96] text-[18px] font-semibold uppercase mb-1'>
                {t('inviteOneUser', { count: '' })} <span className='text-[#DE47C7]'>{t('oneUser')}</span> 
              </p>
              <p className='text-[#804E96] text-[18px] font-semibold uppercase'>
                {t('getMoreChances', { moreChances: '' })}<span className='text-[#DE47C7]'>{t('moreChances')}</span> 
              </p>
            </div>

            {/* 邀请图标和标签 */}
            <div className='flex flex-col items-center gap-2'>
              <div className='w-[36px] h-[36px]'>
                <img 
                  src='/images/winning/winning-invite.png' 
                  alt='Invite'
                  className='w-full h-full object-contain'
                />
              </div>
              {/* <div 
                className='px-2 py-0.5 rounded-[16px] border border-brand'
                style={{
                  background: '#F3F0FF'
                }}
              >
                <span className='text-brand text-[12px] font-normal uppercase'>
                  待邀请
                </span>
              </div> */}
            </div>
          </div>

          {/* 立即邀请好友按钮 */}
          <button
            onClick={handleCopyInviteLink}
            className='w-full py-[18px] rounded-[38px] text-white text-[23px] font-semibold uppercase hover:opacity-90 transition-opacity'
            style={{
              background: 'linear-gradient(90deg, #E344C3 0%, #9372FC 100%)',
              boxShadow: '0px 8px 15px 0px rgba(150, 133, 219, 0.38)'
            }}
          >
            {t('inviteNow')}
          </button>
        </div>
      </div>
    </div>
  )
}

