<template>
  <div class="skeleton-content ">
    <div class="skeleton"></div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
@keyframes skeletonAnimate {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.skeleton-content {
  width: 100%;
  max-width: 30rem;
  opacity: 0;
  animation-name: skeletonAnimate;
  animation-duration: 2000ms;
  animation-direction: forward;
  animation-delay: 0;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  animation-timing-function: ease-out;
  .skeleton {
    margin: 0;
    // height: 0;
    width: 100%;
    padding: 2rem 1rem;
    border-radius: 1rem;
    border-bottom-left-radius: 0;
    background-image: linear-gradient(
      to right,
      hsla(210, 2%, 54%, 20%) 0%,
      hsla(210, 4%, 89%, 20%) 10%,
      hsla(210, 2%, 54%, 20%) 40%,
      hsla(210, 2%, 54%, 20%) 100%
    );
    background-repeat: repeat-x;
    background-size: 200% 100%;
    box-shadow: 0 4px 6px -1px hsla(0, 0%, 0%, 0.1),
      0 2px 4px -2px hsla(0, 0%, 0%, 0.1);
    animation: bgAnimate 2s linear infinite;
  }
}

@keyframes bgAnimate {
  0% {
    background-position: 50% 0;
  }
  100% {
    background-position: -150% 0;
  }
}
</style>
