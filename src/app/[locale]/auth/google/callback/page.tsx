'use client'

import { useEffect } from 'react'

export default function GoogleCallbackPage() {
	useEffect(() => {
		const processAuth = () => {
			// 从 URL hash 中解析 access_token
			const hash = window.location.hash
			console.log('Google callback - hash:', hash)
			
			const params = new URLSearchParams(hash.substring(1))
			const token = params.get('access_token')
			const idToken = params.get('id_token')
			const error = params.get('error')

			console.log('Google callback - token:', token, 'idToken:', idToken, 'error:', error)

			if (error) {
				console.error('Google 授权错误:', error)
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(
						{
							type: 'google-auth-error',
							error: error
						},
						window.location.origin
					)
					window.close()
				} else {
					window.location.href = '/'
				}
				return
			}

			if (token || idToken) {
				// 优先使用 access_token，如果没有则使用 id_token
				const authToken = (token || idToken) as string
				console.log('Google callback - 使用 token 类型:', token ? 'access_token' : 'id_token')
				
				// 发送 token 到父窗口（弹窗模式）
				if (window.opener && !window.opener.closed) {
					console.log('Google callback - 发送 token 到父窗口（弹窗模式）')
					window.opener.postMessage(
						{
							type: 'google-auth',
							token: authToken
						},
						window.location.origin
					)
					// 延迟关闭窗口，确保消息发送成功
					setTimeout(() => {
						window.close()
					}, 500)
				} else {
					// 如果没有父窗口，说明是全页面跳转模式
					console.log('Google callback - 全页面跳转模式，存储 token 并重定向')
					localStorage.setItem('google_auth_token', authToken)
					
					// 获取返回URL，如果没有则返回首页
					const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
					sessionStorage.removeItem('auth_return_url')
					
					// 添加一个标记，让主页面知道需要处理 token
					sessionStorage.setItem('google_auth_pending', 'true')
					
					window.location.href = returnUrl
				}
			} else {
				console.warn('Google callback - 没有获取到 token')
				// 如果没有获取到 token，关闭窗口或显示错误
				if (window.opener && !window.opener.closed) {
					setTimeout(() => {
						window.close()
					}, 1000)
				} else {
					window.location.href = '/'
				}
			}
		}

		// 延迟执行，确保页面完全加载
		const timer = setTimeout(processAuth, 100)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className='flex min-h-screen items-center justify-center bg-[#0E0E10]'>
			<div className='text-center'>
				<div className='text-lg text-white'>正在处理 Google 登录...</div>
				<div className='mt-2 text-sm text-gray-400'>请稍候</div>
			</div>
		</div>
	)
}

