'use client'
import { PropsWithChildren, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from './header'
import Aside from './aside'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthDialogs from '@/components/auth-dialogs'
import { useAuth } from '@/hooks/useAuth'
import Footer from './footer'
import { ToastContainer } from '@/components/toast'
import MobileTabBar from './mobile-tabbar'
import { useAuthDialogStore } from '@/components/auth-dialogs/store'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
			gcTime: 1000 * 60 * 30, // 30分钟
			refetchOnWindowFocus: false,
			refetchOnMount: 'always',
			refetchOnReconnect: true,
		},
	},
})

export default function Layout({ children }: PropsWithChildren) {
	const pathname = usePathname()
	const isHelpFriendPage = pathname?.includes('/help-friend')
	const isInviteJoinPage = pathname?.includes('/invite-join')

	useEffect(() => {
		useAuth.getState().initUserInfo()

		// 检查 URL hash 中是否有第三方登录的 token
		const checkThirdPartyAuth = () => {
			const hash = window.location.hash
			if (hash && hash.includes('access_token')) {
				console.log('全局检测到 URL hash 中有第三方登录 token')
				// 打开登录对话框，让登录组件处理 token
				useAuthDialogStore.getState().openDialog('login')
			}
		}
		
		checkThirdPartyAuth()
	}, [])

	// 邀请注册页面：独立显示，不显示 header、侧边栏、footer 和移动端 tabbar
	if (isInviteJoinPage) {
		return (
			<QueryClientProvider client={queryClient}>
				<div className='min-h-screen'>
					{children}
				</div>
				<AuthDialogs />
				<ToastContainer />
			</QueryClientProvider>
		)
	}

	return (
		<QueryClientProvider client={queryClient}>
			<div className='flex w-full flex-col min-h-screen lg:h-screen lg:flex-row overflow-x-hidden'>
				<Aside />
				<section className='relative flex flex-1 flex-col overflow-x-hidden'>
					<Header className='hidden md:block' />
					<div className='scrollbar-none flex flex-1 flex-col overflow-auto pb-24 md:pb-0 overflow-x-hidden md:pt-0'>
						<main className={`flex-1 ${isHelpFriendPage ? 'py-0 bg-[#000]' : 'py-4 sm:px-6 px-2 sm:py-2'}`}>
							<div className='mx-auto w-full max-w-[1100px]'>{children}</div>
						</main>
						<Footer />
					</div>
					<MobileTabBar />
				</section>
			</div>
			<AuthDialogs />
			<ToastContainer />
		</QueryClientProvider>
	)
}
