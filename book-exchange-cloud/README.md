# 邻里换书 · 微信云开发版

在[可点击原型](../book-exchange-miniprogram)的基础上，升级为**真正能多人联机、数据持久化**的
微信云开发（CloudBase）版本：小程序端 + 云函数 + 云数据库。

## 相比原型的关键变化

| | 原型（内存版） | 云开发版 |
|---|---|---|
| 数据 | 内存，刷新即丢 | 云数据库，持久化、多用户共享 |
| 书币结算 | **发布即得**（多人下会被刷） | **交接确认时结算**：兑换先冻结领书方书币，线下交接确认后才打给贡献方 |
| 扣币安全 | 客户端直接改 | 云函数事务内校验+扣减，**杜绝超扣/并发重复兑换** |
| 范围隔离 | 单一写死 | 按 `community` 字段隔离，每个小区各自一套书架 |

## 架构

```
小程序端 (miniprogram/)
   └─ wx.cloud.callFunction({ name:'bookex', data:{ action, ... } })
                    │
                    ▼
单一云函数 bookex (cloudfunctions/bookex/)
   ├─ index.js              路由：按 event.action 分发
   ├─ handlers/             login / getShelf / getBook / getMine /
   │                        publishBook / exchangeBook / confirmOrder / seedBooks
   └─ lib/                  credit.js（定价）/ seed.js（演示数据）
                    │
                    ▼
云数据库 collections: users / books / orders / transactions
```

> 用「一个云函数 + action 路由」而非多个云函数：部署只需上传一次，公共逻辑也能直接共享。

## 数据模型（云数据库集合）

- **users**: `_openid, name, avatar, community, address, credits, createdAt`
- **books**: `_openid, ownerOpenid, ownerName, ownerAddress, community, title, author, cover, color, category, ageRange, condition, desc, credits(兑换价), status(available|exchanging|exchanged), createdAt`
- **orders**: `_openid, type(get|give), bookId, bookSnapshot, credits, status(待交接|已完成), giverOpenid, takerOpenid, counterparty, time`
- **transactions**: `_openid, title, delta, time`

## 书币闭环（多人）

```
新人登录 → 送 30 书币（bootstrap）
A 兑换 B 的书 → 事务内：校验A余额 → 扣A书币(冻结) → 锁书 → 生成A/B两张待交接订单 → 记A一笔流水
A、B 楼下交接 → 任一方点「确认交接」→ 事务内：书→已换出、两单→已完成、给B加书币、记B一笔流水
```

## 部署步骤（微信开发者工具）

1. 用微信开发者工具**导入本目录** `book-exchange-cloud/`，填入你自己的小程序 AppID。
2. 顶部点**云开发** → 开通（新用户有免费额度）→ 复制**环境 ID**。
3. 把 `miniprogram/config.js` 里的 `env` 改成你的环境 ID。
4. 右键 `cloudfunctions/bookex` → **上传并部署（云端安装依赖）**。
5. 在云开发控制台 → 数据库，新建 4 个集合：`users` `books` `orders` `transactions`
   （权限选「仅创建者可读写」即可，所有写操作都走云函数）。
6. 编译运行。首次进入书架若为空，小程序会自动调用 `seedBooks` 播一批演示书；
   也可在云开发控制台手动「测试」`bookex` 云函数：`{"action":"seedBooks","community":"阳光花园小区"}`。

## 本地验证（无需部署）

云函数逻辑用一个模拟的云数据库做了完整单测，可直接在本地跑：

```bash
cd book-exchange-cloud
npm test        # 跑全部：云逻辑(33) + 前后端契约(14)
```

- `test/run.js`：用 `test/mock-wx-server-sdk.js` 顶替真实 SDK，跑**真实的云函数代码**，
  覆盖登录建档、播种、书架隔离、原子扣币、**余额不足回滚**、交接结算、**重复确认幂等**等。
- `test/client-contract.js`：模拟 `小程序 api.js → callFunction → 云函数`，
  校验云端返回的数据结构正好是各页面 WXML 绑定的字段。

## 下一步可演进

- **云存储**：发布时上传真实封面图（现用 emoji 占位）
- **定位选小区**：用 `wx.getLocation` + 小区库自动归属，替代写死的默认小区
- **信用与履约**：交接超时提醒、爽约扣信用分、举报机制
- **运营**：小区管理员/物业入口、"建书架"活动页、消息订阅通知"有人要你的书"
