<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-form">
        <h2>🧴💨🧱 Pschitt Mur</h2>
        <p class="login-subtitle">Spray Wall at Le Hangar, Fribourg</p>

        <div class="form-group">
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            @keyup.enter="login"
            class="password-input"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button @click="login" class="login-btn">Enter</button>

        <p class="login-info">
          This app is for creating and managing boulder problems on the spray
          wall at Le Hangar climbing gym in Fribourg.
        </p>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from "vue";
import AppFooter from "./AppFooter.vue";

const password = ref("");
const error = ref("");

const emit = defineEmits(["login-success"]);

const login = () => {
  // Get the password from environment variables
  const correctPassword = import.meta.env.VITE_APP_PASSWORD;

  if (password.value === correctPassword) {
    // Set authentication in localStorage
    localStorage.setItem("pschitt-mur-auth", "true");
    // Emit success event
    emit("login-success");
    // Clear any error
    error.value = "";
  } else {
    error.value = "Incorrect password. Please try again.";
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";

.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background-color: var(--bg-color);
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  text-align: center;

  h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--dark-color);
  }

  .login-subtitle {
    margin-bottom: 1.5rem;
    color: #666;
    font-style: italic;
  }

  .login-info {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    color: #666;
    line-height: 1.4;
  }
}

.form-group {
  margin-bottom: 1.5rem;

  .password-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: var(--border-radius);
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
  }
}

.error-message {
  color: var(--danger-color);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: color.scale(#3498db, $lightness: -10%);
  }
}
</style>
