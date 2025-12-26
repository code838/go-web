// ==================== 通用类型 ====================

/**
 * 分页请求参数
 */
export interface PaginationParams {
	pageNo: number
	pageSize: number
	coinId?: number // 币种ID筛选  
	orderBy?: number // 排序方式: 1=最新发布, 2=剩余人数
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
	list: T[]
	totalCount: number
}

// ==================== 产品相关类型 ====================

/**
 * 产品基础信息
 */
export interface Product {
	zoneId: number
	productId: number
	coinId?: number
	title: string
	subTitle: string
	coinName: string
	logo?: string | null
	productValue: string
	price: string
	serialNumber: number
	totalPerson: number
	joinPerson: number
	status: number
	detail?: string | null
	startTime: number
	endTime: number
	cart?: boolean // 是否已加入心愿单
	owner?: string // 中奖者（仅揭晓后有值）
	ownerCoding?: string // 中奖编码（仅揭晓后有值）
	ownerImage?: string | null // 中奖者头像（仅揭晓后有值）
}

/**
 * 产品历史记录（包含中奖者信息）
 */
export interface ProductHistory extends Product {
	owner: string
	ownerCoding: string
	ownerImage?: string | null
}

/**
 * 专区商品列表请求参数
 */
export interface ZoneProductsParams extends PaginationParams {
	zoneId: number
	userId?: number
	coinId?: number // 币种ID筛选
	orderBy?: number // 排序方式: 1=最新发布, 2=剩余人数
}

/**
 * 商品历史期数揭晓列表请求参数
 */
export interface ProductHistoryParams extends PaginationParams {
	productId: number
	userId?: number
}

/**
 * 购买用户信息
 */
export interface BuyUser {
	nickName: string
	image: string
	num: number
	time: number
}

/**
 * 商品中奖计算结果中的购买记录
 */
export interface ProductCalcBuyItem {
	buyTime: number // 购买时间
	productName: string // 产品名称
	productImage: string // 产品图片
	timeStamp: number // 时间戳
	nickName: string // 昵称
	userImage: string // 用户头像
	serialNumber: number // 产品期数
}

/**
 * 商品中奖计算结果
 */
export interface ProductCalcResult {
	productRecordId: number
	sumTime: number // 求和
	totalPerson: number // 参与人数
	result: number // 结果
	remainder: number // 余数
	base: number // 基数
}

/**
 * 商品中奖计算结果详情响应
 */
export interface ProductCalcResultResponse {
	buyList: ProductCalcBuyItem[] // 购买列表
	calcResult: ProductCalcResult // 计算结果
}

/**
 * 商品中奖计算结果请求参数
 */
export interface ProductCalcResultParams {
	productId: number
	serialNumber: number
}

// ==================== 专区相关类型 ====================

/**
 * 专区信息
 */
export interface Zone {
	zoneId: number
	zoneSort: number
	zoneTitle: string
}

// ==================== 地址相关类型 ====================

/**
 * 用户地址信息
 */
export interface UserAddress {
	id?: number
	coinId: number
	networkId: number
	coinName: string
	network: string
	address: string
	remark?: string
}

/**
 * 地址管理参数
 */
export interface AddressManageParams {
	userId: number
	id?: number // 删除和修改必传
	address?: string // 增加和修改必传
	coinId?: number // 增加必传
	networkId?: number // 增加必传
	operate: 1 | 2 | 3 // 1: 新增, 2: 删除, 3: 修改
	remark?: string
}

// ==================== 提现相关类型 ====================

/**
 * 提现请求参数
 */
export interface WithdrawParams {
	userId: number
	amount: string
	coinId: number
	networkId: number
	address: string
}

/**
 * 提现订单信息
 */
export interface WithdrawOrder {
	orderId: string
	status: number // 1: 审核中, 2: 已完成, 3: 订单取消
	fee: string
	amount: string
	coinId: number
	coinName: string
	network: string
	networkId: number
	toAddress: string
	createTime: number
	recvAmount: string
}

// ==================== 手续费相关类型 ====================

/**
 * 手续费明细
 */
export interface FeeItem {
	coinId: number
	fee: string
	minAmount: string // 最小提现数量
}

/**
 * 手续费信息
 */
export interface FeeInfo {
	type: number // 1: 提现手续费
	fees: FeeItem[]
}

// ==================== 订单相关类型 ====================

/**
 * 取消订单参数
 */
export interface CancelOrderParams {
	userId: number
	orderId: string
}

/**
 * 商品下单参数
 */
export interface OrderBuyParams {
	userId: number
	data: {
		productId: number
		num: number
	}[]
}

/**
 * 商品下单响应
 */
export interface OrderBuyResponse {
	orderId: string
}

/**
 * 订单列表请求参数
 */
export interface OrderListParams extends PaginationParams {
	userId: number
	type?: number // 0: 幸运订单, 1: 商品订单, 2: 充值, 3: 提现, 4: 兑换, 5: 返佣
}

/**
 * 订单商品信息
 */
