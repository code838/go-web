import { useAuthDialogStore } from './store'
import DialogShell from '../dialog-shell'
import { useState, useEffect } from 'react'
import md5 from 'blueimp-md5'
import VerifyCode from '@/components/verify-code'
import { register } from '@/requests/auth'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast'
import { useAreaList } from '@/requests'
import AreaCodeSelector from '@/components/area-code-selector'
import { useRouter } from '@/i18n/navigation'

export default function RegisterDialog() {
	const t = useTranslations('auth.register')
	const { openDialog, closeDialog, inviteCode: storeInviteCode } = useAuthDialogStore()
	const [registerType, setRegisterType] = useState<'phone' | 'email'>('phone') // 注册类型：手机号或邮箱
	const [countryCode, setCountryCode] = useState('+86') // 区号
	const [phone, setPhone] = useState('') // 手机号
	const [email, setEmail] = useState('') // 邮箱
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [code, setCode] = useState('')
	const [username, setUsername] = useState('')
	const [lottory, setLottory] = useState(storeInviteCode || '')
	const [loading, setLoading] = useState(false)
	const { setAuth, initUserInfo } = useAuth()
	const router = useRouter()
	
	// 获取地区列表
	const { data: areaList = [] } = useAreaList()

	// 当store中的邀请码变化时，更新本地state
	useEffect(() => {
		if (storeInviteCode) {
			setLottory(storeInviteCode)
		}
	}, [storeInviteCode])

	// 获取当前account（根据注册类型拼接）
	const getAccount = () => {
		if (registerType === 'phone') {
			return phone ? `${countryCode}${phone}` : ''
		}
		return email
	}

	return (
		<DialogShell title={t('title')} close={closeDialog}>
			{/* Tab 切换 */}
			<div className='mt-6 flex gap-2 rounded-lg border border-white/10 p-1'>
				<button
					type='button'
					onClick={() => {
						setRegisterType('phone')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						registerType === 'phone' ? 'bg-brand text-white' : 'text-secondary hover:text-white'
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
						registerType === 'email' ? 'bg-brand text-white' : 'text-secondary hover:text-white'
					}`}>
					{t('emailTab')}
				</button>
			</div>

			<div className='mt-4 space-y-4'>
				{/* 手机号输入 */}
				{registerType === 'phone' && (
					<div className='flex gap-2 items-stretch'>
						{/* 区号选择器 */}
						<div className='flex-shrink-0'>
							<AreaCodeSelector value={countryCode} onChange={setCountryCode} areaList={areaList} />
						</div>
						{/* 手机号输入框 */}
						<input
							type='tel'
							name='phone'
							placeholder={t('phonePlaceholder')}
							value={phone}
							onChange={e => setPhone(e.target.value)}
							className='placeholder:text-secondary bg-card flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20 min-w-0'
						/>
					</div>
				)}

				{/* 邮箱输入 */}
				{registerType === 'email' && (
					<input
						type='email'
						name='email'
						placeholder={t('emailPlaceholder')}
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
					/>
				)}

				{/* 验证码 */}
				<VerifyCode type={registerType === 'email' ? 1 : 2} content={getAccount()} value={code} onChange={setCode} />
				<input
					type='password'
					name='password'
					placeholder={t('passwordPlaceholder')}
					value={password}
					onChange={e => setPassword(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
				/>
				<input
					type='password'
					name='confirmPassword'
					placeholder={t('passwordConfirmPlaceholder')}
					value={confirmPassword}
					onChange={e => setConfirmPassword(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
				/>
				<input
					type='text'
					name='lottory'
					placeholder={t('inviteCodePlaceholder')}
					value={lottory}
					onChange={e => setLottory(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
				/>
			</div>

			<button
				disabled={loading}
				onClick={async () => {
					const account = getAccount()
					if (!account || !password || !code) {
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
							inviteCode: lottory || undefined,
							osType: 1
						})
						const data = (res.data as any)?.data
						if (data?.token && data?.userId) {
							setAuth({ token: data.token, userId: String(data.userId) })
							
							// 获取用户信息
							await initUserInfo()
							
							toast.success(t('registerSuccess') || 'Registration successful')
							
							// 关闭注册对话框
							closeDialog()
							
							// 检查是否需要跳转到抽奖页面
							if (data?.isLotteryInvite === 1) {
								router.push('/help-friend?showDialog=true')
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
				}}
				className='bg-brand w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-50'>
				{loading ? t('submitting') : t('submit')}
			</button>

			<div className='text-muted-foreground mt-4 text-center text-sm'>
				<span>{t('hasAccount')}</span>
				<button onClick={() => openDialog('login')} type='button' className='text-brand ml-1 font-medium hover:underline'>
					{t('loginLink')}
				</button>
			</div>
		</DialogShell>
	)
}
