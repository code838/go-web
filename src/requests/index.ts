import axios from '@/lib/axios'
import { useQuery, useMutation } from '@tanstack/react-query'
import type {
	PaginationParams,
	PaginatedResponse,
	Product,
	ProductHistory,
	ZoneProductsParams,
	ProductHistoryParams,
	BuyUser,
	Zone,
	UserAddress,
	WithdrawParams,
	WithdrawOrder,
	FeeInfo,
	CancelOrderParams,
	Service,
	Home,
	HomeBuys,
	Language,
	AppLink,
	CartItem,
	CartManageParams,
	AddressManageParams,
	UpdateContactParams,
	UploadAvatarResponse,
	OrderBuyParams,
	OrderBuyResponse,
	OrderListParams,
	Order,
	OrderProduct,
	UserInfo,
	Coin,
	ExchangeRateParams,
	ExchangeRateResponse,
	ExchangeParams,
	ExchangeResponse,
	Protocol,
	ProductCalcResultParams,
	ProductCalcResultResponse,
	Carousel,
	Announcement,
	Message,
	MessageParams,
	LotteryInitParams,
	LotteryInitResponse,
	LotteryDrawResponse,
	LotteryRecord,
	AssistRecord,
	ThirdLoginInfo,
	ThirdLoginParams,
	ThirdLoginResponse,
	AreaInfo,
	InviteLink,
	InviteRecord,
	BasicInfo
} from '@/types'

// 导出类型供外部使用
export type {
	PaginationParams,
	PaginatedResponse,
	Product,
	ProductHistory,
	ZoneProductsParams,
	ProductHistoryParams,
	BuyUser,
	Zone,
	UserAddress,
	WithdrawParams,
	WithdrawOrder,
	FeeInfo,
	CancelOrderParams,
	Service,
	Home,
	HomeBuys,
	Language,
	AppLink,
	CartItem,
	CartManageParams,
	AddressManageParams,
	UpdateContactParams,
	UploadAvatarResponse,
	OrderBuyParams,
	OrderBuyResponse,
	OrderListParams,
	Order,
	OrderProduct,
	UserInfo,
	Coin,
	ExchangeRateParams,
	ExchangeRateResponse,
	ExchangeParams,
	ExchangeResponse,
	Protocol,
	ProductCalcResultParams,
	ProductCalcResultResponse,
	Carousel,
	Announcement,
	Message,
	MessageParams,
	LotteryInitParams,
	LotteryInitResponse,
	LotteryDrawResponse,
	LotteryRecord,
	AssistRecord,
	ThirdLoginInfo,
	ThirdLoginParams,
	ThirdLoginResponse,
	AreaInfo,
	InviteLink,
	InviteRecord,
	BasicInfo
}

// ==================== 客服信息 ====================

/**
 * 获取客服信息
 */
export function getServices() {
	return axios.post<Res<Service[]>>('/service')
}

/**
 * Hook: 获取客服信息
 */
export function useServices() {
	return useQuery({
		queryKey: ['services'],
		queryFn: async () => {
			const res = await getServices()
			return res.data.data
		}
	})
}

// ==================== 首页相关 ====================

/**
 * 获取首页数据
 * @param params.userId - 用户ID（可选，已登录时传入）
 */
export function getHome(params?: { userId?: number }) {
	return axios.post<Res<Home>>('/home', params || {})
}

/**
 * Hook: 获取首页数据
 * @param userId - 用户ID（可选）
 */
export function useHome(userId?: number) {
	return useQuery({
		queryKey: ['home', userId],
		queryFn: async () => {
			const res = await getHome(userId ? { userId } : undefined)
			return res.data.data
		}
	})
}

/**
 * 获取首页中奖和购买滚动列表
 */
export function getHomeBuys() {
	return axios.post<Res<HomeBuys>>('/home/buys')
}

/**
 * Hook: 获取首页中奖和购买滚动列表
 */
export function useHomeBuys() {
	return useQuery({
		queryKey: ['home-buys'],
		queryFn: async () => {
			const res = await getHomeBuys()
			return res.data.data
		}
	})
}

