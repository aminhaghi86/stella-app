<template>
  <form @submit.prevent="login" class="login-form">
    <div class="form-group">
      <input
        type="email"
        id="email"
        v-model="email"
        required
        class="form-control"
        placeholder="Username"
      />
    </div>
    <div class="form-group">
      <input
        placeholder="Password"
        type="password"
        id="password"
        v-model="password"
        required
        class="form-control"
      />
    </div>
    <div class="form-group">
      <button
        style="transform: translateY(60px); opacity: 0"
        ref="button"
        type="submit"
        class="button --wide-primary"
      >
        Login
      </button>
      <NuxtLink to="/register" class="register-link"
        >New User? Register Here</NuxtLink
      >
      <div v-if="loginError" class="error-message">{{ loginError }}</div>
    </div>
  </form>
</template>

<script>
import axios from "axios";
import Session from "~/utils/session";
export default {
  mounted() {
    this.session = new Session();
    this.session.loadSession();
    this.animateButton();
  },
  data() {
    return {
      email: "",
      password: "",
      loginError: null,
      animateOnMount: true,
    };
  },

  methods: {
    animateButton() {
      const { gsap } = useGsap();
      console.log(gsap);
      const lasd = this.$refs["button"];
      console.log(lasd);
      gsap.to(this.$refs["button"], {
        y: 0,
        duration: 1,
        opacity: 1,
        ease: "bounce.out",
      });
    },

    //
    //Handles login process, sends credentials, stores token in localstorage.
    async login() {
      try {
        const response = await axios.post("http://localhost:5001/auth/login", {
          username: this.email,
          password: this.password,
        });

        const { access_token } = response.data;
        this.session.access_token = access_token;
        this.session.username = this.email;
        this.session.saveSession();
        this.loginError = null;
        navigateTo("/");
      } catch (error) {
        if (error.response && error.response.data) {
          console.error("Login error:", error.response.data);
          this.loginError = error.response.data.msg || "Login failed";
        } else {
          console.error("Login error:", error);
          this.loginError = "Login failed";
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/assets/scss/components/button.scss";
.login-form {
  width: 400px;
  margin: 0 auto;
  padding: 3rem;
  background-color: #f0f0f0;
  border-radius: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  .register-link {
    background: none;
    color: #007bff;
    padding: 1rem 2rem;
    border: none;
    border-radius: 0.25rem;
    text-decoration: none;
    cursor: pointer;
    display: inline-block;
    font-weight: bold;
    font-size: 0.75rem;
  }
}

.form-control {
  display: block;
  width: 100%;
  padding: 1rem;
  border: 1px solid #f0f0f0;
  border-radius: 1rem;
  box-sizing: border-box;
  &::placeholder {
    color: #d6d8d9;
  }
}

.error-message {
  color: red;
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>
