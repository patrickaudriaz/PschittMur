<template>
  <footer class="app-footer">
    <div class="container">
      <p class="footer-text">
        Created by Patrick Audriaz<br />
        <a href="mailto:audriazp@gmail.com" class="footer-link"
          >audriazp@gmail.com</a
        >
        |
        <a
          href="https://www.instagram.com/petit_patoche/"
          target="_blank"
          class="footer-link"
        >
          @petit_patoche
        </a>
      </p>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@use "sass:color";

.app-footer {
  padding: 0.7rem 0;
  background-color: #2c3e50;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .footer-text {
    margin: 0;
    text-align: center;
    line-height: 1.5;
  }

  .footer-link {
    color: white;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
      color: color.adjust(white, $alpha: -0.2);
    }
  }

  .instagram-icon {
    font-size: 1rem;
    vertical-align: middle;
  }
}
</style>
