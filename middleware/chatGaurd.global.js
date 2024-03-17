const token =
  typeof window !== "undefined" && window.localStorage.getItem("session");

export default defineNuxtRouteMiddleware((to, from) => {
  console.log(to);
  console.log(from);
  if (to.path === "/" && !token) {
    return navigateTo("/login");
  }
});






