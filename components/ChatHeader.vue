<template>
  <div class="chat__header">
    <div class="chat__header__actions">
      <button
        class="chat__header__actions__new-chat button --wide-secondary"
        @click="clearMessage"
      >
        <AddButton /> New Chat
      </button>
      <ChatContact />
    </div>
    <div class="chat__header__chat"></div>
    <ChatLogout :logout="logout" />
  </div>
</template>

<script setup>
const props = defineProps({
  clearMessage: Function,
  logout: Function,
});
</script>

<style lang="scss"></style>
