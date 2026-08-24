---
name: scrollbar-spacing
description: 調整捲軸與內容之間的間距前必須先讀。說明 .scrollbar 的分層原則(basic.css 只管外觀,間距歸元件自己的 CSS 模組)、mPopup 與 mTable 兩種已實作的做法與各自的取捨,以及尚未實測 / 尚未處理的部分。觸發時機 - 要改 assets/css/_common/basic.css 的 .scrollbar、assets/css/_modules/common/mPopup/*.css、assets/css/_modules/buy/mTable.css;或使用者回報「捲軸貼著內容 / 太擠 / 表格右邊縮排怪怪的 / 內容沒對齊」。
---

# 捲軸與內容的間距

驗收條目 **C-07**(手機版留言管理燈箱,篩選項目和捲軸太近)引出的一套處理方式。
PC 版的留言管理與瀏覽數燈箱也有同樣問題(捲軸貼著表格最後一欄)。

## 分層原則(不可違反)

| 檔案 | 負責 |
|---|---|
| `assets/css/_common/basic.css` 的 `.scrollbar` | **只管捲軸外觀** —— 顏色、圓角、寬度(`--y` 4px / `--x` 4px),以及 `--x` / `--y` 決定捲動方向 |
| 各元件自己的 CSS 模組 | **間距屬於版面,歸元件自己管**。不得為了某個元件的間距去動 `basic.css` |

曾經試過在 `basic.css` 加一個 `--scroll` 修飾符讓各處選用,**已否決** ——
間距是元件的版面問題,不該進通用的捲軸樣式。同理也不要為此新造 class 名稱,
直接用元件本來就掛著的 `scrollbar --y` 當選擇器即可。

---

## 兩種已實作的做法

### 1. mPopup —— 負 margin 外擴,再 padding 推回

`assets/css/_modules/common/mPopup/common.css` 的 `.m-popup-body`:

```css
margin-inline: calc(var(--popup-body-px) * -1);

@apply grow overflow-hidden px-[--popup-body-px];
```

值在 `variables.css`,PC / 平板 / 手機各一支(`--popup-body-{pc,tablet,mobile}-px`,目前都是 8px)。

**為什麼不直接改 container 的 padding**:`.m-popup-header` 的 `border-b` 底線寬度等於
container 的內容寬度,動 container 的 px 會把底線一起拉寬。改用負 margin 後:

- body 往兩側擴張進 container 的 padding 區,再用等寬 padding 把內容推回原位
- 內容位置不變,與 header / footer 維持對齊
- 捲軸落進 padding 區,與內容之間空出 `--popup-body-px`
- container、header、footer 一行都沒動

### 2. mTable —— 單純 padding-right

`assets/css/_modules/buy/mTable.css`:

```css
.m-table-container {
  &.scrollbar.\-\-y {
    @apply pr-[--table-scroll-px];
  }
}
```

值 `--table-scroll-px: 8px` 在同檔 `:root`(單一值,沒有分裝置)。
`mTable.css` 由 `components/buy/mTable/{CheckboxResponsiv,Default}.vue` 各自 `<style src>` 引入。

**副作用(重要)**:`m-table-container scrollbar --y` 是**寫死在兩個表格元件裡**的,
所以**全站每個表格都會吃到這 8px 右內距** —— 包含沒有 `max-h`、根本不會捲動的表格。
決策當下是刻意的(「統一都加」),但尚未逐一目視確認。

另外表頭灰底(`--thead-gray-f2` / `--thead-gray-f7`)會跟著往左退 8px,
捲軸落在退出來的白色區。這是肉眼看得出來的變化。

---

## 全專案只有這些地方會真的捲動

| 位置 | 容器 | 狀態 |
|---|---|---|
| `pages/buy/list/_components/popup/comment/Datas.vue` | `container: 'p:max-h-[365px]'`(留言管理) | 已由 mTable 規則覆蓋 |
| `pages/buy/list/_components/popup/View.vue` | `container: 'p:max-h-[365px]'`(瀏覽數) | 已由 mTable 規則覆蓋 |
| `pages/buy/publish/basic/_components/terms/Items.vue:61` | `container: 'scrollbar --y m:max-h-[220px] pt:max-h-[90px]'` | **尚未處理** —— 那是 mAccordion 的 container,不歸 mTable 管,要比照辦理得寫在 mAccordion 自己的樣式裡 |

其他既有寫法可參考:

- `pages/buy/_components/AutoRefrshInfo.vue:48`、`AutoRefreshTemplateInfo.vue:47` —— 直接 `p:px-[6px]`,而且只在 PC(手機沒補,正是 C-07 抱怨的情境)
- `assets/css/_modules/buy/mFormDropdown.css:192` —— `.m-form-dropdown-body` 用 `calc(container-px - default-px)`,讓內容右緣與 header 對齊、捲軸落在外框留的 4px 帶子裡。左側會因此比 header 少 4px(捲軸寬),是既有實作接受的誤差

---

## 待辦(換機器後接續)

- [ ] **手機版**留言管理燈箱實測間距是否足夠(8px = 捲軸 4px + 4px 餘裕,是估的值)
- [ ] **PC 版**留言管理 / 瀏覽數兩個表格實測
- [ ] **全站其他不捲動的表格**目視確認 8px 右內距有沒有讓版面變怪 —— 影響面最廣的一項
- [ ] 其他 popup(自動刷新、成交等)確認內容沒跑位
- [ ] `terms/Items.vue` 的條款捲動區要不要比照處理
- [ ] 表頭灰底右退 8px,確認 PM 能接受

調整時**只改數值**:`--popup-body-{pc,tablet,mobile}-px` 與 `--table-scroll-px`,
不要把數值寫回元件的 template。
