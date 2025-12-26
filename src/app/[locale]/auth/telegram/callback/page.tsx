'use client'

import { useEffect } from 'react'

export default function TelegramCallbackPage() {
	useEffect(() => {
		// Telegram 通常通过 Widget 直接回调
		// 这个页面作为备用方案
		const urlParams = new URLSearchParams(window.location.search)
		const authData: any = {}

		// 获取 Telegram 返回的参数
		urlParams.forEach((value, key) => {
			authData[key] = value
		})

		if (authData.id && authData.hash) {
			// 发送到父窗口
			if (window.opener) {
				window.opener.postMessage(
					{
						type: 'telegram-auth',
						token: JSON.stringify(authData)
					},
					window.location.origin
				)
				window.close()
			} else {
				// 如果没有父窗口，存储并重定向
				localStorage.setItem('telegram_auth_data', JSON.stringify(authData))
				window.location.href = '/'
			}
		} else {
			// 没有获取到授权信息
			if (window.opener) {
				window.close()
			} else {
				window.location.href = '/'
			}
		}
	}, [])

	return (
		<div className='flex min-h-screen items-center justify-center bg-[#0E0E10]'>
			<div className='text-center'>
				<div className='text-lg text-white'>正在处理 Telegram 登录...</div>
				<div className='mt-2 text-sm text-gray-400'>请稍候</div>
			</div>
		</div>
	)
}