// ==================== 专区相关 ====================

/**
 * 获取首页导航列表（1U、10U、百U 专区）
 */
export function getZone() {
	return axios.get<Res<Zone[]>>('/zone')
}

/**
 * Hook: 获取专区列表
 */
export function useZone() {
	return useQuery({
		queryKey: ['zone'],
		queryFn: async () => {
			const res = await getZone()
			return res.data.data
		}
	})
}

// ==================== 产品相关 ====================

/**
 * 获取专区商品列表
 * @param params - 包含分页信息和专区ID
 */
export function getZoneProducts(params: ZoneProductsParams) {
	return axios.post<Res<Product[]> & { totalCount: number }>('/zone/products', params)
}

/**
 * Hook: 获取专区商品列表
 * @param params - 包含分页信息和专区ID
 * @param options - React Query 配置选项
 */
export function useZoneProducts(params: ZoneProductsParams, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['zone-products', params.zoneId, params.pageNo, params.pageSize, params.userId, params.coinId, params.orderBy],
		queryFn: async () => {
			const res = await getZoneProducts(params)
			return {
				list: res.data.data || [],
				totalCount: res.data.totalCount || 0
			}
		},
		enabled: options?.enabled !== undefined ? options.enabled : !!params.zoneId,
		staleTime: 0,
		refetchOnMount: 'always',
		refetchOnReconnect: true
	})
}

/**
 * 获取即将揭晓产品列表
 * @param params - 分页参数
 */
export function getWillProducts(params: PaginationParams) {
	return axios.post<Res<Product[]> & { totalCount: number }>('/will/products', params)
}

/**
 * Hook: 获取即将揭晓产品列表
 * @param params - 分页参数
 * @param options - React Query 配置选项
 */
export function useWillProducts(params: PaginationParams, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['will-products', params.pageNo, params.pageSize, params.coinId, params.orderBy],
		queryFn: async () => {
			const res = await getWillProducts(params)
			return {
				list: res.data.data || [],
				totalCount: res.data.totalCount || 0
			}
		},
		enabled: options?.enabled,
		staleTime: 0,
		refetchOnMount: 'always',
		refetchOnReconnect: true
	})
}

/**
 * 获取最新揭晓产品列表
 * @param params - 分页参数
 */
export function getHistoryProducts(params: PaginationParams) {
	return axios.post<Res<ProductHistory[]>>('/history/products', params)
}

/**
 * Hook: 获取最新揭晓产品列表
 * @param params - 分页参数
 */
export function useHistoryProducts(params: PaginationParams) {
	return useQuery({
		queryKey: ['history-products', params.pageNo, params.pageSize],
		queryFn: async () => {
			const res = await getHistoryProducts(params)
			return res.data.data
		}
	})
}

/**
 * 获取商品历史期数揭晓列表
 * @param params - 包含分页信息和产品ID
 */
export function getProductHistoryDraws(params: ProductHistoryParams) {
	return axios.post<Res<ProductHistory[]>>('/history/draw/products', params)
}

/**
 * Hook: 获取商品历史期数揭晓列表
 * @param params - 包含分页信息和产品ID
 */
export function useProductHistoryDraws(params: ProductHistoryParams) {
	return useQuery({
		queryKey: ['product-history-draws', params.productId, params.pageNo, params.pageSize],
		queryFn: async () => {
			const res = await getProductHistoryDraws(params)
			return res.data.data
		},
		enabled: !!params.productId
	})
}

/**
 * 获取产品购买用户列表
 * @param params - 包含分页信息和产品ID
 */
export function getProductBuyUsers(params: ProductHistoryParams) {
	return axios.post<Res<BuyUser[]>>('/product/buyusers', params)
}

/**
 * Hook: 获取产品购买用户列表
 * @param params - 包含分页信息、产品ID和用户ID
 */
