<template>
     <ul v-if="hasMessages" class="chat__content__main__messages">
          <li
            v-for="message in messages"
            :key="message.text"
            :class="{
              chat__content__main__messages__item: true,
              user: message.type === 'user',
              stella: message.type === 'stella',
            }"
          >
            <span class="chat__content__main__messages__item__text">
              {{ message.text }}
            </span>
          </li>
          <li
            v-if="waiting_for_response"
            class="chat__content__main__messages__item stella"
          >
            <LoadingEffect />
          </li>
        </ul>
</template>

<script setup>
const props = defineProps({
  hasMessages: Function,
  messages: Array,
  waiting_for_response:Boolean
});
</script>

<style lang="scss" scoped>
@import "@/assets/scss/_colors.scss";
@import "@/assets/scss/components/button.scss";
 
</style>