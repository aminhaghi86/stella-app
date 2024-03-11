<template>
  <form @submit.prevent="login" class="login-form">
    <div class="form-group">
      <label for="email" class="form-label">Email:</label>
      <input
        type="email"
        id="email"
        v-model="email"
        required
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="password" class="form-label">Password:</label>
      <input
        type="password"
        id="password"
        v-model="password"
        required
        class="form-control"
      />
    </div>
    <div class="form-group">
      <button type="submit" class="btn btn-primary">Login</button>
      <NuxtLink to="/register">go to register</NuxtLink>
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
  },
  data() {
    return {
      email: "",
      password: "",
      loginError: null,
    };
  },
  methods: {
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

<style scoped>
.login-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message {
  color: red;
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>
