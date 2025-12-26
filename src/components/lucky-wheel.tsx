'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import WinningDialog from './winning-dialog'
import LotteryLimitDialog from './lottery-limit-dialog'
import { useLotteryRecords, useAssistRecords, useLotteryInit, useLotteryDraw } from '@/requests'
import { useAuth } from '@/hooks/useAuth'
import { IMG_BASE_URL } from '@/consts'
import { toast } from '@/components/toast'
import { ContentLoading, LoadingSpinner } from '@/components/loading-spinner'
import Help1Icon from '@/svgs/help-1.svg'
import Help2Icon from '@/svgs/help-2.svg'

interface LotteryRecord {
  id: number
  amount: string
  time: string
}

interface HelpRecord {
  username: string
  avatar: string
  time: string
}

interface LuckyWheelProps {
  onInvite?: () => void // 邀请好友回调
  onBack?: () => void // 返回回调 - 移动端使用
  pageTitle?: string // 页面标题 - 移动端使用
}

export default function LuckyWheel({ onInvite, onBack, pageTitle }: LuckyWheelProps) {
  const t = useTranslations('luckyWheel')
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const { userId } = useAuth()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(330) // 初始指向12点钟第一个奖品的中心（-30度 = 330度）
  const [preSpinRotation, setPreSpinRotation] = useState(0) // 记录请求前的持续旋转角度
  const [useTransition, setUseTransition] = useState(true) // 控制是否使用CSS transition
  
  // 移动端角度偏移补偿（基于PC端正确的角度，移动端需要补偿差异）
  // PC端文字偏移-108度，移动端文字偏移-50度，差值58度
  // 如果实际测试发现偏移不对，可以调整这个值（可以是正数或负数）
  const mobileAngleOffset = isMobile ? 58 : 0
  const [activeTab, setActiveTab] = useState<'lottery' | 'help'>('lottery')
  const rotationRef = useRef(330) // 使用ref实时跟踪旋转角度，避免state延迟（不含视觉偏移，仅用于逻辑计算）
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [showWinningDialog, setShowWinningDialog] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [wonPrize, setWonPrize] = useState('')
  const [recvAmount, setRecvAmount] = useState('0') // 累计已抽中金额

  // 获取抽奖初始化数据
  const lotteryInitMutation = useLotteryInit()
  const lotteryDrawMutation = useLotteryDraw()
  const [lotteryData, setLotteryData] = useState<{
    count: number
    amount: string
    recvAmount: string
    drawAmount: string[]
    expireTime: number
  } | null>(null)

  // 初始化抽奖数据
  useEffect(() => {
    const fetchLotteryInit = async () => {
      if (!userId) return
      try {
        const res = await lotteryInitMutation.mutateAsync()
        if (res.data.code === 0 || res.data.code === 200) {
          setLotteryData(res.data.data)
          // setRecvAmount(res.data.data.amount) // 设置初始累计金额
        }
      } catch (error) {
        console.error('获取抽奖信息失败:', error)
      }
    }
    fetchLotteryInit()
  }, [userId])

  // 根据返回的 drawAmount 生成奖品数组
  // 直接使用接口返回的数组顺序，不做重新排序
  // 转盘固定顺序（从12点钟顺时针）：7U → 1U → 46U → 7U → 27U → 谢谢参与
  const prizes = lotteryData?.drawAmount ? (() => {
    const backendAmounts = lotteryData.drawAmount
    
    // 直接使用接口返回的顺序，确保至少有6个元素
    const orderedAmounts = [...backendAmounts]
    while (orderedAmounts.length < 6) {
      orderedAmounts.push('0')
    }
    
    // 转盘布局：从12点钟方向开始顺时针，每个扇形60度
    // 指针图片默认朝上（12点钟）
    // 每个扇形60度，需要指向扇形中心，所以要偏移半个扇形的角度（30度）
    // 最终角度计算：index * 60 - 30
    // - 索引0 (12点钟): -30° (即 330°)
    // - 索引1 (2点钟): 30°
    // - 索引2 (4点钟): 90°
    // - 索引3 (6点钟): 150°
    // - 索引4 (8点钟): 210°
    // - 索引5 (10点钟): 270°
    
    // console.log('=== 转盘数据初始化 ===')
    // console.log('接口返回金额:', backendAmounts)
    // console.log('使用的金额顺序:', orderedAmounts)
    
    return orderedAmounts.map((amount, index) => {
      // 计算指针旋转角度：指向扇形中心需要偏移30度
      const pointerAngle = (index * 60 - 30 + 360) % 360
      
      // console.log(`索引${index}: ${amount}U, 指针角度: ${pointerAngle}°`)
      
      return {
        amount: parseFloat(amount) === 0 ? t('thankYou') : `${amount}U`,
        rawAmount: amount,
        color: '#581774',
        rotation: index * 60, // 用于奖品文字定位
        pointerAngle: pointerAngle, // 指针需要旋转到的角度
      }
    })
  })() : []

  const currentAmount = parseFloat(lotteryData?.recvAmount || '0') // 从 recvAmount 获取累计金额
  const targetAmount = parseFloat(lotteryData?.amount || '0') // 目标金额
  const remainingSpins = lotteryData?.count || 0

  // 获取抽奖记录 - 只在已登录时请求
  const { data: lotteryRecordsData, refetch: refetchLotteryRecords } = useLotteryRecords(userId || undefined)
  const lotteryRecords = lotteryRecordsData?.map((record, index) => ({
    id: index + 1,
    amount: `${Math.floor(parseFloat(record.amount))}U`, // 金额取整
    time: new Date(record.createTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '/').replace(/,/g, '')
  })) || []

  // 获取助力记录 - 只在已登录时请求
  const { data: assistRecordsData, refetch: refetchAssistRecords } = useAssistRecords(userId || undefined)
  const helpRecords = assistRecordsData?.map(record => ({
    username: record.nickName,
    avatar: record.image ? `${IMG_BASE_URL}${record.image}` : '/images/examples/eth.png',
    time: new Date(record.createTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '/').replace(/,/g, '')
  })) || []

  // 倒计时更新 - 根据 expireTime 计算
  useEffect(() => {
    if (!lotteryData?.expireTime) return

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = Math.max(0, lotteryData.expireTime - now)

      if (remaining <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

      setCountdown({ hours, minutes, seconds })
    }

    updateCountdown() // 立即更新一次
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [lotteryData?.expireTime])

  const handleSpin = async () => {
    if (isSpinning) return

    // 检查是否有奖品数据
    if (!prizes || prizes.length === 0) {
      toast.error(t('dataLoading'))
      return
    }

    // 检查是否有抽奖数据
    if (!lotteryData) {
      toast.error(t('dataLoading'))
      return
    }

    // 检查累计金额是否已经达到目标值
    const targetAmountValue = parseFloat(lotteryData.amount || '0')
    const currentRecvAmount = parseFloat(lotteryData.recvAmount || '0')
    const hasReachedTarget = targetAmountValue > 0 && currentRecvAmount >= targetAmountValue
    if (hasReachedTarget) {
      // 累计金额已达标，直接展示目标金额（兼容累计金额可能超过目标值的情况）
      const displayAmountValue = Math.floor(Math.min(currentRecvAmount, targetAmountValue))
      const displayAmount = `${displayAmountValue}U`
      setWonPrize(displayAmount)
      setShowWinningDialog(true)
      // 刷新抽奖记录
      refetchLotteryRecords()
      return
    }

    // 检查是否还有抽奖次数
    // const remainingSpins = lotteryData.count || 0
    // if (remainingSpins <= 0) {
    //   // 没有抽奖次数了，且金额不足100，显示限制弹窗
    //   setShowLimitDialog(true)
    //   return
    // }

    setIsSpinning(true)

    // 声明 animationFrameId 在外部，以便在 catch 块中访问
    let animationFrameId: number | undefined

    try {
      // 直接进行抽奖，不再调用 init 接口
      setUseTransition(false) // 禁用CSS transition，使用requestAnimationFrame控制

      // 开始持续旋转动画（在接口请求之前）
      const spinStartTime = Date.now()
      const preSpinSpeed = 720 // 每秒720度（2圈/秒）
      const currentBaseRotation = rotationRef.current // 使用ref获取当前角度
      
      console.log(`🎯 开始旋转，当前基础角度: ${currentBaseRotation}°`)
      
      // 启动持续旋转动画
      const animatePreSpin = () => {
        const elapsed = (Date.now() - spinStartTime) / 1000 // 经过的秒数
        const currentPreSpinRotation = elapsed * preSpinSpeed // 已经旋转的角度
        const newRotation = currentBaseRotation + currentPreSpinRotation
        rotationRef.current = newRotation // 更新ref
        setPreSpinRotation(currentPreSpinRotation)
        setRotation(newRotation)
        animationFrameId = requestAnimationFrame(animatePreSpin)
      }
      animationFrameId = requestAnimationFrame(animatePreSpin)

      // 调用抽奖接口
      const response = await lotteryDrawMutation.mutateAsync()

      // 停止持续旋转动画
      cancelAnimationFrame(animationFrameId)

      if (response.data.code !== 0 && response.data.code !== 200) {
        // 如果code==30 表示没有抽奖次数了 需要显示限制弹窗，需要回复加载状态
        if (response.data.code === 30) {
          setShowLimitDialog(true)
          setIsSpinning(false)
          setUseTransition(true) // 恢复transition
          return
        }
        setUseTransition(true) // 恢复transition
        toast.error(response.data.msg || t('drawFailed'))
        setIsSpinning(false)
        return
      }

      const result = response.data.data
      const drawnAmount = result.amount // 本次抽中的金额

      // 根据抽中的金额找到对应的奖品索引（使用取整后的数值比较）
      const drawnAmountInt = Math.floor(parseFloat(drawnAmount))
      
      // 找到所有匹配的索引（可能有多个相同金额）
      const matchingIndices: number[] = []
      prizes.forEach((prize, index) => {
        const prizeAmountInt = Math.floor(parseFloat(prize.rawAmount))
        if (prizeAmountInt === drawnAmountInt) {
          matchingIndices.push(index)
        }
      })

      // 打印调试信息
      console.log('=== 抽奖结果匹配 ===')
      console.log('接口返回金额:', drawnAmount, '类型:', typeof drawnAmount)
      console.log('取整后金额:', drawnAmountInt)
      console.log('prizes数组详情:')
      prizes.forEach((p, i) => {
        console.log(`  索引${i}: ${p.rawAmount}U (取整:${Math.floor(parseFloat(p.rawAmount))}U) -> 指针角度: ${p.pointerAngle}°`)
      })
      console.log('匹配到的所有索引:', matchingIndices)
      
      // 如果有多个相同金额，随机选择一个（临时方案）
      // 建议：让后端接口返回 index 字段，明确指定抽中的是哪个位置
      let winIndex = -1
      if (matchingIndices.length > 0) {
        if (matchingIndices.length > 1) {
          console.warn(`⚠️ 警告：数组中有${matchingIndices.length}个${drawnAmountInt}U，将随机选择一个。建议后端返回索引字段！`)
        }
        // 随机选择一个匹配的索引
        winIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
        console.log(`✅ 选择索引: ${winIndex}, 金额${prizes[winIndex].rawAmount}U, 目标指针角度: ${prizes[winIndex].pointerAngle}°`)
      }

      // 如果还是没找到，记录错误
      if (winIndex === -1) {
        console.error('未找到匹配的奖品:', {
          drawnAmount,
          drawnAmountInt,
          prizes: prizes.map(p => ({ 
            rawAmount: p.rawAmount, 
            rawAmountInt: Math.floor(parseFloat(p.rawAmount))
          }))
        })
        setUseTransition(true) // 恢复transition
        toast.error(t('drawFailed'))
        setIsSpinning(false)
        return
      }

      // 计算指针应该旋转到的角度
      // 使用ref获取当前实时角度
      const currentTotalRotation = rotationRef.current
      
      // 获取中奖金额对应的指针角度
      const targetPointerAngle = prizes[winIndex].pointerAngle

      console.log('=== 角度计算 ===')
      console.log(`目标金额: ${drawnAmount}U (取整: ${drawnAmountInt}U)`)
      console.log(`匹配索引: ${winIndex}`)
      console.log(`目标奖品信息: 金额=${prizes[winIndex].rawAmount}U, 指针角度=${targetPointerAngle}°`)
      console.log(`当前总角度(ref): ${currentTotalRotation.toFixed(2)}°`)

      // 当前指针角度（归一化到0-360）
      const currentPointerAngle = currentTotalRotation % 360
      console.log(`当前指针角度(归一化): ${currentPointerAngle.toFixed(2)}°`)
      
      // 计算需要旋转的增量角度（顺时针）
      let deltaAngle = (targetPointerAngle - currentPointerAngle + 360) % 360
      console.log(`初始增量角度: ${deltaAngle.toFixed(2)}°`)
      
      // 如果增量角度太小（小于一个扇形的一半），多转一圈
      if (deltaAngle < 30) {
        console.log(`增量角度太小(${deltaAngle.toFixed(2)}° < 30°)，增加360°`)
        deltaAngle += 360
      }

      // 额外旋转的圈数（至少3圈增加悬念）
      const extraSpins = 3
      
      // 最终旋转角度 = 当前总角度 + 额外旋转的圈数 + 到达目标的增量角度
      const finalRotation = currentTotalRotation + (extraSpins * 360) + deltaAngle
      
      console.log(`最终旋转角度: ${finalRotation.toFixed(2)}° (额外转${extraSpins}圈 + 增量${deltaAngle.toFixed(2)}°)`)
      console.log(`最终指针指向: ${(finalRotation % 360).toFixed(2)}° (应该等于目标角度${targetPointerAngle}°)`)
      console.log('=== 角度计算结束 ===')
      console.log(' ')

      // 启用CSS transition，开始最终旋转
      setUseTransition(true)
      rotationRef.current = finalRotation // 更新ref
      setRotation(finalRotation)
      setPreSpinRotation(0) // 重置预旋转角度

      // 更新累计金额
      setRecvAmount(result.recvAmount)

      // 更新抽奖数据（同步更新recvAmount和count）
      setLotteryData({
        ...lotteryData,
        count: Math.max(0, lotteryData.count - 1), // 抽奖次数减1，确保不小于0
        recvAmount: result.recvAmount, // 同步更新累计金额
      })

      // 等待动画结束
      setTimeout(() => {
        setIsSpinning(false)
        // 使用接口返回的数据决定展示金额
        const finalTotalAmount = parseFloat(result.recvAmount || '0')
        const numericTargetAmount = targetAmountValue > 0 ? targetAmountValue : 0
        const numericDrawnAmount = parseFloat(drawnAmount)
        const reachedTargetNow = numericTargetAmount > 0 && finalTotalAmount >= numericTargetAmount
        const isThankYouPrize = !Number.isFinite(numericDrawnAmount) || Number.isNaN(numericDrawnAmount) || numericDrawnAmount === 0

        let displayAmountText: string
        if (reachedTargetNow) {
          const targetDisplayValue = Math.floor(Math.min(finalTotalAmount, numericTargetAmount))
          displayAmountText = `${targetDisplayValue}U`
        } else if (isThankYouPrize) {
          displayAmountText = t('thankYou')
        } else {
          displayAmountText = `${Math.floor(numericDrawnAmount)}U`
        }

        setWonPrize(displayAmountText)
        setShowWinningDialog(true)
        // 刷新抽奖记录
        refetchLotteryRecords()
      }, 4000)
    } catch (error: any) {
      console.error('抽奖失败:', error)
      // 停止持续旋转动画（如果已启动）
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
      }
      setUseTransition(true) // 恢复transition
      toast.error(error?.response?.data?.msg || t('drawFailed'))
      setIsSpinning(false)
    }
  }


  // 处理 tab 切换，重新请求接口
  const handleTabChange = (tab: 'lottery' | 'help') => {
    setActiveTab(tab)
    if (tab === 'lottery') {
      refetchLotteryRecords()
    } else {
      refetchAssistRecords()
    }
  }

  const progress = (currentAmount / targetAmount) * 100

  // 加载状态
  const isLoading = !lotteryData || prizes.length === 0

  // 移动端完整版本 - 包含标题、转盘、进度条、记录列表
  if (isMobile) {
    return (
      <div className='fixed inset-0 w-full h-full overflow-y-auto bg-black'>
        {/* 灯光背景 - 固定在顶部铺满 */}
        <div className='absolute top-0 left-0 right-0 min-h-[743px] pointer-events-none overflow-hidden'>
          <img
            src='/images/winning/mobile-bg.png'
            alt='Light background'
            className='w-full h-full object-cover'
          />
        </div>

        {/* 内容区域 */}
        <div className='relative z-10'>
          {/* 标题栏 */}
          {pageTitle && (
            <div className='px-4 py-3'>
              <div className='flex items-center gap-3'>
                <button onClick={onBack} className='hover:opacity-80 text-white'>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h1 className='flex-1 text-center text-base font-semibold text-white pr-9'>
                  {pageTitle}
                </h1>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className='flex flex-col items-center gap-6 pt-6'>
              <ContentLoading text={t('loading')} size='md' className='h-[381px]' />
              <div className='h-[52px]' /> {/* 按钮占位 */}
            </div>
          ) : (
            <>
            {/* 转盘区域 - 移动端 */}
            <div className='relative z-10 flex flex-col items-center'>
              {/* 抽奖转盘 */}
              <div className='relative w-[326px] h-[381px]'>
                <img
                  src='/images/winning/winning-bg.png'
                  alt='Lucky wheel background'
                  className='absolute inset-0 w-full h-full object-contain'
                />

                {/* 转盘 - 固定不动 */}
                <div className='absolute left-1/2 top-[21px] -translate-x-1/2 w-[281px] h-[281px]'>
                  <div className='relative w-full h-full'>
                    {/* 转盘背景图 */}
                    <img
                      src='/images/winning/winning-main.png'
                      alt='Lucky wheel'
                      className='w-full h-full object-contain'
                    />

                    {/* 奖品金额文字 */}
                    {prizes.map((prize, index) => {
                      const angle = prize.rotation - 50
                      const radius = 85 // 移动端调整半径
                      const x = Math.cos((angle * Math.PI) / 180) * radius
                      const y = Math.sin((angle * Math.PI) / 180) * radius
                      const isThankYou = parseFloat(prize.rawAmount) === 0

                      return (
                        <div
                          key={index}
                          className='absolute top-1/2 left-1/2'
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle + 90}deg)`,
                          }}
                        >
                          {isThankYou ? (
                            <div className='text-[#581774] text-[14px] font-semibold flex flex-col items-center leading-tight -translate-x-1/2'>
                              {t('thankYou').split(' ').map((word, idx) => (
                                <div key={idx} className='whitespace-nowrap'>{word}</div>
                              ))}
                            </div>
                          ) : (
                            <span className='text-[#581774] text-[20px] font-semibold whitespace-nowrap block -translate-x-1/2'>
                              {prize.amount}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 旋转指针 - 使用中心按钮作为指针 */}
                {/* 转盘中心位置：top-[21px] + 140.5px(转盘半径) = 161.5px */}
                {/* 按钮位置：top-[93px]，高度111px，中心在93+55.5=148.5px */}
                {/* 需要让按钮围绕转盘中心(161.5px)旋转 */}
                <div
                  className={`absolute w-[89px] h-[111px] cursor-pointer ${useTransition ? 'transition-transform duration-[4000ms] ease-out' : ''}`}
                  style={{
                    left: '50%',
                    top: '93px',
                    transform: `translate(-50%, 0) rotate(${rotation + mobileAngleOffset}deg)`,
                    transformOrigin: '50% 68.5px' // 68.5px = 161.5(转盘中心) - 93(按钮top) = 相对按钮顶部的偏移
                  }}
                // onClick={handleSpin}
                >
                  <img
                    src='/images/winning/winning-chou.png'
                    alt='Spin button'
                    className={`w-full h-full object-contain ${isSpinning ? 'opacity-70' : 'hover:scale-105 transition-transform'}`}
                  />
                </div>
              </div>

            </div>

            {/* 进度条和倒计时区域 */}
            <div className='px-5 mt-4 mb-6'>
            {/* 已抽金额标签 */}
            <div className='relative z-20 flex items-center justify-center gap-3 mb-4'>
              <div className='bg-white rounded-lg px-2 py-1.5 flex items-center gap-3'>
                <span className='text-[#581774] text-xs font-semibold uppercase'>
                  {isSpinning ? t('loading') : `${t('drawn')} ${currentAmount} U`}
                </span>
              </div>
              {/* <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M5 6L0 0H10L5 6Z" fill="white" />
              </svg> */}
            </div>

              {/* 进度条 */}
              <div className='w-full flex flex-col gap-2 mb-4'>
                <div className='relative'>
                  <div className='h-[12px] bg-[#1F183F] rounded-[24px] overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-[#E445C3] to-[#9074FF] rounded-[25px] transition-all duration-500'
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span className='text-[#5D4CA7] text-sm'>0 U</span>
                    <span className='text-[#5D4CA7] text-sm'>{targetAmount} U</span>
                  </div>
                </div>
              </div>

              {/* 点击抽奖按钮 */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className=' w-full bg-gradient-to-r from-[#E445C3] to-[#9074FF] text-white text-[18px] font-semibold px-[76px] py-[11px] rounded-[25px]  hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2'
             
             >
                {isSpinning && <LoadingSpinner size='sm' />}
                {isSpinning ? t('loading') : t('clickToDraw')}
              </button>
              {/* 倒计时 */}
              <div className='flex items-center justify-center gap-2 mb-4 mt-5'>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>
                    {countdown.hours.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className='text-[#5D4CA7] text-sm font-semibold'>:</span>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>
                    {countdown.minutes.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className='text-[#5D4CA7] text-sm font-semibold'>:</span>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>
                    {countdown.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className='text-[#5D4CA7] text-sm'>{t('drawEndsIn')}</span>
              </div>

            </div>

            {/* Tab 切换和记录列表 */}
            <div className='px-5 pb-20'>
              {/* Tab 切换和记录列表容器 */}
              <div className='bg-[#0E0A1D] rounded-[24px] overflow-hidden'>
                {/* Tab 切换 */}
                <div className='flex'>
                  <button
                    onClick={() => handleTabChange('lottery')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                      activeTab === 'lottery'
                        ? 'text-white'
                        : 'text-[#453782]'
                    }`}
                  >
                    {activeTab === 'lottery' && (
                      <img 
                        src='/images/winning/tab_bg_mobile_l.png'
                        alt=""
                        className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
                      />
                    )}
                    <span className='relative z-10 flex items-center gap-2'>
                      {activeTab === 'lottery' && (
                        <Help1Icon className='w-5 h-5' />
                      )}
                      {t('lotteryRecords')}
                    </span>
                  </button>
                  <button
                    onClick={() => handleTabChange('help')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                      activeTab === 'help'
                        ? 'text-white'
                        : 'text-[#453782]'
                    }`}
                  >
                    {activeTab === 'help' && (
                      <img 
                        src='/images/winning/tab_bg_mobile_r.png'
                        alt=""
                        className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
                      />
                    )}
                    <span className='relative z-10 flex items-center gap-2'>
                      {activeTab === 'help' && (
                        <Help2Icon className='w-5 h-5' />
                      )}
                      {t('assistRecords')}
                    </span>
                  </button>
                </div>

                {/* 记录列表 */}
                <div className='bg-[#1F183F] rounded-br-[24px] rounded-bl-[24px] px-4 py-5 min-h-[200px]'>
                  {activeTab === 'lottery' ? (
                    <div className='flex flex-col gap-3'>
                      {lotteryRecords.length > 0 ? (
                        lotteryRecords.map((record, index) => (
                          <div key={record.id}>
                            <div className='flex items-center gap-4 py-0.5'>
                              {/* 序号圆圈 */}
                              <div className='w-10 h-10 rounded-[20px] bg-[#2B2154] flex items-center justify-center flex-shrink-0'>
                                <span className='text-white text-sm font-semibold'>{record.id}</span>
                              </div>
                              {/* 内容区域 */}
                              <div className='flex flex-col gap-1 flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-white text-sm'>{t('clickedGoldenHand')}</span>
                                  <span className='text-[#C555D8] text-sm font-semibold'>{record.amount}</span>
                                </div>
                                <span className='text-[#6958B1] text-xs'>{record.time}</span>
                              </div>
                            </div>
                            {/* 分隔线 - 不在最后一项显示 */}
                            {index < lotteryRecords.length - 1 && (
                              <div className='h-px border-t border-dashed border-[#35286A] mt-3' />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className='flex items-center justify-center py-12'>
                          <span className='text-[#6958B1] text-sm'>{t('noRecords')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='flex flex-col gap-3'>
                      {helpRecords.length > 0 ? (
                        helpRecords.map((record, index) => (
                          <div key={index}>
                            <div className='flex items-center gap-4 py-0.5'>
                              {/* 序号圆圈 */}
                              <div className='w-10 h-10 rounded-[20px] bg-[#2B2154] flex items-center justify-center flex-shrink-0'>
                                <span className='text-white text-sm font-semibold'>{index + 1}</span>
                              </div>
                              {/* 内容区域 */}
                              <div className='flex flex-col gap-1 flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-white text-sm'>{record.username}</span>
                                  <span className='text-[#C555D8] text-sm font-semibold'>{t('helpedYou')}</span>
                                </div>
                                <span className='text-[#6958B1] text-xs'>{record.time}</span>
                              </div>
                            </div>
                            {/* 分隔线 - 不在最后一项显示 */}
                            {index < helpRecords.length - 1 && (
                              <div className='h-px border-t border-dashed border-[#35286A] mt-3' />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className='flex items-center justify-center py-12'>
                          <span className='text-[#6958B1] text-sm'>{t('noRecords')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 中奖弹窗 */}
            <WinningDialog
              isOpen={showWinningDialog}
              onClose={() => setShowWinningDialog(false)}
              prize={wonPrize}
            />

            {/* 抽奖次数用完弹窗 */}
            <LotteryLimitDialog
              isOpen={showLimitDialog}
              onClose={() => setShowLimitDialog(false)}
            />
            
          </>
          )}
        </div>
      </div>
    )
  }

  // 桌面端完整版本
  return (
    <div className='relative flex flex-col gap-6 -mt-2'>
      {/* PC端灯光背景 - 居顶部铺满 */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-screen pointer-events-none overflow-hidden z-0'>
        <img
          src='/images/winning/pc-bg.png'
          alt='Light background'
          className='w-full h-full object-cover'
        />
      </div>

      {/* 标题 - PC端，相对于背景图左上角定位（考虑侧边栏300px宽度） */}
      {pageTitle && (
        <div className='absolute top-[24px] left-0 z-10 flex items-center gap-2' style={{ marginLeft: 'calc(50% - 50vw + 300px - 110px)' }}>
          {onBack && (
            <button
              type='button'
              onClick={onBack}
              className='flex  items-center justify-center text-white transition-colors'
              aria-label='Back'
            >
              <svg width='32' height='32' viewBox='0 0 24 24' fill='none'>
                <path d='M15 18L9 12L15 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
          <h1 className='text-2xl font-semibold'>{pageTitle}</h1>

            </button>
          )}
          {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className='ml-1'>
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg> */}
        </div>
      )}

      {isLoading ? (
        <ContentLoading text={t('loading')} size='md' className='min-h-[600px] z-10' />
      ) : (
        <>
          {/* 转盘区域 */}
          <div className='relative flex flex-col items-center gap-4'>
            {/* 抽奖转盘 */}
            <div className='relative flex items-center justify-center pt-20'>
              {/* 底盘 */}
              <div className='relative w-[360px] h-[420px]'>
                <img
                  src='/images/winning/winning-bg.png'
                  alt='Lucky wheel background'
                  className='absolute inset-0 w-full h-full object-contain z-1'
                />

                {/* 转盘 - 固定不动 */}
                <div className='absolute left-1/2 top-[23px] -translate-x-1/2 w-[310px] h-[310px]  z-1'>
                  <div className='relative w-full h-full'>
                    {/* 转盘背景图 */}
                    <img
                      src='/images/winning/winning-main.png'
                      alt='Lucky wheel'
                      className='w-full h-full object-contain'
                    />

                    {/* 奖品金额文字 - 每个扇形60度，从正上方开始顺时针 */}
                    {prizes.map((prize, index) => {
                      // 转盘的rotation: 0度=12点钟, 60度=2点钟, 120度=4点钟, 等等
                      // CSS角度: 0度=3点钟, 90度=6点钟, 180度=9点钟, 270度=12点钟
                      // 转换: CSS角度 = rotation - 90 (将12点钟对齐到270度/-90度)
                      // 加30度到扇形中心: angle = rotation - 90 + 30 = rotation - 60
                      const angle = prize.rotation - 108
                      const radius = 95 // 文字距离中心的距离
                      const x = Math.cos((angle * Math.PI) / 180) * radius
                      const y = Math.sin((angle * Math.PI) / 180) * radius
                      const isThankYou = parseFloat(prize.rawAmount) === 0

                      return (
                        <div
                          key={index}
                          className='absolute top-1/2 left-1/2  z-1'
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle + 90}deg)`,
                          }}
                        >
                          {isThankYou ? (
                            <div className='text-[#581774] text-[16px] font-semibold flex flex-col items-center leading-tight -translate-x-1/2'>
                              {t('thankYou').split(' ').map((word, idx) => (
                                <div key={idx} className='whitespace-nowrap'>{word}</div>
                              ))}
                            </div>
                          ) : (
                            <span className='text-[#581774] text-[22px] font-semibold whitespace-nowrap block -translate-x-1/2'>
                              {prize.amount}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 旋转指针 - 使用中心按钮作为指针 */}
                {/* 转盘中心位置：top-[23px] + 155px(转盘半径) = 178px */}
                {/* 按钮位置：top-[103px]，高度123px */}
                {/* 需要让按钮围绕转盘中心(178px)旋转 */}
                <div
                  className={`absolute w-[98px] h-[123px] cursor-pointer z-1 ${useTransition ? 'transition-transform duration-[4000ms] ease-out' : ''}`}
                  style={{
                    left: '50%',
                    top: '103px',
                    transform: `translate(-50%, 0) rotate(${rotation}deg)`,
                    transformOrigin: '50% 75px' // 75px = 178(转盘中心) - 103(按钮top) = 相对按钮顶部的偏移
                  }}
                // onClick={handleSpin}
                >
                  <img
                    src='/images/winning/winning-chou.png'
                    alt='Spin button'
                    className={`w-full h-full object-contain ${isSpinning ? 'opacity-70' : 'hover:scale-105 transition-transform'}`}
                  />
                </div>

                {/* 幸运大转盘标题 */}
                {/* <div className='absolute bottom-[20px] left-1/2 -translate-x-1/2'>
              <h3 className='text-white text-xl font-bold tracking-[0.2em] text-center'>
                幸运大转盘
              </h3>
            </div> */}
              </div>
            </div>


            {/* 已抽金额标签 */}
            <div className='flex items-center gap-3  z-1'>
              <div className='bg-white rounded-lg px-2 py-1.5 flex items-center gap-3'>
                <span className='text-[#581774] text-xs font-semibold uppercase'>
                  {isSpinning ? t('loading') : `${t('drawn')} ${currentAmount} U`}
                </span>
              </div>
              {/* <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M5 6L0 0H10L5 6Z" fill="white" />
              </svg> */}
            </div>

            {/* 进度条 */}
            <div className='w-[360px] flex flex-col gap-4  z-1'>
              {/* 进度条背景和填充 */}
              <div className='relative'>
                <div className='h-[12px] bg-[#1F183F] rounded-[24px] overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-[#E445C3] to-[#9074FF] rounded-[25px] transition-all duration-500'
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className='flex justify-between mt-[3px]'>
                  <span className='text-[#5D4CA7] text-sm'>0 U</span>
                  <span className='text-[#5D4CA7] text-sm'>{targetAmount} U</span>
                </div>
              </div>

              {/* 点击抽奖按钮 */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className='bg-gradient-to-r from-[#E445C3] to-[#9074FF] text-white text-[22px] font-semibold px-[76px] py-[11px] rounded-[25px]  hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2  z-1'
              >
                {isSpinning && <LoadingSpinner size='sm' />}
                {isSpinning ? t('loading') : t('clickToDraw')}
              </button>
              {/* 倒计时 */}
              <div className='flex items-center justify-center gap-2  z-1'>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>{countdown.hours.toString().padStart(2, '0')}</span>
                </div>
                <span className='text-[#5D4CA7] text-sm font-semibold'>:</span>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>{countdown.minutes.toString().padStart(2, '0')}</span>
                </div>
                <span className='text-[#5D4CA7] text-sm font-semibold'>:</span>
                <div className='bg-[#1F183F] rounded px-1.5 py-1 min-w-[28px] text-center'>
                  <span className='text-white text-base font-semibold'>{countdown.seconds.toString().padStart(2, '0')}</span>
                </div>
                <span className='text-[#5D4CA7] text-sm'>{t('drawEndsIn')}</span>
              </div>
            </div>
          </div>

          {/* 选项卡和记录列表容器 */}
          <div className='w-[540px] mx-auto bg-[#0E0A1D] rounded-[24px] overflow-hidden z-1'>
            {/* 选项卡 */}
            <div className='flex relative'>
              <button
                onClick={() => handleTabChange('lottery')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 text-base font-medium transition-all relative ${
                  activeTab === 'lottery'
                    ? 'text-white'
                    : 'text-[#453782]'
                }`}
              >
                {activeTab === 'lottery' && (
                  <img 
                    src='/images/winning/tab_bg_web_l.png'
                    alt=""
                    className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
                  />
                )}
                <span className='relative z-10 flex items-center gap-3'>
                  {activeTab === 'lottery' && (
                    <Help1Icon className='w-7 h-7' />
                  )}
                  {t('lotteryRecords')}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('help')}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 text-base font-medium transition-all relative ${
                  activeTab === 'help'
                    ? 'text-white'
                    : 'text-[#453782]'
                }`}
              >
                {activeTab === 'help' && (
                  <img 
                    src='/images/winning/tab_bg_web_r.png'
                    alt=""
                    className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
                  />
                )}
                <span className='relative z-10 flex items-center gap-3'>
                  {activeTab === 'help' && (
                    <Help2Icon className='w-7 h-7' />
                  )}
                  {t('assistRecords')}
                </span>
              </button>
            </div>

            {/* 记录列表 */}
            <div className='bg-[#1F183F] rounded-br-[24px] rounded-bl-[24px] px-[19px] py-5 min-h-[300px]'>
              {activeTab === 'lottery' && (
                <div className='flex flex-col gap-3'>
                  {lotteryRecords.length > 0 ? (
                    lotteryRecords.map((record, index) => (
                      <div key={record.id}>
                        <div className='flex items-center gap-5 py-0.5'>
                          {/* 序号圆圈 */}
                          <div className='w-12 h-12 rounded-[24px] bg-[#2B2154] flex items-center justify-center flex-shrink-0'>
                            <span className='text-white text-base font-semibold'>{record.id}</span>
                          </div>
                          {/* 内容区域 */}
                          <div className='flex items-center justify-between flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='text-white text-base'>{t('clickedGoldenHand')}</span>
                              <span className='text-[#C555D8] text-base font-semibold'>{record.amount}</span>
                            </div>
                            <span className='text-[#6958B1] text-sm'>{record.time}</span>
                          </div>
                        </div>
                        {/* 分隔线 - 不在最后一项显示 */}
                        {index < lotteryRecords.length - 1 && (
                          <div className='w-[500px] h-px border-t border-dashed border-[#35286A] mt-3' />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className='flex items-center justify-center py-12'>
                      <span className='text-[#6958B1] text-sm'>{t('noRecords')}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'help' && (
                <div className='flex flex-col gap-3'>
                  {helpRecords.length > 0 ? (
                    helpRecords.map((record, index) => (
                      <div key={index}>
                        <div className='flex items-center gap-5 py-0.5'>
                          {/* 序号圆圈 */}
                          <div className='w-12 h-12 rounded-[24px] bg-[#2B2154] flex items-center justify-center flex-shrink-0'>
                            <span className='text-white text-base font-semibold'>{index + 1}</span>
                          </div>
                          {/* 内容区域 */}
                          <div className='flex items-center justify-between flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='text-white text-base'>{record.username}</span>
                              <span className='text-[#C555D8] text-base font-semibold'>{t('helpedYou')}</span>
                            </div>
                            <span className='text-[#6958B1] text-sm'>{record.time}</span>
                          </div>
                        </div>
                        {/* 分隔线 - 不在最后一项显示 */}
                        {index < helpRecords.length - 1 && (
                          <div className='w-[500px] h-px border-t border-dashed border-[#35286A] mt-3' />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className='flex items-center justify-center py-12'>
                      <span className='text-[#6958B1] text-sm'>{t('noRecords')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 中奖弹窗 */}
          <WinningDialog
            isOpen={showWinningDialog}
            onClose={() => setShowWinningDialog(false)}
            prize={wonPrize}
          />

          {/* 抽奖次数用完弹窗 */}
          <LotteryLimitDialog
            isOpen={showLimitDialog}
            onClose={() => setShowLimitDialog(false)}
          />
        </>
      )}
    </div>
  )
}

