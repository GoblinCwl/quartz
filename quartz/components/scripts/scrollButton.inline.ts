function setupScrollButtons() {
  const scrollTopBtn = document.getElementById("scroll-top")
  const scrollBottomBtn = document.getElementById("scroll-bottom")

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    })
  }

  if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener("click", () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      })
    })
  }
}

// Wait for DOM to be fully loaded before setting up event listeners
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupScrollButtons)
} else {
  setupScrollButtons()
}