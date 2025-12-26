import LoginDialog from './login'
import RegisterDialog from './register'
import ForgotPasswordDialog from './forgot-password'
import { useAuthDialogStore } from './store'

export default function AuthDialogs() {
	const { open, current } = useAuthDialogStore()

	if (!open) return null

	if (current === 'register') return <RegisterDialog />
	if (current === 'forgot') return <ForgotPasswordDialog />
	return <LoginDialog />
}