export function useProductBuyUsers(params: ProductHistoryParams) {
	return useQuery({
		queryKey: ['product-buy-users', params.productId, params.pageNo, params.pageSize, params.userId],
		queryFn: async () => {
			const res = await getProductBuyUsers(params)
			return res.data.data
		},
		enabled: !!params.productId
	})
}

/**
 * 获取商品详情
 * @param params.productId - 商品ID
 * @param params.serialNumber - 期数
 * @param params.userId - 用户ID（可选，已登录时传入）
 */
export function getProductDetail(params: { productId: number; serialNumber: number; userId?: number }) {
	return axios.post<Res<Product & { coinId: number }>>('/product/detail', params)
}

/**
 * Hook: 获取商品详情
 * @param params - 包含商品ID、期数和用户ID
 */
export function useProductDetail(params: { productId: number; serialNumber: number; userId?: number }) {
	return useQuery({
		queryKey: ['product-detail', params.productId, params.serialNumber, params.userId],
		queryFn: async () => {
			const res = await getProductDetail(params)
			return res.data.data
		},
		enabled: !!params.productId && !!params.serialNumber
	})
}

/**
 * 获取揭晓商品中奖计算结果详情
 * @param params.productId - 商品ID
 * @param params.serialNumber - 期数
 */
export function getProductCalcResult(params: ProductCalcResultParams) {
	return axios.post<Res<ProductCalcResultResponse>>('/product/calcResult', params)
}

/**
 * Hook: 获取揭晓商品中奖计算结果详情
 * @param params - 包含商品ID和期数
 */
export function useProductCalcResult(params: ProductCalcResultParams) {
	return useQuery({
		queryKey: ['product-calc-result', params.productId, params.serialNumber],
		queryFn: async () => {
			const res = await getProductCalcResult(params)
			return res.data.data
		},
		enabled: !!params.productId && !!params.serialNumber
	})
}

// ==================== 用户地址相关 ====================

/**
 * 获取用户充值地址 (需要鉴权)
 */
export function getUserAddress(params: { userId: number }) {
	return axios.post<Res<UserAddress[]>>('/user/address', params)
}

/**
 * Hook: 获取用户充值地址
 */
export function useUserAddress(userId: number) {
	return useQuery({
		queryKey: ['user-address', userId],
		queryFn: async () => {
			const res = await getUserAddress({ userId })
			return res.data.data
		},
		enabled: !!userId && userId > 0
	})
}

/**
 * 获取用户提现地址列表 (需要鉴权)
 * @param params.userId - 用户ID
 */
export function getWithdrawAddressList(params: { userId: number }) {
	return axios.post<Res<UserAddress[]>>('/address/withdraw/list', params)
}

/**
 * Hook: 获取用户提现地址列表
 * @param userId - 用户ID
 */
export function useWithdrawAddressList(userId: number) {
	return useQuery({
		queryKey: ['withdraw-address-list', userId],
		queryFn: async () => {
			const res = await getWithdrawAddressList({ userId })
			return res.data.data
		},
		enabled: !!userId
	})
}

/**
 * 管理用户提现地址 (需要鉴权)
 * @param params - 地址管理参数
 */
export function manageWithdrawAddress(params: AddressManageParams) {
	return axios.post<Res<null>>('/address/withdraw/manage', params)
}

/**
 * Hook: 管理提现地址
 */
export function useManageWithdrawAddress() {
	return useMutation({
		mutationFn: manageWithdrawAddress
	})
}

// ==================== 提现相关 ====================

/**
 * 提现 (需要鉴权)
 * @param params - 提现参数
 */
export function withdraw(params: WithdrawParams) {
	return axios.post<Res<WithdrawOrder>>('/withdraw', params)
}

/**
 * Hook: 提现
 */
export function useWithdraw() {
	return useMutation({
		mutationFn: withdraw
	})
}

// ==================== 手续费相关 ====================

/**
 * 获取提现手续费
 */
export function getWithdrawFee() {
	return axios.post<Res<FeeInfo[]>>('/withdraw/fee')
}

/**
 * Hook: 获取提现手续费
 */
