<template>
    <div class="chat__header__user">
        <button
          @click="logout"
          class="chat__header__user__logout button --white"
        >
          <LogoutSvg />Logout
        </button>
      </div>
</template>

<script setup>

const props = defineProps({
  logout: Function,
});
</script>

<style lang="scss" scoped>
  
</style>