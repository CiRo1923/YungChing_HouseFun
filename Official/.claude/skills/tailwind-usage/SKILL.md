---
name: tailwind-usage
summary: utility class 怎麼用
description: 本專案 utility class(tailwind 那類單一用途的 class)的使用規範。當在共用元件的 template 寫 class、在畫面上調整排版與尺寸、或修改建置工具的樣式設定檔(theme)時使用。規則:動手之前先讀這個專案的樣式設定(tailwind.config.js、tailwind.function.js、tailwind.theme.js,檔名固定但不一定都存在,位置在各自的專案根),認不出來的 class 先查設定再說 —— extend 底下的自訂沒有任何規則在守,看起來像拼錯的名字可能是專案自訂的;共用元件的 template 只留組件自身 class 與 --modifier,樣式寫進元件自己的 css;被 theme 整組覆寫掉的內建值不能再用(寫了不會報錯,但產不出任何 CSS);theme 重新定義的值不要用 sm / md / lg 這類尺寸縮寫,改用說得出用途的名字或實際數值。
---

# utility class 怎麼用

**這份管的是 utility class** —— `flex`、`px-20`、`text-lg` 這種「一個 class 一個用途」
的寫法,由建置工具(tailwind 那一類)產生。

三條規則,各自管一個地方:

| 規則 | 管什麼 | 範圍 |
| --- | --- | --- |
| `tailwind` | 共用元件的 template 不寫 utility class | 共用元件目錄的 `.vue` |
| `theme` | 不要用已經被覆寫掉、實際不存在的 class | 原始碼 |
| `themeNaming` | theme 重新定義的值不要用尺寸縮寫命名 | 建置工具的樣式設定檔 |

哪個目錄算共用元件、樣式設定檔叫什麼名字,都定義在
`.tools/lint/project-config.mjs`(`COMPONENTS_DIR` 與 `STYLE_CONFIG_FILES`)。
各專案的擺法不同,這份文件不另外抄一份路徑 —— 抄一份就會有對不上的一天,
而對不上的時候規則會安靜地不再檢查任何東西。

## 動手之前:先讀這個專案的樣式設定

**要寫、改、或判斷任何一個 utility class 之前,先把這三支讀過。**
每個專案自訂的東西都不一樣,憑 tailwind 的預設值去想,結論會是錯的。

| 檔名 | 放什麼 |
| --- | --- |
| `tailwind.config.js` | `theme` 的整組覆寫與 `extend` 的自訂、斷點、外掛 |
| `tailwind.function.js` | 設定檔用來算值的函式(例如依斷點算出一組寬度) |
| `tailwind.theme.js` | theme 單獨拆出來的那一份 |

**三支的檔名固定,但不一定都存在** —— 有的專案只有第一支。
位置在專案根層,各專案的專案根不同(這個 repo 裝了兩個專案,
所以是 `Project/Nuxt/` 與 `Project/Vite/` 各一份,不是 repo 根)。

### 看到不認得的 class,先查設定再說

`transition-opacitys` 看起來像把 `transition-opacity` 打錯多一個 s ——
實際上它是這個專案在 `extend.transitionProperty` 自訂的,
值是 `opacity, visibility`(同時過渡透明度與可見性,切換 `visibility` 的
淡入淡出要用它)。把它「修正」成 `transition-opacity` 會讓可見性不再過渡,
而畫面上只是元素消失的時機不對,不會報錯。

**`extend` 底下的自訂沒有任何規則在守。** 規則只讀整組覆寫的那一段
(見第二節),`extend` 那一段是整個挖掉的 —— 所以自訂的名字打錯了
不會有人發現,認不出來的 class 也不會被提醒。只能靠讀設定。

### 反過來也一樣:內建的值可能已經不存在

這個專案的 `fontSize` 與 `screens` 都是**整組覆寫**,
所以 `text-sm`、`text-base`、`sm:`、`md:` 這些內建的全部沒有了。
程式裡到處寫 `text-[14px]` 不是沒照規範,是內建值真的不在了。

## 一、共用元件的 template 只留組件 class 與 --modifier

**共用元件的 template 裡,class 只能是組件自身的 class 與它的 `--modifier`。**
排版與尺寸寫進元件自己的 css(與 `.vue` 放在同一個資料夾底下的樣式子資料夾)。

錯誤的寫法:

```vue
<template>
  <div class="m-card flex items-center gap-10 px-20">
    <span class="text-lg font-bold">標題</span>
  </div>
</template>
```

正確的寫法:

```vue
<template>
  <div class="m-card">
    <span class="m-card-title">標題</span>
  </div>
</template>
```

```css
.m-card {
  @apply flex items-center gap-10 px-20;
}

.m-card-title {
  @apply text-lg font-bold;
}
```

**沒有自己 class 的 `div` / `span` 要先補一個。** 那是這條規則最常卡住的地方 ——
不是「把 class 搬到 css 就好」,而是要先給那個元素一個名字。

### 為什麼

**一支元件被放進不同頁面時,長相要一致。** 樣式散在 template 的 class 裡時,
每一個使用端都看得到、也都改得動 —— 於是同一支元件在三個頁面長得不一樣,
而且沒有一個地方寫著它「本來」該長什麼樣。

