'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import md5 from 'blueimp-md5'
import { login } from '@/requests/auth'
import { useAuth } from '@/hooks/useAuth'
import Checkbox from '../checkbox'
import FacebookSVG from '@/svgs/auth/facebook.svg'
import GoogleSVG from '@/svgs/auth/google.svg'
import TGSVG from '@/svgs/auth/tg.svg'
import { toast } from '@/components/toast'
import { useThirdLoginInfoForAuth, useThirdLogin, useAreaList } from '@/requests'
import AreaCodeSelector from '@/components/area-code-selector'

interface MobileLoginProps {
	onSwitchToRegister: () => void
	onSwitchToForgotPassword: () => void
	onSuccess?: () => void
}

export default function MobileLogin({ onSwitchToRegister, onSwitchToForgotPassword, onSuccess }: MobileLoginProps) {
	const t = useTranslations('auth.login')
	const tCommon = useTranslations('common')
	const [loginType, setLoginType] = useState<'phone' | 'email'>('phone') // 登录类型：手机号或邮箱
	const [countryCode, setCountryCode] = useState('+86') // 区号
	const [phone, setPhone] = useState('') // 手机号
	const [email, setEmail] = useState('') // 邮箱
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const { setAuth, initUserInfo } = useAuth()
	const [remember, setRemember] = useState(false)
	
	// 获取第三方登录配置
	const { data: thirdLoginConfig } = useThirdLoginInfoForAuth()
	const thirdLoginMutation = useThirdLogin()
	
	// 获取地区列表
	const { data: areaList = [] } = useAreaList()
	
	// 获取当前account（根据登录类型拼接）
	const getAccount = () => {
		if (loginType === 'phone') {
			return phone ? `${countryCode}${phone}` : ''
		}
		return email
	}

	useEffect(() => {
		const rememberedAccount = localStorage.getItem('remembered-account')
		if (rememberedAccount) {
			// 根据账号格式判断是手机号还是邮箱
			if (rememberedAccount.includes('@')) {
				setLoginType('email')
				setEmail(rememberedAccount)
			} else {
				setLoginType('phone')
				// 从账号中提取区号和手机号
				const match = rememberedAccount.match(/^(\+\d+)(.+)$/)
				if (match) {
					setCountryCode(match[1])
					setPhone(match[2])
				}
			}
			setRemember(true)
		}

		// 检查是否有待处理的第三方认证
		const checkPendingAuth = async () => {
			// 首先检查 URL hash 中是否有第三方登录的 token（处理直接重定向到首页的情况）
			const hash = window.location.hash
			if (hash) {
				const params = new URLSearchParams(hash.substring(1))
				const accessToken = params.get('access_token')
				const idToken = params.get('id_token')
				const error = params.get('error')
				
				if (error) {
					console.error('第三方授权错误:', error)
					toast.error('授权失败，请重试')
					// 清除 hash
					window.history.replaceState(null, '', window.location.pathname + window.location.search)
					return
				}

				// 区分 Google 和 Facebook 登录
				// Google 返回: id_token + access_token
				// Facebook 返回: 只有 access_token
				if (idToken) {
					// 有 id_token 说明是 Google 登录
					const token = (accessToken || idToken) as string
					console.log('从 URL hash 检测到 Google 登录 token:', accessToken ? 'access_token' : 'id_token')
					
					// 显示加载提示
					toast.info('正在登录，请稍候...')
					
					// 清除 hash
					window.history.replaceState(null, '', window.location.pathname + window.location.search)
					await handleThirdPartyLogin(1, token)
					return
				} else if (accessToken) {
					// 只有 access_token 说明是 Facebook 登录
					console.log('从 URL hash 检测到 Facebook 登录 token')
					
					// 显示加载提示
					toast.info('正在登录，请稍候...')
					
					// 清除 hash
					window.history.replaceState(null, '', window.location.pathname + window.location.search)
					await handleThirdPartyLogin(2, accessToken)
					return
				}
			}

			// 检查 localStorage 中待处理的 Google 认证
			const googlePending = sessionStorage.getItem('google_auth_pending')
			const googleToken = localStorage.getItem('google_auth_token')
			
			if (googlePending === 'true' && googleToken) {
				console.log('检测到待处理的 Google 认证')
				// 显示加载提示
				toast.info('正在登录，请稍候...')
				sessionStorage.removeItem('google_auth_pending')
				localStorage.removeItem('google_auth_token')
				await handleThirdPartyLogin(1, googleToken)
				return
			}

			// 检查 localStorage 中待处理的 Facebook 认证
			const facebookPending = sessionStorage.getItem('facebook_auth_pending')
			const facebookToken = localStorage.getItem('facebook_auth_token')
			
			if (facebookPending === 'true' && facebookToken) {
				console.log('检测到待处理的 Facebook 认证')
				// 显示加载提示
				toast.info('正在登录，请稍候...')
				sessionStorage.removeItem('facebook_auth_pending')
				localStorage.removeItem('facebook_auth_token')
				await handleThirdPartyLogin(2, facebookToken)
				return
			}
		}
		
		checkPendingAuth()
	}, [])

	const handleLogin = async () => {
		const currentAccount = getAccount()
		if (!currentAccount || !password) {
			toast.warning(t('pleaseFillInAccountAndPassword') || 'Please fill in account and password')
			return
		}
		setLoading(true)
		try {
			const timestamp = Math.floor(Date.now() / 1000)
			const nonce = Math.random().toString(36).slice(2, 8)
			const inner = md5(password)
			const sign = md5(`${currentAccount}${nonce}${inner}${timestamp}`)
			const res = await login({
				type: loginType === 'email' ? 1 : 2,
				content: currentAccount,
				sign: sign,
				timestamp,
				nonce,
				osType: 1
			})
			const data = (res.data as any)?.data
			if (data?.token && data?.userId) {
				setAuth({ token: data.token, userId: String(data.userId) })

				if (remember) {
					localStorage.setItem('remembered-account', getAccount())
				} else {
					localStorage.removeItem('remembered-account')
				}

				// 获取用户信息
				await initUserInfo()

				toast.success(t('loginSuccess') || 'Login successful')
				// 调用成功回调
				onSuccess?.()
			} else {
				// API返回了但是没有token或userId
				const msg = (res.data as any)?.msg || t('loginFailed') || 'Login failed'
				toast.error(msg)
			}
		} catch (error: any) {
			// 捕获所有错误并显示toast
			const errorMsg = error?.response?.data?.msg || error?.message || t('loginFailed') || 'Login failed, please try again'
			toast.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	// Google 登录处理
	const handleGoogleLogin = () => {
		const googleConfig = thirdLoginConfig?.find(item => item.type === 1)
		if (!googleConfig) {
			toast.error('Google 登录配置不可用')
			return
		}

		try {
			// 构建完整的 redirect_uri
			const baseUrl = window.location.origin
			const locale = window.location.pathname.split('/')[1] || 'zh_cn'
			const redirectUri = googleConfig.url || `${baseUrl}/${locale}/auth/google/callback`
			
			console.log('Google 登录 - redirectUri:', redirectUri)
			
			// 构建 Google OAuth URL
			const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
			authUrl.searchParams.set('client_id', googleConfig.clientId)
			authUrl.searchParams.set('redirect_uri', redirectUri)
			authUrl.searchParams.set('response_type', 'token id_token')
			authUrl.searchParams.set('scope', googleConfig.scope || 'openid email profile')
			authUrl.searchParams.set('nonce', Math.random().toString(36).substring(2))
			
			console.log('Google 登录 - authUrl:', authUrl.toString())
			
			// 保存当前页面路径，以便登录后返回
			sessionStorage.setItem('auth_return_url', window.location.pathname)
			
			// iOS Safari 需要在同步代码中执行跳转，不能有 async/await
			// 使用 location.assign 或 location.replace 在 iOS 上更可靠
			window.location.assign(authUrl.toString())
		} catch (error: any) {
			console.error('Google 登录错误:', error)
			toast.error(error?.message || tCommon('googleLoginFailed'))
		}
	}

	// Facebook 登录处理
	const handleFacebookLogin = () => {
		const fbConfig = thirdLoginConfig?.find(item => item.type === 2)
		if (!fbConfig) {
			toast.error(tCommon('facebookConfigUnavailable'))
			return
		}

		try {
			// 构建完整的 redirect_uri
			const baseUrl = window.location.origin
			const locale = window.location.pathname.split('/')[1] || 'zh_cn'
			const redirectUri = fbConfig.url || `${baseUrl}/${locale}/auth/facebook/callback`
			
			// 构建 Facebook OAuth URL
			const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
			authUrl.searchParams.set('client_id', fbConfig.clientId)
			authUrl.searchParams.set('redirect_uri', redirectUri)
			authUrl.searchParams.set('response_type', 'token')
			authUrl.searchParams.set('scope', 'public_profile,email')
			
			console.log('Facebook 登录 - authUrl:', authUrl.toString())
			
			// 保存当前页面路径，以便登录后返回
			sessionStorage.setItem('auth_return_url', window.location.pathname)
			
			// iOS Safari 需要在同步代码中执行跳转，不能有 async/await
			// 使用 location.assign 或 location.replace 在 iOS 上更可靠
			window.location.assign(authUrl.toString())
		} catch (error: any) {
			console.error('Facebook 登录错误:', error)
			toast.error(error?.message || tCommon('facebookLoginFailed'))
		}
	}

	// Telegram 登录处理
	const handleTelegramLogin = async () => {
		const tgConfig = thirdLoginConfig?.find(item => item.type === 3)
		if (!tgConfig) {
			toast.error(tCommon('telegramConfigUnavailable'))
			return
		}

		try {
			// 统一使用 Widget 方式（官方推荐，支持移动端和桌面端）
			showTelegramWidget(tgConfig)
		} catch (error: any) {
			console.error('Telegram 登录错误:', error)
			toast.error(error?.message || tCommon('telegramLoginFailed'))
		}
	}

	// Telegram Widget 方式（官方推荐，支持移动端和桌面端）
	const showTelegramWidget = (tgConfig: any) => {
		const containerId = 'telegram-login-container'
		let container = document.getElementById(containerId)
		
		// 移除旧的容器
		if (container) {
			container.remove()
		}
		
		const overlayId = 'telegram-login-overlay'
		let overlay = document.getElementById(overlayId)
		if (overlay) {
			overlay.remove()
		}
		
		// 创建新的容器
		container = document.createElement('div')
		container.id = containerId
		container.style.position = 'fixed'
		container.style.top = '50%'
		container.style.left = '50%'
		container.style.transform = 'translate(-50%, -50%)'
		container.style.zIndex = '10001'
		container.style.backgroundColor = '#fff'
		container.style.padding = '24px'
		container.style.borderRadius = '16px'
		container.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
		container.style.maxWidth = '90%'
		container.style.width = '400px'
		document.body.appendChild(container)

		// 创建遮罩层
		overlay = document.createElement('div')
		overlay.id = overlayId
		overlay.style.position = 'fixed'
		overlay.style.top = '0'
		overlay.style.left = '0'
		overlay.style.right = '0'
		overlay.style.bottom = '0'
		overlay.style.backgroundColor = 'rgba(0,0,0,0.5)'
		overlay.style.zIndex = '10000'
		overlay.onclick = () => {
			const cont = document.getElementById(containerId)
			const over = document.getElementById(overlayId)
			cont?.remove()
			over?.remove()
		}
		document.body.appendChild(overlay)

		// 标题和关闭按钮
		const header = document.createElement('div')
		header.style.marginBottom = '20px'
		header.style.display = 'flex'
		header.style.justifyContent = 'space-between'
		header.style.alignItems = 'center'
		
		const title = document.createElement('div')
		title.textContent = 'Telegram 登录'
		title.style.fontSize = '20px'
		title.style.fontWeight = 'bold'
		title.style.color = '#333'
		
		const closeBtn = document.createElement('button')
		closeBtn.textContent = '×'
		closeBtn.style.border = 'none'
		closeBtn.style.background = 'none'
		closeBtn.style.fontSize = '28px'
		closeBtn.style.cursor = 'pointer'
		closeBtn.style.color = '#999'
		closeBtn.style.padding = '0'
		closeBtn.style.width = '32px'
		closeBtn.style.height = '32px'
		closeBtn.style.display = 'flex'
		closeBtn.style.alignItems = 'center'
		closeBtn.style.justifyContent = 'center'
		closeBtn.onclick = () => {
			const cont = document.getElementById(containerId)
			const over = document.getElementById(overlayId)
			cont?.remove()
			over?.remove()
		}
		
		header.appendChild(title)
		header.appendChild(closeBtn)
		container.appendChild(header)

		// 说明文字
		const description = document.createElement('div')
		description.textContent = '点击下方按钮，在 Telegram 中完成授权登录'
		description.style.fontSize = '14px'
		description.style.color = '#666'
		description.style.marginBottom = '20px'
		description.style.textAlign = 'center'
		container.appendChild(description)

		// Widget 容器
		const widgetContainer = document.createElement('div')
		widgetContainer.style.display = 'flex'
		widgetContainer.style.justifyContent = 'center'
		widgetContainer.style.alignItems = 'center'
		widgetContainer.style.minHeight = '50px'
		widgetContainer.style.flexDirection = 'column'
		widgetContainer.style.gap = '12px'
		container.appendChild(widgetContainer)

		// 授权回调
		window.onTelegramAuth = async (user: any) => {
			console.log('Telegram 授权成功:', user)
			const cont = document.getElementById(containerId)
			const over = document.getElementById(overlayId)
			cont?.remove()
			over?.remove()
			
			// 显示加载提示
			toast.info('正在登录，请稍候...')
			
			const authData = JSON.stringify(user)
			await handleThirdPartyLogin(3, authData)
		}

		// 加载 Telegram Widget 脚本
		const script = document.createElement('script')
		script.async = true
		script.src = 'https://telegram.org/js/telegram-widget.js?22'
		script.setAttribute('data-telegram-login', tgConfig.clientId)
		script.setAttribute('data-size', 'large')
		script.setAttribute('data-radius', '8')
		script.setAttribute('data-onauth', 'onTelegramAuth(user)')
		script.setAttribute('data-request-access', 'write')
		
		// 错误处理：检测 Widget 加载失败
		script.onerror = () => {
			console.error('Telegram Widget 加载失败')
			const errorMsg = document.createElement('div')
			errorMsg.textContent = '⚠️ Telegram 服务暂时无法连接，请稍后重试'
			errorMsg.style.color = '#f44336'
			errorMsg.style.fontSize = '14px'
			errorMsg.style.textAlign = 'center'
			errorMsg.style.padding = '12px'
			errorMsg.style.backgroundColor = '#ffebee'
			errorMsg.style.borderRadius = '8px'
			errorMsg.style.marginTop = '12px'
			widgetContainer.appendChild(errorMsg)
		}
		
		widgetContainer.appendChild(script)

		// 添加帮助文字
		const helpText = document.createElement('div')
		helpText.style.fontSize = '12px'
		helpText.style.color = '#999'
		helpText.style.textAlign = 'center'
		helpText.style.marginTop = '16px'
		helpText.style.lineHeight = '1.5'
		// helpText.innerHTML = '如果遇到 "Bot domain invalid" 或 CSP 错误<br/>请使用标准端口访问 (https://liberty7788.top)<br/>或联系管理员配置反向代理'
		container.appendChild(helpText)

		// 检测 CSP 错误并提供备用方案
		setTimeout(() => {
			const iframe = widgetContainer.querySelector('iframe')
			if (!iframe) {
				// Widget 可能因为 CSP 错误无法加载
				console.warn('Telegram Widget 未能加载，可能是 CSP 或域名配置问题')
				
				// 显示错误提示和建议
				const errorContainer = document.createElement('div')
				errorContainer.style.textAlign = 'center'
				errorContainer.style.padding = '20px'
				
				const errorIcon = document.createElement('div')
				errorIcon.textContent = '⚠️'
				errorIcon.style.fontSize = '48px'
				errorIcon.style.marginBottom = '16px'
				
				const errorTitle = document.createElement('div')
				errorTitle.textContent = 'Telegram 登录暂时无法使用'
				errorTitle.style.fontSize = '16px'
				errorTitle.style.fontWeight = 'bold'
				errorTitle.style.color = '#333'
				errorTitle.style.marginBottom = '12px'
				
				const errorMessage = document.createElement('div')
				errorMessage.style.fontSize = '14px'
				errorMessage.style.color = '#666'
				errorMessage.style.lineHeight = '1.6'
				errorMessage.style.marginBottom = '16px'
				// errorMessage.innerHTML = '当前域名不支持 Telegram Widget<br/>请使用标准端口访问：<br/><strong>https://liberty7788.top</strong><br/>(不带 :8091)'
				
				const suggestion = document.createElement('div')
				suggestion.style.fontSize = '12px'
				suggestion.style.color = '#999'
				suggestion.style.backgroundColor = '#f5f5f5'
				suggestion.style.padding = '12px'
				suggestion.style.borderRadius = '8px'
				suggestion.style.lineHeight = '1.6'
				suggestion.innerHTML = '建议：配置 Nginx 反向代理，<br/>将 443 端口映射到 8091 端口'
				
				errorContainer.appendChild(errorIcon)
				errorContainer.appendChild(errorTitle)
				errorContainer.appendChild(errorMessage)
				errorContainer.appendChild(suggestion)
				
				widgetContainer.innerHTML = ''
				widgetContainer.appendChild(errorContainer)
			}
		}, 3000) // 3秒后检查
	}

	// 统一的第三方登录处理
	const handleThirdPartyLogin = async (type: number, token: string) => {
		try {
			console.log('第三方登录开始 - type:', type, 'token:', token?.substring(0, 50) + '...')
			
			const res = await thirdLoginMutation.mutateAsync({
				type,
				token
			})

			console.log('第三方登录响应:', res.data)

			const data = res.data.data
			if (data?.token && data?.userId) {
				console.log('登录成功，保存认证信息 - token:', data.token?.substring(0, 20) + '...', 'userId:', data.userId)
				
				// 保存认证信息
				setAuth({ token: data.token, userId: String(data.userId) })
				
				// 获取用户信息
				await initUserInfo()
				
				// 显示成功提示
				toast.success(t('loginSuccess'))
				
				// 关闭登录页面
				onSuccess?.()
				
				// 验证是否存储成功
				const stored = localStorage.getItem('auth-store')
				console.log('验证存储结果:', stored ? '已存储' : '存储失败')
			} else {
				console.error('登录响应数据不完整:', data)
				toast.error(tCommon('loginFailedIncompleteData'))
			}
		} catch (error: any) {
			console.error('第三方登录错误:', error)
			const errorMsg = error?.response?.data?.msg || error?.message || tCommon('thirdPartyLoginFailed')
			toast.error(errorMsg)
		}
	}


	return (
		<div className='flex h-full min-h-screen flex-col bg-[#0E0E10] px-7 pb-8 pt-32'>
			{/* Logo */}
			<div className='mb-6 flex justify-center'>
				<img src='/favicon.png' alt='logo' className='h-16 w-16' />
			</div>

			{/* Tab 切换 */}
			<div className='mb-4 flex gap-2 rounded-lg border border-white/10 p-1'>
				<button
					type='button'
					onClick={() => setLoginType('phone')}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
						loginType === 'phone' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70] hover:text-white'
					}`}>
					{t('phoneTab')}
				</button>
				<button
					type='button'
					onClick={() => setLoginType('email')}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
						loginType === 'email' ? 'bg-[#6741FF] text-white' : 'text-[#6E6E70] hover:text-white'
					}`}>
					{t('emailTab')}
				</button>
			</div>

			{/* Form */}
			<div className='flex flex-col gap-3'>
				{/* 手机号输入 */}
				{loginType === 'phone' && (
					<div className='flex min-w-0 gap-2'>
						{/* 区号选择器 */}
						<AreaCodeSelector 
							value={countryCode} 
							onChange={setCountryCode} 
							areaList={areaList} 
							isMobile={true}
							className='flex-shrink-0'
						/>
						{/* 手机号输入框 */}
						<input
							type='tel'
							name='phone'
							placeholder={t('phonePlaceholder')}
							value={phone}
							onChange={e => setPhone(e.target.value)}
							className='min-w-0 flex-1 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
						/>
					</div>
				)}

				{/* 邮箱输入 */}
				{loginType === 'email' && (
					<input
						type='email'
						name='email'
						placeholder={t('emailPlaceholder')}
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
					/>
				)}

				<input
					type='password'
					placeholder={t('passwordPlaceholder')}
					value={password}
					onChange={e => setPassword(e.target.value)}
					className='w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-[#6E6E70] outline-none focus:border-white/10'
				/>
			<div className='flex items-center justify-between'>
				<div onClick={() => setRemember(!remember)} className='inline-flex cursor-pointer select-none items-center gap-1 text-sm text-[#6E6E70]'>
					<Checkbox checked={remember} className='h-5 w-5' onChange={() => setRemember(!remember)} />
					<span>{t('rememberAccount')}</span>
				</div>
				<button type='button' className='text-sm font-semibold text-[#6E6E70] hover:text-white' onClick={onSwitchToForgotPassword}>
					{t('forgotPassword')}
				</button>
			</div>
			</div>

			{/* Submit Button */}
			<div className='mt-6 flex flex-col gap-2.5'>
				<button disabled={loading} onClick={handleLogin} className='w-full rounded-lg bg-[#6741FF] px-4 py-3 text-base font-semibold text-white disabled:opacity-50'>
					{loading ? t('submitting') : t('submit')}
				</button>
			</div>

		{/* Divider */}
		{thirdLoginConfig && thirdLoginConfig.length > 0 && (
			<>
				<div className='mt-6 flex items-center justify-center gap-2.5'>
					<div className='h-px flex-1 bg-[#1D1D1D]'></div>
					<span className='text-xs font-semibold text-[#6E6E70]'>{t('orContinueWith')}</span>
					<div className='h-px flex-1 bg-[#1D1D1D]'></div>
				</div>

				{/* Social Login */}
				<div className='mt-6 flex justify-center gap-3'>
					{thirdLoginConfig.find(item => item.type === 1) && (
						<button onClick={handleGoogleLogin} className='flex h-8 w-8 items-center justify-center hover:opacity-80 transition-opacity'>
							<GoogleSVG />
						</button>
					)}
					{thirdLoginConfig.find(item => item.type === 2) && (
						<button onClick={handleFacebookLogin} className='flex h-8 w-8 items-center justify-center hover:opacity-80 transition-opacity'>
							<FacebookSVG />
						</button>
					)}
					{thirdLoginConfig.find(item => item.type === 3) && (
						<button onClick={handleTelegramLogin} className='flex h-8 w-8 items-center justify-center hover:opacity-80 transition-opacity'>
							<TGSVG />
						</button>
					)}
				</div>
			</>
		)}

		{/* Register Link */}
		<div className='mt-6 flex justify-center'>
			<span className='text-sm font-semibold text-[#6E6E70]'>
				{t('noAccount')}
				<button type='button' className='ml-1 text-[#6741FF] hover:underline' onClick={onSwitchToRegister}>
					{t('registerLink')}
				</button>
			</span>
		</div>
		</div>
	)
}

