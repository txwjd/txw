// main.js
function togglePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = (popup.style.display === "block") ? "none" : "block";
}

// 전역에서 호출할 수 있도록 window에 등록
window.togglePopup = togglePopup;

// bookmark.js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.bookmark');
  if (!btn) return;

  btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
});

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