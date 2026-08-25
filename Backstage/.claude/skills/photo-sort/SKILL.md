---
name: photo-sort
description: 動到物件照片的排序、封面照或上傳前必須先讀。記錄一個橫跨三條驗收缺陷的共同根因 —— 後端依 CaseImageDto.sort 排序,而前端拖拉只重排陣列、沒有更新 sort,所以順序與封面照存不進去。含待與後端確認的清單與修法位置。觸發時機 - 要改 components/buy/mUpload/Multiple.vue 的排序、pages/buy/publish/basic/_components/pictures/Photos.vue、stores/buy/.composables/usePublishActions.js 的送出;或使用者提到「照片順序 / 封面照 / 拖拉排序 / 照片上傳張數」。
---

# 物件照片的排序與封面照

## 一個根因,三條缺陷

| 條目 | 出處 | 描述 |
|---|---|---|
| **D-06** | B101 物件刊登 | 物件照片順序未依拖拉排序;複測「更改封面照時,列表並未改變」 |
| **N-21** | B102 物件管理 | 拖拉照片順序沒作用;更改封面照,編輯頁會變但列表與 C 端不變 |
| **N-20** | B102 物件管理 | 新上傳的照片跑到第一張,取代原本的封面照(**推測**同源,待驗證) |

前兩條是**同一件事被記在兩份文件裡**,不要當成兩個問題各修一次。

## 根因:後端依 `sort`,前端只重排陣列

swagger 的 `CaseImageDto`(`.api.json/swagger.json`)只有五個欄位:
`imgID` / `usageID` / `url` / `token` / **`sort`**。

`sort` 的說明是:

> 排序,數字越小越前面(同一物件的圖片依此欄位排序)

**沒有 `isCover` 之類的欄位** —— 封面照就是 `sort` 最小的那張。前端也是這個前提:
`pictures/Photos.vue` 用 `.case-pictures:first-child:before` 標「封面照」。

而拖拉排序(`components/buy/mUpload/Multiple.vue` 的 `commitSortOrder`)是:

```js
const next = [...innerList.value]
const [draggedItem] = next.splice(draggedIndex, 1)
next.splice(targetIndex, 0, draggedItem)
innerList.value = next
```

**只動陣列位置,`sort` 的值原封不動。** 儲存時 `usePublishActions.js` 的 `onApiPOSTRealEstate`
把 `...apiData.value` 整包送出,後端收到的每張圖 `sort` 還是舊的 → 依舊排序。

**編輯頁看起來有變是假象** —— 那是本地陣列順序,重新載入就會打回原形。

> D-06 在 0804 曾被標「✅ 已修正」,0805 複測因「自動化無法模擬拖拉」轉為 △。
> 推測那次只做了畫面上的重排,沒動資料層的 `sort`,所以當時被判定通過。

## 修法:送出前依陣列索引重編 `sort`

**位置放在 `usePublishActions.js` 的送出處**(`onApiPOSTRealEstate`,以及草稿的
`onApiPOSTRealEstateDraft`),不要放進 `mUpload/Multiple.vue`:

- `mUpload` 是共用元件,不該知道 `sort` 這個業務欄位
- 送出前統一重編是**單一出口** —— 不管順序是被拖拉、刪除還是新上傳改變的,存進去的都跟畫面一致

## 待與後端確認(未確認前不要動手)

- [ ] `sort` 起始值是 0 還是 1?
- [ ] 既有資料的 `sort` 現況 —— 連號?有跳號?
- [ ] 新上傳時 `apiPOSTRealEstatePicUpload` 回傳的 `sort` 是什麼值?(決定 N-20 是否同源)
- [ ] 確認封面照就是「`sort` 最小者」,後端沒有另外的封面欄位
- [ ] 格局圖 `caseLayout`(單張 `CaseImageDto`)要不要也給 `sort`?

## 相關但不同源的條目

- **N-22**「編輯時會自動全選照片,取消勾選後送出會刪掉照片」——
  `pictures/Photos.vue` 的「刪除已勾選 N 張」按鈕實作是 `casePictures = []`(**直接清空全部**),
  而且 N 顯示的是總張數不是勾選數。跟 `sort` 無關,是另一個問題。
- **D-08**「上傳滿 25 張後新增按鈕未消失」—— `Multiple.vue` 的 `hasAppendButton` 與
  `isWithinMaxCount` 邏輯經檢查是正確的(24 張時 `24+1 <= 25` 成立仍顯示,25 張時隱藏),
  複測回報的「24 張後第 25 張無法上傳」在現行程式碼上重現不出來,需要實機確認。
