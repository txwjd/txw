document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     Bookmark
  ========================== */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.bookmark');
    if (!btn) return;
    btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', btn.classList.contains('active'));
  });

  /* ==========================
     Modal (Search / Notification / FAQ 공통)
  ========================== */
  function setupModal(triggerSelector, modalSelector) {
    const trigger = document.querySelector(triggerSelector);
    const modal = document.querySelector(modalSelector);
    if (!trigger || !modal) return;

    const closeBtn = modal.querySelector('.close-btn');

    // 열기
    trigger.addEventListener("click", () => {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    });

    // 닫기 버튼
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    });

    // 바깥 클릭 시 닫기
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  setupModal(".search", ".search-modal");
  setupModal(".notification", ".notification-modal");
  setupModal(".faq-btn", ".faq-modal");

  /* ==========================
     Slider (Arrow Navigation)
  ========================== */
  const slides = document.querySelectorAll(".slide");
  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  document.querySelector(".arrow.left").addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(currentIndex);
  });

  document.querySelector(".arrow.right").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  });

  // 첫 슬라이드 표시
  showSlide(currentIndex);
});
