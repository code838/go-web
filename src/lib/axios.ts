import { API_URL } from '@/consts'
import { default as _axios } from 'axios'
import { getAuthToken, useAuth } from '@/hooks/useAuth'
import { toBcp47Locale, toUnderscoreLocale } from '@/lib/locale'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'

// 获取当前语言并转换为 API 需要的格式
const getAcceptLanguage = (): string => {
	if (typeof window === 'undefined') return 'zh_CN'

	// 优先从 html lang 获取（next-intl 会设置，如 en-US / zh-CN / zh-TW）
	const htmlLang = typeof document !== 'undefined' ? document.documentElement.lang : ''
	const fromHtml = toUnderscoreLocale(htmlLang)

	// 其次从 URL 路径中获取语言 (例如 /zh_cn/xxx 或 /en_us/xxx)
	const pathname = window.location.pathname
	const fromPath = toUnderscoreLocale(pathname.split('/')[1])

	// 选取可用的 locale
	const locale = fromHtml || fromPath
	if (!locale) return 'zh_CN'

	// 对于后端仅识别的特殊大小写写法，做定制映射
	if (locale === 'zh_cn') return 'zh_CN'
	if (locale === 'en_us') return 'en_US'

	// 其他语言直接回传所选语言（保持与路由一致，如 de / fr / ja / zh_tw）
	return locale
}

const axios = _axios.create({
	baseURL: API_URL,
	headers: {
		'OS-Type': 1
	}
})

axios.interceptors.request.use(config => {
	const token = getAuthToken()
	if (token) {
		config.headers.Authorization = `${token}`
	}
	// 动态设置 Accept-Language
	config.headers['Accept-Language'] = getAcceptLanguage()
	return config
})

// 检测是否为手机模式
const isMobileDevice = (): boolean => {
	if (typeof window === 'undefined') return false
	return window.matchMedia('(max-width: 1023px)').matches
}

axios.interceptors.response.use(
	response => {
		const data: any = response?.data
		if (response?.status === 200 && data && Number(data.code) === 401) {
			handleTokenExpired()
		}
		return response
	},
	error => {
		// 处理 401 未授权错误
		const status = error?.response?.status
		const code = error?.response?.data?.code
		
		if (status === 401 || Number(code) === 401) {
			handleTokenExpired()
		}
		
		return Promise.reject(error)
	}
)

// 处理 token 过期的统一逻辑
const handleTokenExpired = () => {
	try {
		// 清除认证信息
		useAuth.getState().clearAuth()
		
		// 如果是手机模式，跳转到登录页面
		if (isMobileDevice()) {
			const locale = toUnderscoreLocale(document.documentElement.lang) || 'zh_cn'
			window.location.href = `/${locale}/auth`
		} else {
			// PC 模式，打开登录弹框
			useAuthDialogStore.getState().openDialog('login')
		}
	} catch (_) {
		// noop
	}
}

export default axios
