<template>
  <footer class="app-footer">
    <div class="container">
      <p class="footer-text">
        Created by Patrick Audriaz |
        <a href="mailto:audriazp@gmail.com" class="footer-link"
          >audriazp@gmail.com</a
        >
      </p>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  padding: 1rem 0;
  background-color: #2c3e50;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .footer-text {
    margin: 0;
    text-align: center;
  }

  .footer-link {
    color: white;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
