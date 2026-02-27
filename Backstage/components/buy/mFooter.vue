<script setup>
import ImgSrc from '@components/common/ImgSrc.vue'
// import Anchor from '@components/buy/mAnchor.vue'
</script>

<template>
  <div class="m-fooetr mx-auto mt-[32px] px-[16px] p:max-w-[1232px]">
    <div
      class="m-footer-container rounded-t-[15px] bg-[--gray-f7] py-[40px] tm:px-[16px] pt:flex p:px-[40px]"
    >
      <div class="m-footer-logo flex flex-col pt:grow">
        <ImgSrc
          src="common/logo.svg"
          :setClass="{
            main: 'h-[50px] w-[126px] grow',
          }"
        />
        <ul class="inline-flex shrink-0 items-center gap-x-[8px]">
          <li>
            <a href="javascript:;" class="text-[14px] text-[--green-6a2d] underline">
              <em>好房網首頁</em>
            </a>
          </li>
          <li>
            <a href="javascript:;" class="text-[14px] text-[--green-6a2d] underline">
              <em>會員中心</em>
            </a>
          </li>
        </ul>
      </div>
      <div class="m-footer-information space-y-[16px] text-[14px] text-[--gray-999] pt:shrink-0">
        <ul>
          <li>
            <p>
              好房國際股份有限公司 (統編：28006949) 負責建置及維護非經正式書面同意，禁止轉貼節錄。
            </p>
          </li>
          <li>
            <p>
              我們將使用追蹤技術來提供優質服務，當用戶使用網站服務即同意
              <a href="javascript:;" class="text-[14px] text-[--green-6a2d] underline">
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
              <a href="javascript:;" class="text-[14px] text-[--green-6a2d] underline">
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
