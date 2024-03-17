<template>
  <form @submit.prevent="handleSubmit" class="register-form">
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
      <button type="submit" class="button --wide-primary">Register</button>
      <NuxtLink to="/login" class="login__link"
        >Existing User? Login Here</NuxtLink
      >
    </div>
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
    // When you click "Register button" it sends the server, Sending  email and password from the UI .
    // If the server accepts your request,

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

<style lang="scss" scoped>
@import "@/assets/scss/components/button.scss";
.register-form {
  width: 400px;
  margin: 0 auto;
  padding: 3rem;
  background-color: #f0f0f0;
  border-radius: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  .login__link {
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
