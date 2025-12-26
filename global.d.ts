declare module '*.svg' {
	export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
	export default ReactComponent
}
declare module '*.svg?url' {
	const content: StaticImageData

	export default content
}

declare type NullableNumber = string | number | null
declare type NullableObject = Record<string, any> | null
declare type NullableArray = Record<string, any>[] | null
declare type Nullable<T> = T | null

declare type Res<T = any> = {
	data: T
	message: string
	code: number
	msg?: string
}

declare module 'blueimp-md5'

// 第三方登录 SDK 类型声明
interface Window {
	FB?: {
		init: (params: {
			appId: string
			cookie: boolean
			xfbml: boolean
			version: string
		}) => void
		login: (
			callback: (response: {
				authResponse?: {
					accessToken: string
					userID: string
					expiresIn: number
				}
				status: string
			}) => void,
			options?: { scope: string }
		) => void
	}
	Telegram?: {
		Login?: {
			auth: (options: any, callback: (user: any) => void) => void
		}
	}
	onTelegramAuth?: (user: any) => void
}