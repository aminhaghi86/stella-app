import { useNuxtApp } from "#app";
export default () => {
    const nuxtApp = useNuxtApp();
    return {
      gsap: nuxtApp.$gsap,
    };
  };