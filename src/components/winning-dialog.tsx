'use client'

import { useTranslations } from 'next-intl'

interface WinningDialogProps {
  isOpen: boolean
  onClose: () => void
  prize: string // 奖品金额，如 "50U"
}

export default function WinningDialog({ isOpen, onClose, prize }: WinningDialogProps) {
  const t = useTranslations('winningDialog')
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 lg:left-[300px] z-50 flex items-start justify-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className='relative w-[320px] max-w-[90vw] animate-in zoom-in-90 duration-200 mt-[120px] lg:mt-[200px]'>
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className='absolute -top-2 -right-2 z-20 hover:opacity-80 transition-opacity'
        >
          <img 
            src='/images/winning/winning-close.png' 
            alt={t('closeAlt')}
            className='w-12 h-12'
          />
        </button>

        {/* 红包背景图 */}
        <div className='relative'>
          <img 
            src='/images/winning/winning-receive.png' 
            alt={t('bgAlt')}
            className='w-full h-auto'
          />

          {/* 恭喜获得 - 顶部彩带文字 */}
          {/* <div className='absolute top-[23%] left-1/2 -translate-x-1/2 w-full text-center'>
            <span className='text-white text-[22px] font-bold tracking-wide drop-shadow-lg'>
              恭喜获得
            </span>
          </div> */}

          {/* 中奖金额卡片 */}
          <div className='absolute top-[42%] left-1/2 -translate-x-1/2 w-[70%]'>
            <div 
              className=' rounded-2xl px-6 pt-12 flex items-center justify-center'
            >
              <span className='text-[#310842] text-[36px] font-medium tracking-wider'>
                {prize}
              </span>
            </div>
          </div>

          {/* 收下奖励按钮 */}
          <div className='absolute top-[72%] left-1/2 -translate-x-1/2 w-[65%]'>
            <button
              onClick={onClose}
              className='w-full py-4 rounded-full text-white text-[20px] font-bold hover:opacity-90 transition-opacity'
              style={{
                background: 'linear-gradient(90deg, #E344C3 0%, #9372FC 100%)',
                boxShadow: '0px 8px 20px rgba(147, 114, 252, 0.6)'
              }}
            >
              {t('receiveReward')}
            </button>
          </div>

          {/* 底部提示文字 */}
          {/* <div className='absolute top-[88%] left-1/2 -translate-x-1/2 w-full text-center'>
            <span className='text-[#6B4D9E] text-[13px] font-medium tracking-wide'>
              立即存入您的现金账户
            </span>
          </div> */}
        </div>
      </div>
    </div>
  )
}

