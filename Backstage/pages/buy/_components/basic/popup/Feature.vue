<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

const example1 = readonly([
  {
    content: '★室內格局：3 房 2 廳 2 衛.採光通風良好.工作陽台方便實用.★',
  },
  {
    content: '★生活機能：近便利商店；全聯頂好大賣場；十興國小.成功國中.★',
  },
  {
    content: '★附近交通：近中山高交流道公車站；高鐵新竹站捷運站★',
  },
  {
    content: '★純住宅社區，環境清淨零噪音★',
  },
  {
    content: '★交通便利，1 分鐘至喜來登商圈，10 分鐘至 costco，5 分鐘至高鐵站★',
  },
  {
    content: '★ 15 分鐘至新竹園區 (台元園區不到 8 分鐘) ★',
  },
  {
    content: '★近頂好超市，全聯福利中心，傳統市場，學區，公園綠地，生活機能佳★',
  },
])

const example2 = readonly({
  label: 'decimal',
  items: [
    {
      item: '明星成功學區',
    },
    {
      item: '公園綠帶多 ~ 距離中山高、XX交流道近',
    },
    {
      item: '建案臨路退縮 11 米 ~ 樓高 15 層 ~ 地下 2 層為平面車位',
    },
    {
      item: '戶戶 3 面採光 ~ 客廳規劃 4.1 米寬落地窗',
    },
    {
      item: '主臥衛浴 ~ 為日系品牌 INAX 自動馬桶等設備',
    },
    {
      item: '廚房則規畫 CORIAN 人造石檯面',
    },
    {
      item: '配有德國 BOSCH 崁入式洗碗機',
    },
    {
      item: 'XX建設 ~ 品質保證 ~',
    },
  ],
})
</script>

<template>
  <CustomPopup
    id="popupFeature"
    :setClass="{
      main: 'p:--w-1055 t:--w-720',
    }"
  >
    <div class="tracking-wider">
      <p>
        <b class="font-semibold">請充分描述物件特色：</b>
      </p>
      <ol class="m:mt-[20px] m:space-y-[20px] pt:mt-[30px] pt:space-y-[30px]">
        <li class="m:space-y-[10px] pt:flex pt:gap-x-[40px]">
          <b class="font-semibold m:block pt:w-[55px] pt:shrink-0">範例一</b>
          <ul class="text-[--gray-666]">
            <li v-for="(item, index) in example1" :key="`example1_${index}`">
              {{ item.content }}
            </li>
          </ul>
        </li>
        <li class="m:space-y-[10px] pt:flex pt:gap-x-[40px]">
          <b class="font-semibold m:block pt:w-[55px] pt:shrink-0">範例二</b>
          <BuyMItemMain
            :data="example2"
            :setClass="{
              container: 'text-[--gray-666]',
            }"
          />
        </li>
      </ol>
    </div>
  </CustomPopup>
</template>

<style></style>
