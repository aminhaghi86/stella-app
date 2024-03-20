<template>
  <div class="chat__content__send">
    <input
      type="text"
      :value="message"
      @input="updateMessage($event.target.value)"
      :required="true"
      @keyup.enter="sendMessage"
      placeholder="Enter something..."
      class="chat__content__send__input"
    />
    <button @click="sendMessage" class="chat__content__send__button">
      <SendSvg :style="{ color: buttonColor }" />
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  message: String,
  sendMessage: Function,
  buttonColor: String,
});

const emit = defineEmits(["update:message"]);

const updateMessage = (value) => {
  emit("update:message", value);
};
</script>

<style lang="scss" scoped></style>
