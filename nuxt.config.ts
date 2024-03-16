// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/scss/main.scss'],
  runtimeConfig: {
    public: {
      SOCKET_HOST: process.env.SOCKET_HOST,
      SOCKET_PORT: process.env.SOCKET_PORT,
      SOCKET_SSL: process.env.SOCKET_SSL,
      SOCKET_NAMESPACE: process.env.SOCKET_NAMESPACE,
      DEFAULT_WORKSPACE_ID: process.env.DEFAULT_WORKSPACE_ID,
    },
    private: {
      // Define private variables here (not exposed on client-side)
    },
  },
});
