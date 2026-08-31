<script setup>
import '@css/_modules/buy/mFooter/variables.css'
import '@css/_modules/buy/mFooter/common.css'

const houseFun = readonly([
  {
    label: '好房網首頁',
    href: 'javascript:;',
  },
  {
    label: '會員中心',
    href: 'javascript:;',
  },
])
</script>

<template>
  <div class="m-footer">
    <div
      class="m-footer-container"
    >
      <div class="m-footer-logo">
        <CommonImgSrc
          src="common/logo.svg"
          :setClass="{
            main: 'h-[50px] w-[126px] p:grow',
          }"
        />
        <ul class="m-footer-links">
          <li v-for="(item, index) in houseFun" :key="`${item.label}_${index}`">
            <a :href="item.href" class="m-footer-link">
              <em>{{ item.label }}</em>
            </a>
          </li>
        </ul>
      </div>
      <div
        class="m-footer-information"
      >
        <ul>
          <li>
            <p>
              好房國際股份有限公司 (統編：28006949) 負責建置及維護非經正式書面同意，禁止轉貼節錄。
            </p>
          </li>
          <li>
            <p>
              我們將使用追蹤技術來提供優質服務，當用戶使用網站服務即同意
              <a href="javascript:;" class="m-footer-link">
                <em>隱私權政策</em>
              </a>
            </p>
          </li>
        </ul>
        <ul>
          <li>
            <p>網站客服專線：412-8668 (手機直撥請加 02) 賣屋刊登服務專線：02-77048996</p>
          </li>
          <li>
            <p>
              客服服務時段：週一到週五 9:00 ~ 12:00 / 13:30 ~
              18:00，如遇非服務時段或忙線，歡迎多加利用
              <a href="javascript:;" class="m-footer-link">
                <em>客服信箱</em>
              </a>
              留言
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style></style>
