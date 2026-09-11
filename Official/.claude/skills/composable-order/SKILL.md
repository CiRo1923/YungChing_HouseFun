---
name: composable-order
summary: 宣告順序，存檔自動排序
description: 本專案的 store/actions composable 宣告順序規範。當在原始碼的 .vue（頁面或元件）新增或調整 useXxxStore()/useXxxActions() 宣告，或想知道 <script setup> 開頭該怎麼排時使用。順序：common → project → nav → member → 自己頁面 → 其他頁面 → json → lineLiff → popup，最後 useRoute → useRouter；每個分類內部是 use*Store → storeToRefs → use*Actions；專案沒有的項目自然略過。這條不報違規，存檔時直接把順序排好。ref / computed 這類語句是屏障，屏障之間不搬移。整體 script setup 的區塊順序（defineEmits → defineProps → stores/actions → ref → computed → async api → function → watch → onMounted → onUnmounted）只是建議，工具不排也不提醒，因為有些 computed 必須寫在前面。
---

# composable 宣告順序規範

在 `<script setup>` 中，`const ... = useXxxStore()` / `const ... = useXxxActions()`
這類宣告一律依固定順序排列。

**這條不報違規 —— 存檔時工具會直接把順序排好。** 順序是機械式的規則，
讓人照著訊息一行一行搬只是浪費時間，而且搬的過程比工具更容易出錯。

## 順序（由先到後）

| | 分類 | 是什麼 |
| --- | --- | --- |
| 1 | **common** | 全站共用 |
| 2 | **project** | 專案層級 |
| 3 | **nav** | 導覽 |
| 4 | **member** | 會員 |
| 5 | **自己頁面** | 這支檔案所屬的頁面資料夾對應的那一支 |
| 6 | **其他頁面** | 其餘各頁面，彼此不限先後 |
| 7 | **json** | 靜態文案資料 |
| 8 | **lineLiff** | 外部平台整合 |
| 9 | **popup** | 彈窗 |

最後接 `useRoute()`，再接 `useRouter()`。

**每一個分類內部固定三行的順序：**

```js
const member = useMemberStore()                    // 1 取 store
const { info } = storeToRefs(member)               // 2 取值
const { onApiGetMemberInfo } = useMemberActions()  // 3 取行為
```

`storeToRefs` 屬於它上面那一支 store 的同一組，靠參數的變數名認出來 ——
整組要移動時它會跟著走。

**專案沒有的項目自然略過** —— 這份順序是通用的，不是每個專案都有全部九項。

`member` 有兩種身分：在別的頁面時它是固定的第 4 項；
在 member 自己的頁面裡，它就是「自己頁面」（第 5 項）。

共用元件不在任何頁面目錄底下，所以沒有「自己頁面」，
所有頁面 store 對它來說都是「其他頁面」。

### 附則

- `const pageJson = computed(() => json...)` 要緊接在 `useJsonStore` / `useJsonActions`
  之後 —— `pageJson` 依賴 `json`，隔開就會用到還沒宣告的變數。
  這一行是 `computed`，所以它同時也是屏障：工具不會跨過它搬動任何宣告，
  它上下兩段各自排序，位置要自己放對。
- `defineProps` / `defineEmits` / `defineModel`、`const props/emits = ...` 維持在最上方。
- 宣告上方緊鄰的註解視為那一行的一部分，排序時跟著一起搬。

## 屏障（barrier）

會被排序的只有這四種：`use*Store`、`storeToRefs`、`use*Actions`、`useRoute` / `useRouter`。

**除此之外的任何語句都是屏障** —— `ref()`、`computed()`、一般的函式呼叫都算。
**屏障前後各自為獨立區塊，只在區塊內排序，絕不跨屏障搬移。**

這是安全底線。那些語句可能引用前面任何一個宣告（`const total = computed(() => list.value.length)`
依賴 `list`），把後面的東西搬到它前面會造成「用到還沒初始化的變數」，程式直接壞掉。
所以被屏障隔開的排列會被保留，不會硬排。

## 範例

以一支放在 `exchange` 頁面底下的檔案為例：

```js
const common = useCommonStore()                    // 1 common
const { device } = storeToRefs(common)
const { onLoaded } = useCommonActions()

const { userData } = storeToRefs(useProjectStore()) // 2 project
const { onApiXxx } = useProjectActions()

const nav = useNavStore()                          // 3 nav

const member = useMemberStore()                    // 4 member
const { info } = storeToRefs(member)

const exchange = useExchangeStore()                // 5 自己頁面
const { detail } = storeToRefs(exchange)
const { onApiGetExchangeDetail } = useExchangeActions()

const pets = usePetsStore()                        // 6 其他頁面

const json = useJsonStore()                        // 7 json
const pageJson = computed(() => json.exchange)     // 緊接 json

const { onScanCode } = useLiffActions()            // 8 lineLiff
const popup = usePopupActions()                    // 9 popup

const route = useRoute()                           // 最後 route
const router = useRouter()                         // 再 router
```

同一支檔案如果放在 `member` 頁面底下，`useMemberStore` 就變成「自己頁面」，
排在 `nav` 之後、其他頁面之前。

順序不對時不會收到訊息 —— 存檔的時候就排好了。

## `<script setup>` 整體區塊順序

**這一段是建議，工具不會自動排，也不會提醒。**
因為有正當的例外 —— 有些 `computed` 必須寫在別的宣告之前（後面的東西依賴它），
硬排會把程式改壞。寫的人自己判斷。

盡量依這個順序：

1. **defineEmits**
2. **defineProps** / **defineModel**
3. **stores / actions / route / router**（這一段工具會自動排好）
4. **ref**（`ref()` / `reactive()` 狀態）
5. **computed**
6. **async api**（呼叫 API 的 `async` function）
7. **function**（一般同步 function）
8. **watch**
9. **onMounted**
10. **onUnmounted**

`route` 與 `router` 一律用 `useRoute()` / `useRouter()`，
不要 `inject('route')` / `inject('router')`。

```js
const props = defineProps({ ... })          // 1
const { onLoaded } = useCommonActions()      // 2 stores/actions
const member = useMemberStore()
const { onApiMemberPets } = useMemberActions()
const route = useRoute()                     // 3 緊接最後一個 stores/actions
const router = useRouter()
const list = ref(null)                       // 4 ref
const total = computed(() => list.value?.length)  // 5 computed
const onApiXxx = async () => { ... }         // 6 async api
const onFormat = (x) => { ... }              // 7 function
watch(() => props.x, () => { ... })          // 8 watch
onMounted(async () => { ... })               // 9 onMounted
onUnmounted(() => { ... })                   // 10 onUnmounted
```

## 自動檢查

**這條不報違規，存檔時直接排好。** 排序邏輯在 `.tools/lint/rules-code.mjs`
的 `onSortComposables`。

- **存檔時** —— 編輯器與開發伺服器會把 `<script setup>` 裡的宣告順序排好，
  並在終端機印一行「已自動排好」。
- **commit 前不動程式碼** —— commit 那一刻改動檔案，人會提交到自己沒看過的內容。
- **AI 寫檔時也不擋** —— 順序不對就是排好，不需要擋下來要求重寫。

它會做的事只有一件：**在同一個屏障區塊內，把宣告換位置**。
不新增、不刪除、不改內容；宣告上方緊鄰的註解跟著一起搬。

驗證在 `npm run test:css`，其中特別檢查「排序前後的內容一行都不能少」——
少一行就是把程式碼刪掉了，那比排錯順序嚴重得多。