export function useWithdrawFee() {
	return useQuery({
		queryKey: ['withdraw-fee'],
		queryFn: async () => {
			const res = await getWithdrawFee()
			return res.data.data
		}
	})
}

// ==================== 订单相关 ====================

/**
 * 取消订单 (需要鉴权)
 * @param params - 包含用户ID和订单ID
 */
export function cancelOrder(params: CancelOrderParams) {
	return axios.post<Res<null>>('/order/cancel', params)
}

/**
 * Hook: 取消订单
 */
export function useCancelOrder() {
	return useMutation({
		mutationFn: cancelOrder
	})
}

/**
 * 商品下单 (需要鉴权)
 * @param params - 下单参数
 */
export function orderBuy(params: OrderBuyParams) {
	return axios.post<Res<OrderBuyResponse>>('/order/buy', params)
}

/**
 * Hook: 商品下单
 */
export function useOrderBuy() {
	return useMutation({
		mutationFn: orderBuy
	})
}

/**
 * 获取订单列表 (需要鉴权)
 * @param params.userId - 用户ID
 * @param params.pageNo - 页码
 * @param params.pageSize - 每页数量
 * @param params.type - 订单类型 (可选) 0: 幸运订单, 1: 商品订单, 2: 充值, 3: 提现, 4: 兑换, 5: 返佣
 */
export function getOrderList(params: OrderListParams) {
	return axios.post<Res<Order[]>>('/order/list', params)
}

/**
 * Hook: 获取订单列表
 * @param params - 订单列表参数
 */
export function useOrderList(params: OrderListParams) {
	return useQuery({
		queryKey: ['order-list', params.userId, params.pageNo, params.pageSize, params.type],
		queryFn: async () => {
			const res = await getOrderList(params)
			return res.data.data
		},
		enabled: !!params.userId
	})
}

/**
 * 订单支付 (需要鉴权)
 * @param params.userId - 用户ID
 * @param params.orderId - 订单ID
 */
export function payOrder(params: { userId: number; orderId: string }) {
	return axios.post<Res<null>>('/order/pay', params)
}

/**
 * Hook: 订单支付
 */
export function usePayOrder() {
	return useMutation({
		mutationFn: payOrder
	})
}

/**
 * 获取订单详情 (需要鉴权)
 * @param params.userId - 用户ID
 * @param params.orderId - 订单ID
 */
export function getOrderDetail(params: { userId: number; orderId: string; isOwner: boolean }) {
	return axios.post<Res<Order>>('/order/detail', params)
}

/**
 * Hook: 获取订单详情
 * @param params - 订单详情参数
 */
export function useOrderDetail(params: { userId: number; orderId: string; isOwner: boolean }) {
	return useQuery({
		queryKey: ['order-detail', params.userId, params.orderId, params.isOwner],
		queryFn: async () => {
			const res = await getOrderDetail(params)
			return res.data.data
		},
		enabled: !!params.userId && !!params.orderId
	})
}

// ==================== 用户信息相关 ====================

/**
 * 获取用户信息接口 (需要鉴权)
 * @param params.userId - 用户ID
 */
export function getUserInfo(params: { userId: string | number }) {
	return axios.post<Res<UserInfo>>('/user', params)
}

/**
 * 修改昵称接口 (需要鉴权)
 * @param params.userId - 用户ID
 * @param params.nickName - 新昵称
 */
export function updateNickName(params: { userId: number; nickName: string }) {
	return axios.post<Res<null>>('/user/updateNickName', params)
}

/**
 * 修改或绑定邮箱和手机号 (需要鉴权)
 * @param params - 修改联系方式参数
 */
export function updateContact(params: UpdateContactParams) {
	return axios.post<Res<null>>('/user/updateUserName', params)
}

/**
 * 删除账号 (需要鉴权)
 * @param params.userId - 用户ID
 */
export function deleteAccount(params: { userId: number }) {
	return axios.post<Res<null>>('/account/delete', params)
}

/**
 * Hook: 修改联系方式
 */
export function useUpdateContact() {
	return useMutation({
		mutationFn: updateContact
	})
}

