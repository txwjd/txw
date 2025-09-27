// bookmark.js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.bookmark');
  if (!btn) return;

  btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
});

// search.js

// notification.js 

// 자주하는 질문.js 

// 방향키.js 