**改一個間距要翻遍 template。** 樣式收在 css 裡時,一支元件的長相就是那幾支 css;
散在 template 裡則要從一長串 class 中找出哪幾個在管間距,而那串 class
常常還混著條件式綁定。

**頁面不在這條的範圍內。** 頁面是一次性的版面,不會被重複放進別的地方,
在那裡寫 utility class 是正常的。這條只管共用元件。

### 怎麼判定、哪些不算違規

判定採「已知清單」:工具列出常見的 utility class 名稱與前綴,命中才報。
反過來做(把不認得的都當違規)會把 `m-form`、`--px-15` 這類專案自訂的 class
全部誤報,而一條整批誤報的規則會被整條忽略。

這些都不算違規:

| 寫法 | 為什麼不算 |
| --- | --- |
| 組件自身 class(`m-card`)與變體(`--px-15`、`p:--px-24`) | 那是這支元件自己的名字,不是 utility class |
| 被 `<!-- -->` 註解掉的 template | 那是死程式碼,裡面的 class 不會產生任何樣式 |
| `<style>` 區塊裡的 class | 那本來就是寫樣式的地方 |
| 動態綁定裡的變數(`:class="setClass.main"`) | 只取引號裡的字面 class 判定,變數的值執行期才知道 |

帶斷點或狀態前綴的寫法(`p:flex`、`hover:bg-[--white]`)會先把前綴剝掉再判定 ——
`flex` 是 utility class,加了前綴仍然是。

## 二、被整組覆寫掉的 class 不能再用

建置工具的 theme 設定有兩種寫法,差別很大:

| 寫在哪 | 意思 |
| --- | --- |
| `extend` 底下 | **補充** —— 內建的值都還在,自己加的是多出來的 |
| 直接寫在 `theme` 底下 | **整組覆寫** —— 那一類的內建值全部消失 |

整組覆寫之後,再寫那些內建的名字(`text-lg`、`shadow-md`、`sm:` 這種斷點前綴)
**不會報錯,但產不出任何 CSS** —— 樣式就是沒有效果,而且很難查:
畫面上少了一段樣式,而那一行 class 看起來完全正常。

規則會讀專案自己的樣式設定檔,算出哪幾類被整組覆寫、覆寫後還剩哪些值,
用到已經消失的就報出來,訊息裡也會列出這一類現在可用的有哪些。

專案有沒有覆寫、覆寫了哪幾類,由設定檔決定 —— 沒有覆寫那一類的專案,
用內建值完全正常,不會被報。

## 三、theme 重新定義的值不要用尺寸縮寫

整組覆寫之後,專案要自己定義一套值。**那一套不要再用 `sm` / `md` / `lg`
這類尺寸縮寫命名**,改用說得出用途的名字(`content`、`default`)或實際數值。

錯誤的寫法:

```js
boxShadow: {
  sm: '0 1px 2px …',
  md: '0 4px 16px …',
}
```

正確的寫法:

```js
boxShadow: {
  card: '0 1px 2px …',
  popup: '0 4px 16px …',
}
```

### 為什麼

**縮寫說不出它是什麼。** 看到 `shadow-md` 仍然不知道那是多深的陰影,要翻設定檔。

**中間要加一階時整組都得改名。** 在 `sm` 與 `md` 之間插一個值,名字就排不下了,
於是整組重新命名,連帶每一個使用端。

**分不出是自訂的還是內建的。** 重新定義的 `md` 與 tailwind 內建的 `md`
長得一模一樣,接手的人看不出這是專案自己的一套。

這條檢查的是**設定檔本身**,不是使用端 —— 使用端寫什麼由第二節那條管。

模組 css 的變數命名也是同一個道理(級距不要用 `sm` / `md`),
兩邊用的是同一份縮寫清單,詳見 [[css-module-variables]]。

## 四、自動檢查

三條規則的判斷邏輯都在 `.tools/lint/`,五個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— 寫檔前的 hook 比對寫入前後的內容,只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

三條都不自動修正。工具看得出「這裡寫了 utility class」,
看不出那段樣式該進哪一支 css、那個元素該叫什麼名字 ——
自動改等於替開發者決定檔案結構與命名。

## 與相鄰規範的界線

| 這一份 | 相鄰的那一份 |
| --- | --- |
| 元件的 template 裡**寫什麼 class** | 元件**載入了什麼、開頭那幾行怎麼排**:[[component-conventions]] |
| 樣式**不要寫在 template 裡** | 樣式**該放哪一支檔案、變數怎麼分層**:[[css-module-variables]] |
| 尺寸與排版的 class | **顏色**一律走色票變數:[[color-naming]] |
| 一般的 utility class | 要對**父層的狀態**有反應時怎麼寫(`group` / `peer` 那種掛勾,以及為什麼不能用 `@apply group-hover:`):[[css-module-variables]] |

判斷方式:這次動的是 template 的 class,就看這一份;動的是 css 檔案本身,
看模組變數那一份;動的是顏色,看色票那一份。
