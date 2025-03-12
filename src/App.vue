<template>
  <div class="app">
    <template v-if="isAuthenticated">
      <div class="app-wrapper">
        <header class="app-header">
          <div class="header-content">
            <div class="header-title">
              <h1>🧴💨🧱 Pschitt Mur</h1>
              <span class="header-subtitle">Le Hangar, Fribourg</span>
            </div>
            <button class="logout-btn" @click="logout">Logout</button>
          </div>
        </header>
        <main class="app-content">
          <router-view />
        </main>
        <AppFooter />
      </div>
    </template>
    <LoginForm v-else @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import AppFooter from "./components/AppFooter.vue";
import LoginForm from "./components/LoginForm.vue";

const isAuthenticated = ref(false);

onMounted(() => {
  // Check if user is authenticated
  checkAuthentication();
});

const checkAuthentication = () => {
  const auth = localStorage.getItem("pschitt-mur-auth");
  isAuthenticated.value = auth === "true";
};

const handleLoginSuccess = () => {
  isAuthenticated.value = true;
};

const logout = () => {
  localStorage.removeItem("pschitt-mur-auth");
  isAuthenticated.value = false;
};
</script>

<style lang="scss">
.app {
  height: 100vh;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  padding: 1rem;
  background-color: #2c3e50;
  color: white;
  text-align: center;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .header-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    h1 {
      margin: 0;
      font-size: 1.4rem;
    }

    .header-subtitle {
      font-size: 0.9rem;
      opacity: 0.8;
    }
  }

  .logout-btn {
    background-color: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: var(--border-radius);
    padding: 0.3rem 0.8rem 0.4rem 0.8rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.app-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>