export interface OrderProduct {
	productName: string // 商品名称
	logo: string | null // 商品图片
	price: string // 商品价格
	productAmount: string // 商品数量（该商品的购买数量）
	productNum: number // 商品编号
	productValue: string // 商品价值
	serialNumber: number // 期数
	coding: number | null // 幸运编码
}

/**
 * 订单信息
 */
export interface Order {
	// 通用字段
	createTime: number // 订单时间
	amount: string // 订单金额
	status: number // 订单状态 1: 待支付(审核中), 2: 已支付, 3: 订单取消
	type: number // 订单类型 0: 幸运订单, 1: 云购订单, 2: 充值, 3: 提现, 4: 闪兑, 5: 返佣
	orderId: string // 订单ID

	// 云购订单/幸运订单字段
	products?: OrderProduct[] // 订单商品列表（云购订单/幸运订单）
	productName?: string // 商品名称（单个商品时）
	price?: string // 商品价格
	num?: string // 订单商品总数量或闪兑来源数量
	productValue?: string // 商品价值
	lastPayTime?: number // 待支付状态下最后支付时间
	finishTime?: number // 云购/提现完成时间
	coding?: number // 云购订单(幸运编码)/幸运订单(中奖编码)
	ownerTime?: number // 中奖时间

	// 充值/提现/闪兑字段
	coinName?: string // 资产名称
	network?: string // 网络
	toAddress?: string // 接收地址
	fromAddress?: string // 发送地址
	recvAmount?: string // 到账金额
	fee?: string // 手续费
	hash?: string // hash

	// 闪兑字段
	toAssert?: string // 闪兑目标资产

	// 返佣字段
	inviteUserId?: string // 被邀请用户ID
	inviteUserName?: string // 被邀请用户名
	returnType?: string // 返佣类型 1: 注册, 2: 云购
}

// ==================== 客服相关类型 ====================

/**
 * 客服信息
 */
export interface Service {
	type: number // 1: Telegram, 2: WhatsApp, 3: QQ, 4: 微信
	account: string
}

// ==================== 通知相关类型 ====================

/**
 * 系统通知
 */
export interface Notification {
	id: string
	title: string
	content: string
	time: number
	read: boolean
	type: 'system' | 'order' | 'promotion' | 'security'
}

// ==================== 首页相关类型 ====================

/**
 * 首页数据
 */
export interface Home {
	hot: Product[]
	new: Product[]
	will: Product[]
}

/**
 * 中奖用户信息
 */
export interface WinnerInfo {
	nickName: string // 昵称
	productValue: string // 价值
	image: string // 头像
	time: number // 分钟
	productId: number // 商品ID
	serialNumber: number // 期数
}

/**
 * 购买用户信息
 */
export interface BuyerInfo {
	nickName: string // 昵称
	productName: string // 商品名称
	image: string // 头像
	time: number // 分钟
}

/**
 * 首页购买和中奖滚动列表
 */
export interface HomeBuys {
	owners: WinnerInfo[] // 中奖名单
	buys: BuyerInfo[] // 购买名单
}

// ==================== 语言相关类型 ====================

/**
 * 语言信息
 */
export interface Language {
	langname: string
	langflag: string
}

// ==================== APP相关类型 ====================

/**
 * APP下载链接
 */
export interface AppLink {
	type: number // 1: iOS, 2: Android
	path: string
}

// ==================== 购物车相关类型 ====================

/**
 * 购物车商品信息
 */
export interface CartItem extends Product {
	num: number
	selected: number // 0: 未选中, 1: 已选中
}

/**
 * 购物车管理参数
 */
export interface CartManageParams {
	userId: number
	type: number // 1: 添加, 2: 删除, 3: 修改数量, 4: 选中商品, 5: 取消选中商品
	productId: number
	selected?: number // 0: 取消选中, 1: 选中
	num?: number
}

// ==================== 用户信息相关类型 ====================

/**
 * 修改联系方式参数
 */
export interface UpdateContactParams {
	userId: number
	type: 1 | 2 // 1: 邮箱, 2: 手机号
	content: string
	captha: string
}

/**
 * 上传头像响应
 */
export interface UploadAvatarResponse {
	url: string // 头像URL
}

// ==================== 认证相关类型 ====================

/**
 * 币种余额信息
 */
export interface CoinBalance {
	coinId: number
	coinName: string
	balance: string
}

/**
 * 用户信息
 */
export interface UserInfo {
	userId: number
	email: string
	mobile: string | null
	points: string
	nickName: string
	status: number
	photo: string
	coinsBalance: CoinBalance[]
	inviteLink?: string // 邀请链接路径，如: /invite?code=iee7cjqdf
	invitePoints?: number // 返佣积分
	invitedCount?: number // 已邀请人数
	inviteUsers?: number // 累计推广人数
}

/**
 * 登录/注册响应数据
 */
export interface AuthResponse extends UserInfo {
	token: string
}

// ==================== 币种和网络相关类型 ====================

/**
 * 网络信息
 */
