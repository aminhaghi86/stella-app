<template>
  <div class="chat__header__actions__contacts">
    <div
      v-for="(contact, index) in contacts"
      :key="index"
      class="chat__header__actions__contacts__item"
    >
      <MessageSvg />
      <span :class="['chat__header__actions__contacts__item__name']">{{
        contact.name
      }}</span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      contacts: [
        { name: "AI Chat Tool" },
        { name: "AI Chat Tool" },
        { name: "AI Chat Tool" },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
 
</style>
