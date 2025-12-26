import axios from '@/lib/axios'
import type { AuthResponse, CoinBalance, UserInfo } from '@/types'

// 导出类型供外部使用
export type { AuthResponse, CoinBalance, UserInfo }

// ==================== 发送验证码 ====================

/**
 * 发送验证码
 * @param type - 账号类型 1: 邮箱, 2: 手机号
 * @param content - 邮箱或手机号
 */
export default function sendCode(type: 1 | 2, content: string) {
	return axios.post<Res>('/email/send', {
		type,
		content
	})
}

// ==================== 登录 ====================

/**
 * 登录接口
 * @param params.type - 登录账号类型 1: 邮箱, 2: 手机号
 * @param params.content - 邮箱或手机号
 * @param params.sign - md5(content+nonce+md5(密码明文)+timestamp)
 * @param params.timestamp - 11位当前时间戳
 * @param params.nonce - 5-10位随机数
 * @param params.osType - 1: web, 2: ios, 3: android
 */
export function login(params: {
	type: 1 | 2
	content: string
	sign: string
	timestamp: number
	nonce: string
	osType: 1 | 2 | 3
}) {
	return axios.post<Res<AuthResponse>>('/login', params)
}

// ==================== 注册 ====================

/**
 * 注册接口
 * @param params.type - 账号类型 1: 邮箱, 2: 手机号
 * @param params.content - 邮箱或手机号
 * @param params.password - md5(明文)
 * @param params.captha - 验证码
 * @param params.ip - 客户端IP地址（可选）
 * @param params.lottory - 邀请码（可选）
 * @param params.osType - 1: web, 2: ios, 3: android
 */
export function register(params: {
	type: 1 | 2
	content: string
	password: string
	captha: string
	ip?: string
	inviteCode?: string
	osType: 1 | 2 | 3
}) {
	return axios.post<Res<AuthResponse>>('/register', params)
}

// ==================== 修改密码 ====================

/**
 * 修改/重置密码接口
 * @param params.userId - 用户ID (登录后重置密码必传)
 * @param params.contentType - 1: 邮箱, 2: 手机号 (忘记密码必传)
 * @param params.content - 邮箱或手机号 (忘记密码必传)
 * @param params.captha - 验证码 (忘记密码必传)
 * @param params.password - 新密码 (md5加密)
 * @param params.type - 1: 忘记密码, 2: 修改密码
 * @param params.originalPwd - 原密码 (登录后重置密码必传, md5加密)
 */
export function resetPassword(params: {
	userId?: number
	contentType?: 1 | 2
	content?: string
	captha?: string
	password: string
	type: 1 | 2
	originalPwd?: string
}) {
	return axios.post<Res<null>>('/pwd/reset', params)
}

// ==================== 登出 ====================

/**
 * 登出接口 (需要鉴权)
 * @param params.userId - 用户ID
 * @param params.osType - 1: web, 2: ios, 3: android
 */
export function logout(params: { userId: number; osType: 1 | 2 | 3 }) {
	return axios.post<Res<null>>('/logout', params)
}
