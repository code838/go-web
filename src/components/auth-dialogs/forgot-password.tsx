import { useAuthDialogStore } from './store'
import DialogShell from '../dialog-shell'
import { useState } from 'react'
import md5 from 'blueimp-md5'
import VerifyCode from '@/components/verify-code'
import { resetPassword } from '@/requests/auth'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/toast'
import { useAreaList } from '@/requests'
import AreaCodeSelector from '@/components/area-code-selector'

export default function ForgotPasswordDialog() {
	const t = useTranslations('auth.forgotPassword')
	const { openDialog, closeDialog } = useAuthDialogStore()
	const [resetType, setResetType] = useState<'phone' | 'email'>('phone') // 重置类型：手机号或邮箱
	const [countryCode, setCountryCode] = useState('+86') // 区号
	const [phone, setPhone] = useState('') // 手机号
	const [email, setEmail] = useState('') // 邮箱
	const [code, setCode] = useState('')
	const [password, setPassword] = useState('')
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

	const handleReset = async () => {
		const account = getAccount()
		if (!account || !code || !password) {
			toast.warning(t('pleaseFillInAllFields') || 'Please fill in all required fields')
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
				openDialog('login')
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
		<DialogShell title={t('title')} close={closeDialog}>
			{/* Tab 切换 */}
			<div className='mt-6 flex gap-2 rounded-lg border border-white/10 p-1'>
				<button
					type='button'
					onClick={() => {
						setResetType('phone')
						setCode('')
					}}
					className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
						resetType === 'phone' ? 'bg-brand text-white' : 'text-secondary hover:text-white'
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
						resetType === 'email' ? 'bg-brand text-white' : 'text-secondary hover:text-white'
					}`}>
					{t('emailTab')}
				</button>
			</div>

			<div className='mt-4 space-y-4'>
				{/* 手机号输入 */}
				{resetType === 'phone' && (
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
				{resetType === 'email' && (
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
				<VerifyCode type={resetType === 'email' ? 1 : 2} content={getAccount()} value={code} onChange={setCode} />
				<input
					type='password'
					name='password'
					placeholder={t('newPasswordPlaceholder')}
					value={password}
					onChange={e => setPassword(e.target.value)}
					className='placeholder:text-secondary bg-card w-full rounded-lg border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/20'
				/>
			</div>

			<button disabled={loading} onClick={handleReset} className='bg-brand w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-50'>
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
