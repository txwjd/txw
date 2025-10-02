// 전체 래퍼와 전환 버튼 요소 가져오기
const wrapper = document.querySelector('.wrapper');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');

// 'Sign Up' 버튼 클릭 시 (로그인 -> 회원가입 화면)
signUpBtn.addEventListener('click', () => {
    // wrapper에 'active' 클래스를 추가하여 CSS 전환 애니메이션 발동
    wrapper.classList.add('active');
});

// 'Sign In' 버튼 클릭 시 (회원가입 -> 로그인 화면)
signInBtn.addEventListener('click', () => {
    // wrapper에서 'active' 클래스를 제거하여 원래 상태로 복귀
    wrapper.classList.remove('active');
});