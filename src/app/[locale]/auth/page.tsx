'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MobileLogin from '@/components/mobile-auth/login'
import MobileRegister from '@/components/mobile-auth/register'
import MobileForgotPassword from '@/components/mobile-auth/forgot-password'

type AuthMode = 'login' | 'register' | 'forgot-password'

export default function AuthPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [mode, setMode] = useState<AuthMode>('login')
	const [inviteCode, setInviteCode] = useState<string>('')

	useEffect(() => {
		const modeParam = searchParams.get('mode') as AuthMode
		if (modeParam && ['login', 'register', 'forgot-password'].includes(modeParam)) {
			setMode(modeParam)
		}
		// 获取邀请码参数
		const inviteParam = searchParams.get('invite')
		if (inviteParam) {
			setInviteCode(inviteParam)
		}
	}, [searchParams])

	const handleSuccess = () => {
		// 登录/注册成功后返回上一页或首页
		const from = searchParams.get('from')
		if (from) {
			router.push(decodeURIComponent(from))
		} else {
			router.push('/')
		}
	}

	const handleSwitchMode = (newMode: AuthMode) => {
		setMode(newMode)
		// 更新URL参数
		const params = new URLSearchParams(searchParams.toString())
		params.set('mode', newMode)
		router.replace(`?${params.toString()}`, { scroll: false })
	}

	return (
		<div className='min-h-screen bg-[#0E0E10]'>
			{mode === 'login' && (
				<MobileLogin
					onSwitchToRegister={() => handleSwitchMode('register')}
					onSwitchToForgotPassword={() => handleSwitchMode('forgot-password')}
					onSuccess={handleSuccess}
				/>
			)}
			{mode === 'register' && (
				<MobileRegister 
					onSwitchToLogin={() => handleSwitchMode('login')} 
					onSuccess={handleSuccess}
					initialInviteCode={inviteCode}
				/>
			)}
			{mode === 'forgot-password' && (
				<MobileForgotPassword 
					onSwitchToLogin={() => handleSwitchMode('login')} 
					onSuccess={handleSuccess} 
				/>
			)}
		</div>
	)
}

