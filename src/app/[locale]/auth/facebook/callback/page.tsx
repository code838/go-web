'use client'

import { useEffect } from 'react'

export default function FacebookCallbackPage() {
	useEffect(() => {
		const processAuth = () => {
			// Facebook OAuth 返回的 access_token 在 URL hash 中
			const hash = window.location.hash
			const params = new URLSearchParams(hash.substring(1))
			const accessToken = params.get('access_token')
			const error = params.get('error')

			// 也检查 URL 参数（某些情况下可能在这里）
			const urlParams = new URLSearchParams(window.location.search)
			const code = urlParams.get('code')

			console.log('Facebook callback - accessToken:', accessToken, 'code:', code, 'error:', error)

			if (error) {
				console.error('Facebook 授权错误:', error)
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(
						{
							type: 'facebook-auth-error',
							error: error
						},
						window.location.origin
					)
					window.close()
				} else {
					const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
					sessionStorage.removeItem('auth_return_url')
					window.location.href = returnUrl
				}
				return
			}

			if (accessToken) {
				// 发送 token 到父窗口（弹窗模式）
				if (window.opener && !window.opener.closed) {
					console.log('Facebook callback - 发送 token 到父窗口（弹窗模式）')
					window.opener.postMessage(
						{
							type: 'facebook-auth',
							token: accessToken
						},
						window.location.origin
					)
					setTimeout(() => {
						window.close()
					}, 500)
				} else {
					// 如果没有父窗口，说明是全页面跳转模式
					console.log('Facebook callback - 全页面跳转模式，存储 token 并重定向')
					localStorage.setItem('facebook_auth_token', accessToken)
					
					// 获取返回URL，如果没有则返回首页
					const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
					sessionStorage.removeItem('auth_return_url')
					
					// 添加一个标记，让主页面知道需要处理 token
					sessionStorage.setItem('facebook_auth_pending', 'true')
					
					window.location.href = returnUrl
				}
			} else if (code) {
				// 如果返回的是 code，需要后端交换 token
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(
						{
							type: 'facebook-auth',
							code: code
						},
						window.location.origin
					)
					window.close()
				} else {
					const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
					sessionStorage.removeItem('auth_return_url')
					window.location.href = returnUrl
				}
			} else {
				// 没有获取到授权信息或用户取消了授权
				console.warn('Facebook callback - 没有获取到 token')
				if (window.opener && !window.opener.closed) {
					setTimeout(() => {
						window.close()
					}, 1000)
				} else {
					const returnUrl = sessionStorage.getItem('auth_return_url') || '/'
					sessionStorage.removeItem('auth_return_url')
					window.location.href = returnUrl
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
				<div className='text-lg text-white'>正在处理 Facebook 登录...</div>
				<div className='mt-2 text-sm text-gray-400'>请稍候</div>
			</div>
		</div>
	)
}

