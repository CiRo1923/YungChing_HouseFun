<script setup>
import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)
</script>

<template>
  <BuyMCardDefault
    :setClass="{
      main: 'p:mt-[32px]',
    }"
  >
    <ul class="divide-y-[1px] divide-[--gray-e5]">
      <li v-for="(item, index) in datas" :key="`${item.hfID}_${index}`">
        <section class="flex m:flex-col">
          <div class="order-2 grow">
            <header>
              <h2 class="font-normal">
                <BuyMAnchor
                  :text="item.caseTitle"
                  :to="{
                    name: 'buy-basic-id',
                    params: {
                      id: item.hfID,
                    },
                  }"
                  :setClass="{
                    main: 'tracking-wider underline p:text-[18px]',
                    text: 'font-normal',
                  }"
                />
              </h2>
            </header>
          </div>
          <CommonImgSrc
            :src="item.picURLCover"
            :alt="item.caseTitle"
            :setClass="{
              main: 'order-1 shrink-0 p:h-[152px] p:w-[200px]',
            }"
          />
        </section>

        <pre>
          {{ item }}
        </pre>
      </li>
    </ul>
  </BuyMCardDefault>
  <!-- <pre>
    {{ datas }}
  </pre> -->
</template>

<style lang="postcss"></style>
