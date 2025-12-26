'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import md5 from 'blueimp-md5'
import { resetPassword } from '@/requests/auth'
import sendCode from '@/requests/auth'
import { toast } from '@/components/toast'
import { useAreaList } from '@/requests'
import AreaCodeSelector from '@/components/area-code-selector'

interface MobileForgotPasswordProps {
	onSwitchToLogin: () => void
	onSuccess?: () => void
}

export default function MobileForgotPassword({ onSwitchToLogin, onSuccess }: MobileForgotPasswordProps) {
	const t = useTranslations('auth.forgotPassword')
	const tVerify = useTranslations('verifyCode')
	const [resetType, setResetType] = useState<'phone' | 'email'>('phone') // 重置类型：手机号或邮箱
	const [countryCode, setCountryCode] = useState('+86') // 区号
	const [phone, setPhone] = useState('') // 手机号
	const [email, setEmail] = useState('') // 邮箱
	const [code, setCode] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)
	
	// 获取地区列表
	const { data: areaList = [] } = useAreaList()

	// 获取当前account（根据类型拼接）
	const getAccount = () => {
		if (resetType === 'phone') {
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
			const type = resetType === 'email' ? 1 : 2
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

	const handleReset = async () => {
		const account = getAccount()
		if (!account || !code || !password) {
			toast.warning(t('pleaseFillInAllFields') || 'Please fill in all required fields')
			return
		}
		if (password !== confirmPassword) {
			toast.error(t('passwordMismatch'))
			return
		}
		setLoading(true)
		try {
			const res = await resetPassword({
				contentType: resetType === 'email' ? 1 : 2,
				content: account,
				password: md5(password),
				captha: code,
				type: 1
			})
			// reset success, go to login
			if (res.data.code === 0) {
				toast.success(t('resetSuccess') || 'Password reset successful')
				onSwitchToLogin()
				onSuccess?.()
			} else {
				// API返回了但是code不是0
				const msg = (res.data as any)?.msg || t('resetFailed') || 'Password reset failed'
				toast.error(msg)
			}
		} catch (error: any) {
			// 捕获所有错误并显示toast
			const errorMsg = error?.response?.data?.msg || error?.message || t('resetFailed') || 'Password reset failed, please try again'
			toast.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex h-full min-h-screen flex-col bg-[#0E0E10] px-7 pb-8 pt-32'>
			{/* Logo */}
			<div className='mb-6 flex justify-center'>
				<img src='/favicon.png' alt='logo' className='h-16 w-16' />
			</div>

			{/* Tab 切换 */}
			<div className='mb-4 flex gap-2 rounded-lg border border-white/5 bg-white/5 p-1'>
				<button
					type='button'
					onClick={() => {
						setResetType('phone')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						resetType === 'phone' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70]'
					}`}>
					{t('phoneTab')}
				</button>
				<button
					type='button'
					onClick={() => {
						setResetType('email')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						resetType === 'email' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70]'
					}`}>
					{t('emailTab')}
				</button>
			</div>

			{/* Form */}
			<div className='flex flex-col gap-4'>
				{/* 手机号输入 */}
				{resetType === 'phone' && (
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
				{resetType === 'email' && (
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
					placeholder={t('newPasswordPlaceholder')}
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
			</div>

			{/* Submit Button */}
			<div className='mt-6 flex flex-col gap-2.5'>
				<button disabled={loading} onClick={handleReset} className='w-full rounded-lg bg-[#6741FF] px-4 py-3 text-base font-semibold text-white disabled:opacity-50'>
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

