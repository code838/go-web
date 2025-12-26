'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import md5 from 'blueimp-md5'
import { register } from '@/requests/auth'
import { useAuth } from '@/hooks/useAuth'
import Checkbox from '../checkbox'
import sendCode from '@/requests/auth'
import { toast } from '@/components/toast'
import { useRouter } from '@/i18n/navigation'
import { useAreaList } from '@/requests'
import AreaCodeSelector from '@/components/area-code-selector'

interface MobileRegisterProps {
	onSwitchToLogin: () => void
	onSuccess?: () => void
	initialInviteCode?: string
}

export default function MobileRegister({ onSwitchToLogin, onSuccess, initialInviteCode }: MobileRegisterProps) {
	const t = useTranslations('auth.register')
	const tVerify = useTranslations('verifyCode')
	const [registerType, setRegisterType] = useState<'phone' | 'email'>('phone') // 注册类型：手机号或邮箱
	const [countryCode, setCountryCode] = useState('+86') // 区号
	const [phone, setPhone] = useState('') // 手机号
	const [email, setEmail] = useState('') // 邮箱
	const [code, setCode] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [inviteCode, setInviteCode] = useState(initialInviteCode || '')
	const [loading, setLoading] = useState(false)
	const [agreed, setAgreed] = useState(false)
	const { setAuth, initUserInfo } = useAuth()
	const router = useRouter()
	
	// 获取地区列表
	const { data: areaList = [] } = useAreaList()

	// 获取当前account（根据注册类型拼接）
	const getAccount = () => {
		if (registerType === 'phone') {
			return phone ? `${countryCode}${phone}` : ''
		}
		return email
	}

	// Verification code logic
	const [cooldown, setCooldown] = useState<number>(0)
	const timerRef = useRef<number | null>(null)
	const [sendingCode, setSendingCode] = useState<boolean>(false)

	useEffect(() => {
		if (cooldown <= 0 && timerRef.current) {
			window.clearInterval(timerRef.current)
			timerRef.current = null
		}
	}, [cooldown])

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				window.clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [])

	const handleSendCode = async () => {
		const account = getAccount()
		if (!account || cooldown > 0 || sendingCode) return
		try {
			setSendingCode(true)
			const type = registerType === 'email' ? 1 : 2
			const res = await sendCode(type, account)
			if (res.data.code === 0) {
				toast.success(tVerify('codeSent'))
				setCooldown(60)
				timerRef.current = window.setInterval(() => {
					setCooldown(prev => (prev > 0 ? prev - 1 : 0))
				}, 1000)
			} else {
				toast.error((res.data as any)?.msg || tVerify('sendCodeFailed'))
			}
		} catch (e: any) {
			const errorMsg = e?.response?.data?.msg || e?.message || tVerify('sendCodeFailedRetry')
			toast.error(errorMsg)
		} finally {
			setSendingCode(false)
		}
	}

	const handleRegister = async () => {
		const account = getAccount()
		if (!account || !password || !code || !agreed) {
			toast.warning(t('pleaseFillInAllFields') || 'Please fill in all required fields')
			return
		}
		if (password !== confirmPassword) {
			toast.error(t('passwordMismatch'))
			return
		}
		setLoading(true)
		try {
			const res = await register({
				type: registerType === 'email' ? 1 : 2,
				content: account,
				password: md5(password),
				captha: code,
				inviteCode: inviteCode || undefined,
				osType: 1
			})
			const data = (res.data as any)?.data
			if (data?.token && data?.userId) {
				setAuth({ token: data.token, userId: String(data.userId) })

				// 获取用户信息
				await initUserInfo()

				toast.success(t('registerSuccess') || 'Registration successful')
				
				// 检查是否需要跳转到抽奖页面
				if (data?.isLotteryInvite === 1) {
					router.push('/help-friend?showDialog=true')
				} else {
					// 调用成功回调
					onSuccess?.()
				}
			} else {
				// API返回了但是没有token或userId
				const msg = (res.data as any)?.msg || t('registerFailed') || 'Registration failed'
				toast.error(msg)
			}
		} catch (error: any) {
			// 捕获所有错误并显示toast
			const errorMsg = error?.response?.data?.msg || error?.message || t('registerFailed') || 'Registration failed, please try again'
			toast.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex h-full min-h-screen flex-col bg-[#0E0E10] px-7 pb-8 pt-20'>
			{/* Logo */}
			<div className='mb-6 flex justify-center'>
				<img src='/favicon.png' alt='logo' className='h-16 w-16' />
			</div>

			{/* Tab 切换 */}
			<div className='mb-4 flex gap-2 rounded-lg border border-white/5 bg-white/5 p-1'>
				<button
					type='button'
					onClick={() => {
						setRegisterType('phone')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						registerType === 'phone' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70]'
					}`}>
					{t('phoneTab')}
				</button>
				<button
					type='button'
					onClick={() => {
						setRegisterType('email')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						registerType === 'email' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70]'
					}`}>
					{t('emailTab')}
				</button>
			</div>

			{/* Form */}
			<div className='flex flex-col gap-4'>
				{/* 手机号输入 */}
				{registerType === 'phone' && (
					<div className='flex min-w-0 gap-2'>
						{/* 区号选择器 */}
						<AreaCodeSelector value={countryCode} onChange={setCountryCode} areaList={areaList} isMobile className='flex-shrink-0' />
						{/* 手机号输入框 */}
						<input
							type='tel'
							placeholder={t('phonePlaceholder')}
							value={phone}
							onChange={e => setPhone(e.target.value)}
							className='min-w-0 flex-1 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
						/>
					</div>
				)}

				{/* 邮箱输入 */}
				{registerType === 'email' && (
					<input
						type='email'
						placeholder={t('emailPlaceholder')}
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
					/>
				)}
				<div className='flex gap-2'>
					<input
						type='text'
						placeholder={t('verifyCodePlaceholder')}
						value={code}
						onChange={e => setCode(e.target.value)}
						className='min-w-0 flex-1 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
					/>
					<button
						type='button'
						disabled={!getAccount() || cooldown > 0 || sendingCode}
						onClick={handleSendCode}
						className='shrink-0 whitespace-nowrap rounded-lg border border-[#1D1D1D] bg-[#6741FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50'>
						{sendingCode ? '...' : cooldown > 0 ? `${cooldown}s` : t('sendCode')}
					</button>
				</div>
				<input
					type='password'
					placeholder={t('passwordPlaceholder')}
					value={password}
					onChange={e => setPassword(e.target.value)}
					className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
				/>
				<input
					type='password'
					placeholder={t('passwordConfirmPlaceholder')}
					value={confirmPassword}
					onChange={e => setConfirmPassword(e.target.value)}
					className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
				/>
				<input
					type='text'
					placeholder={t('inviteCodePlaceholder')}
					value={inviteCode}
					onChange={e => setInviteCode(e.target.value)}
					className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
				/>
			</div>

		{/* Terms Agreement */}
		<div className='mt-6 flex items-center gap-1'>
			<Checkbox checked={agreed} onChange={() => setAgreed(!agreed)} className='h-5 w-5' />
			<span className='text-sm font-medium text-[#6E6E70]'>
				{t('agreeTerms')}
				<button type='button' className='text-[#6741FF]' onClick={() => router.push('/terms')}>
					{t('userAgreement')}
				</button>
			</span>
		</div>

			{/* Submit Button */}
			<div className='mt-6 flex flex-col gap-2.5'>
				<button disabled={loading || !agreed} onClick={handleRegister} className='w-full rounded-lg border border-[#1D1D1D] bg-[#6741FF] px-4 py-3 text-base font-semibold text-white disabled:opacity-50'>
					{loading ? t('submitting') : t('submit')}
				</button>
			</div>

		{/* Login Link */}
		<div className='mt-6 flex justify-center'>
			<span className='text-sm font-semibold text-[#6E6E70]'>
				{t('hasAccount')}
				<button type='button' className='ml-1 text-[#6741FF] hover:underline' onClick={onSwitchToLogin}>
					{t('loginLink')}
				</button>
			</span>
		</div>
		</div>
	)
}