/**
 * 上传头像 (需要鉴权)
 * @param formData - 包含图片文件的FormData对象
 */
export function uploadAvatar(formData: FormData) {
	return axios.post<Res<UploadAvatarResponse>>('/user/upload', formData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	})
}

/**
 * Hook: 上传头像
 */
export function useUploadAvatar() {
	return useMutation({
		mutationFn: uploadAvatar
	})
}

// ==================== 语言相关 ====================

/**
 * 获取语言列表
 */
export function getLanguages() {
	return axios.get<Res<Language[]>>('/language/get')
}

/**
 * Hook: 获取语言列表
 */
export function useLanguages() {
	return useQuery({
		queryKey: ['languages'],
		queryFn: async () => {
			const res = await getLanguages()
			const data = res.data.data
			// 缓存到 localStorage
			if (typeof window !== 'undefined') {
				try {
					localStorage.setItem('languages_cache', JSON.stringify(data))
					localStorage.setItem('languages_cache_time', Date.now().toString())
				} catch (e) {
					// localStorage 可能不可用，忽略错误
				}
			}
			return data
		},
		staleTime: 1000 * 60 * 60 * 24, // 24小时
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7天
		initialData: () => {
			// 从 localStorage 读取缓存数据
			if (typeof window !== 'undefined') {
				try {
					const cached = localStorage.getItem('languages_cache')
					const cacheTime = localStorage.getItem('languages_cache_time')
					if (cached && cacheTime) {
						const age = Date.now() - parseInt(cacheTime, 10)
						// 如果缓存数据在7天内，使用缓存
						if (age < 1000 * 60 * 60 * 24 * 7) {
							return JSON.parse(cached)
						}
					}
				} catch (e) {
					// 忽略错误
				}
			}
			return undefined
		}
	})
}

// ==================== APP下载相关 ====================

/**
 * 获取APP下载链接
 */
export function getAppLinks() {
	return axios.get<Res<AppLink[]>>('/app/link')
}

/**
 * Hook: 获取APP下载链接
 */
export function useAppLinks() {
	return useQuery({
		queryKey: ['app-links'],
		queryFn: async () => {
			const res = await getAppLinks()
			return res.data.data
		}
	})
}

// ==================== 购物车相关 ====================

/**
 * 获取购物车列表 (需要鉴权)
 * @param params.userId - 用户ID
 */
export function getCartList(params: { userId: number }) {
	return axios.post<Res<CartItem[]>>('/cart/list', params)
}

/**
 * Hook: 获取购物车列表
 * @param userId - 用户ID
 */
export function useCartList(userId: number) {
	return useQuery({
		queryKey: ['cart-list', userId],
		queryFn: async () => {
			const res = await getCartList({ userId })
			return res.data.data
		},
		enabled: !!userId
	})
}

/**
 * 管理购物车 (需要鉴权)
 * @param params - 购物车管理参数
 */
export function manageCart(params: CartManageParams) {
	return axios.post<Res<null>>('/cart/manage', params)
}

/**
 * Hook: 管理购物车
 */
export function useManageCart() {
	return useMutation({
		mutationFn: manageCart
	})
}

// ==================== 币种和网络相关 ====================

/**
 * 获取平台币种和网络
 */
export function getCoins() {
	return axios.get<Res<Coin[]>>('/coins')
}

/**
 * Hook: 获取平台币种和网络
 */
export function useCoins() {
	return useQuery({
		queryKey: ['coins'],
		queryFn: async () => {
			const res = await getCoins()
			return res.data.data
		}
	})
}

// ==================== 兑换相关 ====================

/**
 * 获取兑换手续费和兑换USDT数量
 * @param params.fromCoinId - 币ID，积分固定传0
 * @param params.num - 数量，不传数量只返回手续费比例
 */
export function getExchangeRate(params: ExchangeRateParams) {
	return axios.post<Res<ExchangeRateResponse>>('/exchange/rate', params)
}

/**
 * Hook: 获取兑换手续费和兑换USDT数量
 * @param params - 兑换参数
 */