export interface Network {
	networkId: number
	network: string
}

/**
 * 币种信息(含网络)
 */
export interface Coin {
	coinId: number
	coinName: string
	logo: string | null
	networks: Network[]
}

// ==================== 协议相关类型 ====================

/**
 * 协议信息
 */
export interface Protocol {
	type: number // 1：用户协议 2：隐私协议
	content: string // 协议内容
}

// ==================== 兑换相关类型 ====================

/**
 * 兑换手续费和兑换USDT数量响应
 */
export interface ExchangeRateResponse {
	exchangeRate: string // 兑换手续费比例
	exchangeVal?: string // 兑换大约接收金额
	exchangeFee?: string // 兑换大约手续费
	exchangePrice: string // 兑换大约价格，每个币种或积分可以兑换多少USDT
	minNum: string // 最小兑换数量
}

/**
 * 兑换手续费请求参数
 */
export interface ExchangeRateParams {
	fromCoinId: number // 币ID，积分固定传0
	num?: string // 数量，不传数量只返回手续费比例
}

/**
 * 兑换请求参数
 */
export interface ExchangeParams {
	userId: number
	coinId: number // 币ID，积分固定传0
	num: string // 兑换数量
}

/**
 * 兑换响应
 */
export interface ExchangeResponse {
	orderId: string
	recvNum: string // 到账金额
	exchangeFee: string // 兑换手续费
	createTime: number // 订单时间
}

// ==================== 轮播图相关类型 ====================

/**
 * 轮播图图片信息
 */
export interface CarouselImage {
	language: string // 语言代码，如 zh_CN
	image: string // 图片路径
	showOrder: number // 展示顺序，值越小优先级越高
}

/**
 * 轮播图信息
 */
export interface Carousel {
	type: number // 1: 首页图, 2: 邀请页图
	images: CarouselImage[]
}

// ==================== 公告相关类型 ====================

/**
 * 公告信息
 */
export interface Announcement {
	id: number
	language: string
	content: string
	createtime: number | null
}

// ==================== 消息相关类型 ====================

/**
 * 消息信息
 */
export interface Message {
	id: number | null
	uid: number | null
	title: string
	content: string
	language: string | null
	createtime: number
}

/**
 * 获取消息请求参数
 */
export interface MessageParams {
	userId?: number // 未登录可不传
}

// ==================== 抽奖相关类型 ====================

/**
 * 免费领币请求参数
 */
export interface LotteryInitParams {
	userId: number
	data: {
		productId: number
		num: number
	}[]
}

/**
 * 免费领币响应
 */
export interface LotteryInitResponse {
	count: number // 剩余抽奖次数
	expireTime: number // 结束时间戳（毫秒）
	inviteLink: string // 邀请链接
	amount: string // 目标总金额
	recvAmount: string // 已累计抽中金额
	drawAmount: string[] // 转盘上的抽奖金额数组
}

/**
 * 抽奖响应
 */
export interface LotteryDrawResponse {
	amount: string // 本次抽中金额，返回0表示谢谢参与
	recvAmount: string // 已累计抽中金额
	finished: boolean // 累计金额是否达到目标金额
}

/**
 * 抽奖记录
 */
export interface LotteryRecord {
	amount: string // 抽中金额
	count: number // 抽奖顺序
	createTime: number // 抽奖时间
}

/**
 * 助力记录
 */
export interface AssistRecord {
	nickName: string // 昵称
	image: string // 头像
	createTime: number // 助力时间
}

// ==================== 第三方登录相关类型 ====================

/**
 * 第三方登录配置信息
 */
export interface ThirdLoginInfo {
	type: number // 1: 谷歌, 2: FB, 3: TG
	clientId: string // 客户端ID
	url: string | null // 重定向URL
	scope: string | null // 谷歌scope
}

/**
 * 第三方登录请求参数
 */
export interface ThirdLoginParams {
	type: number // 1: 谷歌, 2: FB, 3: TG
	token: string // token
	inviteCode?: string // 邀请码
	lottery?: string // 助力码
}

/**
 * 第三方登录响应
 */
export interface ThirdLoginResponse extends UserInfo {
	token: string
}

// ==================== 地区相关类型 ====================

/**
 * 国家地区信息
 */
export interface AreaInfo {
	image: string // 国旗图片路径
	area: string // 手机号前缀
}

// ==================== 邀请相关类型 ====================

/**
 * 邀请信息链接
 */
export interface InviteLink {
	type: number // 1: iOS下载链接, 2: Android下载链接, 3: iOS唤醒链接, 4: Android唤醒链接
	path: string
}

/**
 * 邀请记录
 */
export interface InviteRecord {
	userId: string // 用户ID
	nickName: string // 昵称
	photo: string // 用户头像
	time: number // 时间戳（毫秒）
}

// ==================== 基础信息相关类型 ====================

/**
 * 基础信息
 */
export interface BasicInfo {
	invitePoints: string // 邀请注册送积分数
	totalUsers: string // 网站总参与人数，对应网站右上角
}
