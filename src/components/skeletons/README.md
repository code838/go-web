# Skeleton Components

可复用的骨架屏组件库，用于在数据加载时提供更好的用户体验。

## 组件列表

### 1. ProductGridSkeleton
商品网格骨架屏，用于显示商品卡片列表的加载状态。

**使用场景：**
- 首页的热门商品、即将揭晓、最新上架板块
- 专区页面的商品列表
- 任何显示商品卡片网格的页面

**Props：**
- `count?: number` - 显示的骨架卡片数量，默认 6

**示例：**
```tsx
import { ProductGridSkeleton } from '@/components/skeletons'

// 显示6个骨架卡片
<ProductGridSkeleton />

// 显示12个骨架卡片
<ProductGridSkeleton count={12} />
```

### 2. LatestListSkeleton
最新揭晓列表骨架屏，用于显示揭晓记录列表的加载状态。

**使用场景：**
- 最新揭晓页面
- 任何显示揭晓记录的列表

**Props：**
- `count?: number` - 显示的骨架行数，默认 10

**示例：**
```tsx
import { LatestListSkeleton } from '@/components/skeletons'

// 显示10行骨架
<LatestListSkeleton />

// 显示5行骨架
<LatestListSkeleton count={5} />
```

### 3. LatestListItemSkeleton
单个最新揭晓列表项骨架屏。

**使用场景：**
- 加载更多时在列表底部显示单个加载项
- 需要单独显示一个列表项骨架的场景

**示例：**
```tsx
import { LatestListItemSkeleton } from '@/components/skeletons'

{loading && <LatestListItemSkeleton />}
```

### 4. ZonePageSkeleton
专区页面完整骨架屏，包含标题、搜索栏、排序和商品网格。

**使用场景：**
- 专区页面（1U专区、10U专区、百U专区、即将揭晓等）
- 任何需要完整页面骨架的场景

**示例：**
```tsx
import { ZonePageSkeleton } from '@/components/skeletons'

if (isLoading) {
  return <ZonePageSkeleton />
}
```

### 5. LatestPageSkeleton
最新揭晓页面完整骨架屏，包含标题和列表。

**使用场景：**
- 最新揭晓页面
- 类似的列表页面

**示例：**
```tsx
import { LatestPageSkeleton } from '@/components/skeletons'

if (initialLoading) {
  return <LatestPageSkeleton />
}
```

## 使用指南

### 1. 基础用法
在页面中根据加载状态显示骨架屏：

```tsx
'use client'
import { ZonePageSkeleton } from '@/components/skeletons'
import { useZoneProducts } from '@/requests'

export default function ZonePage() {
  const { data, isLoading } = useZoneProducts({ zoneId: 1, pageNo: 1, pageSize: 10 })
  
  if (isLoading) {
    return <ZonePageSkeleton />
  }
  
  return <div>{/* 实际内容 */}</div>
}
```

### 2. 初始加载 vs 加载更多
对于支持分页加载的列表，区分初始加载和加载更多：

```tsx
const [initialLoading, setInitialLoading] = useState(true)
const [loading, setLoading] = useState(false)

// 初始加载显示完整骨架屏
if (initialLoading) {
  return <LatestPageSkeleton />
}

// 加载更多时在列表底部显示单个骨架项
return (
  <ul>
    {items.map(item => <li key={item.id}>{item.content}</li>)}
    {loading && <LatestListItemSkeleton />}
  </ul>
)
```

### 3. 组合使用
根据需要组合不同的骨架组件：

```tsx
return (
  <div className="space-y-8">
    <h1>标题</h1>
    {isLoadingHot ? (
      <ProductGridSkeleton count={6} />
    ) : (
      <div className="grid grid-cols-3 gap-4">
        {hotProducts.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    )}
  </div>
)
```

## 样式说明

所有骨架组件使用以下 Tailwind 类：
- `animate-pulse` - 脉冲动画
- `bg-skeleton` - 骨架背景色（需要在 theme.css 中定义）

确保在主题配置中定义了 `bg-skeleton` 颜色：
```css
.bg-skeleton {
  background-color: rgba(255, 255, 255, 0.05);
}
```

## 最佳实践

1. **总是在数据加载时显示骨架屏**，避免空白页面
2. **骨架屏的结构应该尽可能接近实际内容**的布局
3. **对于列表页面，显示合理数量的骨架项**（通常5-10个）
4. **区分初始加载和后续加载**，提供不同的视觉反馈
5. **保持骨架屏简洁**，不需要完全复制所有细节

## 扩展

如果需要创建新的骨架组件：

1. 在 `src/components/skeletons/` 目录下创建新文件
2. 使用 `animate-pulse` 和 `bg-skeleton` 类
3. 匹配实际组件的基本结构和尺寸
4. 在 `index.tsx` 中导出新组件
5. 更新此 README 文档