export function useExchangeRate(params: ExchangeRateParams, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['exchange-rate', params.fromCoinId, params.num],
		queryFn: async () => {
			const res = await getExchangeRate(params)
			// 检查业务错误码，成功时 code 可能是 0 或 200
			if (res.data.code !== 0 && res.data.code !== 200) {
				throw new Error(res.data.msg || res.data.message || '获取兑换汇率失败')
			}
			return res.data.data
		},
		enabled: options?.enabled !== undefined ? options.enabled : params.fromCoinId !== undefined,
		retry: false // 业务错误不需要重试
	})
}

/**
 * 兑换 (需要鉴权)
 * @param params - 兑换参数
 */
export function exchange(params: ExchangeParams) {
	return axios.post<Res<ExchangeResponse>>('/exchange', params)
}

/**
 * Hook: 兑换
 */
export function useExchange() {
	return useMutation({
		mutationFn: exchange
	})
}

// ==================== 协议相关 ====================

/**
 * 获取用户和隐私协议
 */
export function getProtocol() {
	return axios.get<Res<Protocol[]>>('/protocol')
}

/**
 * Hook: 获取用户和隐私协议
 */
export function useProtocol() {
	return useQuery({
		queryKey: ['protocol'],
		queryFn: async () => {
			const res = await getProtocol()
			return res.data.data
		}
	})
}

// ==================== 轮播图相关 ====================

/**
 * 获取轮播图
 */
export function getCarousel() {
	return axios.get<Res<Carousel[]>>('/carousel')
}

/**
 * Hook: 获取轮播图
 */
export function useCarousel() {
	return useQuery({
		queryKey: ['carousel'],
		queryFn: async () => {
			const res = await getCarousel()
			return res.data.data
		}
	})
}

// ==================== 公告相关 ====================

/**
 * 获取公告
 */
export function getAnnouncement() {
	return axios.get<Res<Announcement>>('/announcement')
}

/**
 * Hook: 获取公告
 */
export function useAnnouncement() {
	return useQuery({
		queryKey: ['announcement'],
		queryFn: async () => {
			const res = await getAnnouncement()
			return res.data.data
		}
	})
}

// ==================== 消息相关 ====================

/**
 * 获取消息
 * @param params.userId - 用户ID（可选，未登录可不传）
 */
export function getMessage(params?: MessageParams) {
	return axios.post<Res<Message[]>>('/message', params || {})
}

/**
 * Hook: 获取消息
 * @param userId - 用户ID（可选）
 */
export function useMessage(userId?: number) {
	return useQuery({
		queryKey: ['message', userId],
		queryFn: async () => {
			const res = await getMessage(userId ? { userId } : undefined)
			return res.data.data
		}
	})
}

// ==================== 抽奖相关 ====================

/**
 * 获取免费领币信息 (需要鉴权)
 * @param params - 免费领币参数
 */
export function lotteryInit() {
	return axios.post<Res<LotteryInitResponse>>('/lottery/init', {})
}

/**
 * Hook: 获取免费领币信息
 */
export function useLotteryInit() {
	return useMutation({
		mutationFn: lotteryInit
	})
}

/**
 * 抽奖 (需要鉴权)
 */
export function lotteryDraw() {
	return axios.post<Res<LotteryDrawResponse>>('/lottery/draw', {})
}

/**
 * Hook: 抽奖
 */
export function useLotteryDraw() {
	return useMutation({
		mutationFn: lotteryDraw
	})
}

/**
 * 获取抽奖记录 (需要鉴权)
 */
export function getLotteryRecords() {
	return axios.post<Res<LotteryRecord[]>>('/lottery/record/draw', {})
}

/**
 * Hook: 获取抽奖记录
 * @param userId - 用户ID（可选，未登录时不请求）
 */
export function useLotteryRecords(userId?: number | string) {
	return useQuery({
		queryKey: ['lottery-records', userId],
		queryFn: async () => {
			const res = await getLotteryRecords()
			return res.data.data
		},
		enabled: !!userId
	})
}

