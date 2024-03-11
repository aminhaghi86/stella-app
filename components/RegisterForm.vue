<template>
  <form @submit.prevent="handleSubmit" class="register-form">
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
    <button type="submit" class="btn btn-primary">Register</button>
    <NuxtLink to="/login">go to Login</NuxtLink>
  </form>
</template>

<script>
import axios from "axios";

export default {
  name: "RegistrationForm",
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await axios.post(
          "http://localhost:5001/register",
          {
            username: this.email,
            password: this.password,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log(response.data);
        alert(
          "Registration successful! Please log in with your new credentials."
        );
        this.email = "";
        this.password = "";
        navigateTo("/login");
      } catch (error) {
        console.error("Registration error:", error.response.data);
        alert("Registration failed. Please try again.");
      }
    },
  },
};
</script>

<style scoped>
.register-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
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