/**
 * 获取助力记录 (需要鉴权)
 */
export function getAssistRecords() {
	return axios.post<Res<AssistRecord[]>>('/lottery/record/assist', {})
}

/**
 * Hook: 获取助力记录
 * @param userId - 用户ID（可选，未登录时不请求）
 */
export function useAssistRecords(userId?: number | string) {
	return useQuery({
		queryKey: ['assist-records', userId],
		queryFn: async () => {
			const res = await getAssistRecords()
			return res.data.data
		},
		enabled: !!userId
	})
}

// ==================== 第三方登录相关 ====================

/**
 * 获取第三方登录配置信息
 * @param params.productId - 商品ID
 * @param params.serialNumber - 期数
 */
export function getThirdLoginInfo(params: { productId: number; serialNumber: number }) {
	return axios.post<Res<ThirdLoginInfo[]>>('/thirdlogin/info', params)
}

/**
 * Hook: 获取第三方登录配置信息
 * @param params - 包含商品ID和期数
 */
export function useThirdLoginInfo(params: { productId: number; serialNumber: number }) {
	return useQuery({
		queryKey: ['third-login-info', params.productId, params.serialNumber],
		queryFn: async () => {
			const res = await getThirdLoginInfo(params)
			return res.data.data
		},
		enabled: !!params.productId && !!params.serialNumber
	})
}

/**
 * Hook: 获取第三方登录配置信息（用于认证场景）
 * 用于登录/注册等不依赖具体产品的场景
 */
export function useThirdLoginInfoForAuth() {
	return useQuery({
		queryKey: ['third-login-info-auth'],
		queryFn: async () => {
			const res = await getThirdLoginInfo({ productId: 0, serialNumber: 0 })
			return res.data.data
		}
	})
}

/**
 * 第三方授权登录
 * @param params - 第三方登录参数
 */
export function thirdLogin(params: ThirdLoginParams) {
	return axios.post<Res<ThirdLoginResponse>>('/thirdlogin/login', params)
}

/**
 * Hook: 第三方授权登录
 */
export function useThirdLogin() {
	return useMutation({
		mutationFn: thirdLogin
	})
}

// ==================== 地区相关 ====================

/**
 * 获取手机号前缀和国家名称
 */
export function getAreaList() {
	return axios.get<Res<AreaInfo[]>>('/area')
}

/**
 * Hook: 获取手机号前缀和国家名称
 */
export function useAreaList() {
	return useQuery({
		queryKey: ['area-list'],
		queryFn: async () => {
			const res = await getAreaList()
			return res.data.data
		}
	})
}

// ==================== 邀请相关 ====================

/**
 * 获取邀请注册/助力页面信息
 */
export function getInviteInfo() {
	return axios.get<Res<InviteLink[]>>('/invite/info')
}

/**
 * Hook: 获取邀请注册/助力页面信息
 */
export function useInviteInfo() {
	return useQuery({
		queryKey: ['invite-info'],
		queryFn: async () => {
			const res = await getInviteInfo()
			return res.data.data
		}
	})
}

// ==================== 基础信息相关 ====================

/**
 * 获取基础信息（邀请注册送积分数、网站总参与人数）
 */
export function getBasicInfo() {
	return axios.get<Res<BasicInfo>>('/basic')
}

/**
 * Hook: 获取基础信息
 */
export function useBasicInfo() {
	return useQuery({
		queryKey: ['basic-info'],
		queryFn: async () => {
			const res = await getBasicInfo()
			return res.data.data
		}
	})
}

/**
 * 获取邀请记录 (需要鉴权)
 */
export function getInviteRecords() {
	return axios.post<Res<InviteRecord[]>>('/invite/record', {})
}

/**
 * Hook: 获取邀请记录
 * @param userId - 用户ID（可选，未登录时不请求）
 */
export function useInviteRecords(userId?: number | string) {
	return useQuery({
		queryKey: ['invite-records', userId],
		queryFn: async () => {
			const res = await getInviteRecords()
			return res.data.data
		},
		enabled: !!userId
	})
}
