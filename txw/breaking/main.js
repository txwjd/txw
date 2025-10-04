// game.js

const SVG_NS = "http://www.w3.org/2000/svg";
const gameBoard = document.getElementById('game-board');
const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const levelSpan = document.getElementById('level');

const overlay = document.getElementById('game-overlay');
const overlayText = document.getElementById('overlay-text');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');

const boardWidth = 800;
const boardHeight = 600;

gameBoard.setAttribute('width', boardWidth);
gameBoard.setAttribute('height', boardHeight);

// SVG 경로 정의
const BACKGROUND_SVG = './img/forest.svg';
const BRICK_SVGS = [
    './img/brick/brick-01.svg',
    './img/brick/brick-02.svg',
    './img/brick/brick-03.svg',
    './img/brick/brick-04.svg',
    './img/brick/brick-05.svg'
];
const ITEM_BRICK_SVG = './img/brick/item-brick.svg';
const BALL_SVG = './img/ball.svg';

let score = 0;
let lives = 3;
let currentLevel = 1;
const maxLevel = 5;

// 게임 상태 변수
let gameRunning = false;
let gamePaused = true; // 초기에는 정지 상태로 시작
let animationFrameId;

// 패들 설정 (이전과 동일)
const paddle = {
    width: 100,
    height: 15,
    x: boardWidth / 2 - 50,
    y: boardHeight - 30,
    speed: 10,
    dx: 0, 
    element: null
};

// 공 설정
const ball = {
    radius: 8, // SVG <image> 크기 계산을 위해 유지
    x: boardWidth / 2,
    y: boardHeight - 40,
    dx: 5,
    dy: -5,
    element: null,
    isStuck: true
};

// 벽돌 설정 (이전과 동일)
const brickConfig = {
    width: 70,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 30,
    totalBricks: 0
};
let bricks = []; 
let activeBricks = 0; 

// 레벨별 설정 (이전과 동일)
const levelSettings = {
    1: { totalBricks: 20, itemBrickRatio: 0.0, ballSpeed: 3 },
    2: { totalBricks: 30, itemBrickRatio: 0.0, ballSpeed: 4 },
    3: { totalBricks: 40, itemBrickRatio: 0.1, ballSpeed: 5 },
    4: { totalBricks: 50, itemBrickRatio: 0.15, ballSpeed: 6 },
    5: { totalBricks: 60, itemBrickRatio: 0.2, ballSpeed: 7 }
};

// --- SVG 유틸리티 ---

function createSVGElement(tag, attributes) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const key in attributes) {
        // SVG image 요소의 href 속성을 올바르게 설정
        if (tag === 'image' && key === 'href') {
             el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', attributes[key]);
        } else {
            el.setAttribute(key, attributes[key]);
        }
    }
    return el;
}

// --- 초기화 함수 ---

function initBackground() {
    // 1. 배경 이미지 추가
    const bgImage = createSVGElement('image', {
        href: BACKGROUND_SVG,
        x: 0,
        y: 0,
        width: boardWidth,
        height: boardHeight,
        preserveAspectRatio: 'xMidYMid slice' 
    });
    gameBoard.appendChild(bgImage);

    // 2. 반투명한 검은색 레이어(Overlay) 추가
    const overlayRect = createSVGElement('rect', {
        x: 0, 
        y: 0, 
        width: boardWidth, 
        height: boardHeight, 
        fill: '#000',
        opacity: 0.4
    });
    gameBoard.appendChild(overlayRect); 
}

function initPaddle() {
    // 패들은 SVG 이미지가 없으므로 rect로 유지
    paddle.element = createSVGElement('rect', {
        id: 'paddle',
        x: paddle.x,
        y: paddle.y,
        width: paddle.width,
        height: paddle.height,
        fill: 'lightblue'
    });
    gameBoard.appendChild(paddle.element);
}

function initBall() {
    const ballSize = ball.radius * 2; 
    
    // <image> 태그로 공 SVG 파일을 로드
    ball.element = createSVGElement('image', {
        id: 'ball',
        href: BALL_SVG, 
        x: ball.x - ball.radius, 
        y: ball.y - ball.radius,
        width: ballSize,
        height: ballSize
    });
    
    gameBoard.appendChild(ball.element);
}

function initBricks() {
    // 기존 벽돌 제거
    bricks.forEach(b => {
        if (b.element && b.element.parentNode) {
            b.element.parentNode.removeChild(b.element);
        }
    });
    bricks = []; 

    const currentLevelSettings = levelSettings[currentLevel];
    brickConfig.totalBricks = currentLevelSettings.totalBricks;
    activeBricks = brickConfig.totalBricks; 

    // 벽돌 위치 후보군 생성 및 섞는 로직 (생략 - 이전 코드 참고)
    const brickPositions = [];
    // ... (후보군 채우기 및 섞기)

    const availableWidth = boardWidth - (2 * brickConfig.offsetLeft);
    const maxCols = Math.floor(availableWidth / (brickConfig.width + brickConfig.padding));
    const maxRows = Math.floor((boardHeight / 2 - brickConfig.offsetTop) / (brickConfig.height + brickConfig.padding));

    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < maxCols; c++) {
             brickPositions.push({ 
                x: c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft, 
                y: r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop
            });
        }
    }
    for (let i = brickPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [brickPositions[i], brickPositions[j]] = [brickPositions[j], brickPositions[i]];
    }

    // 벽돌 배치
    for (let i = 0; i < brickConfig.totalBricks; i++) {
        if (i >= brickPositions.length) break; 

        const { x, y } = brickPositions[i];
        
        let svgPath;
        let type = 'normal';

        if (currentLevel >= 3 && Math.random() < currentLevelSettings.itemBrickRatio) {
            svgPath = ITEM_BRICK_SVG;
            type = 'item';
        } else {
            const index = i % BRICK_SVGS.length;
            svgPath = BRICK_SVGS[index];
        }
        
        const brickElement = createSVGElement('image', {
            href: svgPath,
            x: x,
            y: y,
            width: brickConfig.width,
            height: brickConfig.height,
        });
        
        gameBoard.appendChild(brickElement);

        bricks.push({ 
            x: x, 
            y: y, 
            status: 1, 
            element: brickElement,
            type: type 
        });
    }
}

// --- 게임 제어 함수 ---

function updateScoreAndLives() {
    scoreSpan.textContent = score;
    livesSpan.textContent = lives;
    levelSpan.textContent = currentLevel;
}

function resetBallAndPaddle() {
    const levelSpeed = levelSettings[currentLevel].ballSpeed;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = levelSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -levelSpeed;
    ball.isStuck = true;

    paddle.x = boardWidth / 2 - 50;
    paddle.dx = 0;

    // SVG 요소 위치 업데이트는 updateBall, updatePaddle에서 처리되도록 맡깁니다.
}

function resetGame() {
    resetBallAndPaddle();
    initBricks();
    updateScoreAndLives();
}

function showOverlay(text, buttonText, action) {
    overlayText.textContent = text;
    startButton.textContent = buttonText;
    startButton.onclick = action;
    overlay.classList.remove('hidden');
    gamePaused = true;
    pauseButton.textContent = '계속하기';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function startGame() {
    score = 0;
    lives = 3;
    currentLevel = 1;
    gameRunning = true;
    overlay.classList.add('hidden');
    gamePaused = false;
    pauseButton.textContent = '일시정지';
    
    // 게임 시작 시 초기화
    resetGame(); 
    gameLoop();
}

function togglePause() {
    if (gamePaused) {
        // 일시정지 해제
        gamePaused = false;
        pauseButton.textContent = '일시정지';
        overlay.classList.add('hidden');
        gameLoop();
    } else {
        // 일시정지
        gamePaused = true;
        pauseButton.textContent = '계속하기';
        showOverlay('일시정지', '계속하기', togglePause);
    }
}

function gameOver() {
    gameRunning = false;
    showOverlay(`GAME OVER! 최종 점수: ${score}`, '다시 시작', startGame);
}

function levelPassed() {
    showOverlay('단계 통과!', '다음 단계 로드 중...', () => {});

    if (currentLevel >= maxLevel) {
        gameRunning = false;
        showOverlay(`축하합니다! 최종 점수: ${score}`, '다시 시작', startGame);
        return;
    }

    // 5초 후 다음 단계로 넘어감
    setTimeout(() => {
        currentLevel++;
        overlay.classList.add('hidden');
        gamePaused = false;
        pauseButton.textContent = '일시정지';
        resetGame(); // 다음 레벨 설정으로 초기화
        gameLoop();
    }, 5000); 
}


// --- 게임 루프 및 업데이트 함수 (이전 코드에서 공 위치 업데이트 로직 수정 반영) ---

function updatePaddle() {
    if (gamePaused) return;

    paddle.x += paddle.dx;

    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > boardWidth) {
        paddle.x = boardWidth - paddle.width;
    }
    paddle.element.setAttribute('x', paddle.x);
}

function updateBall() {
    if (gamePaused) return;

    if (ball.isStuck) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius;
    } else {
        ball.x += ball.dx;
        ball.y += ball.dy;
    }
    
    // <image> 요소의 x, y 속성 업데이트
    ball.element.setAttribute('x', ball.x - ball.radius);
    ball.element.setAttribute('y', ball.y - ball.radius);
}

function collisionDetection() {
    if (gamePaused) return;
    
    // 1. 벽과 공 충돌 (이전과 동일)
    if (ball.x + ball.radius > boardWidth || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    // 바닥에 닿으면 목숨 감소
    if (ball.y + ball.radius > boardHeight) {
        lives--;
        updateScoreAndLives();
        if (lives <= 0) {
            gameOver();
        } else {
            resetBallAndPaddle(); // 공만 초기화하고 다시 붙임
        }
        return; 
    }

    // 2. 패들과 공 충돌 (이전과 동일)
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + paddle.width) {
        
        if (ball.dy > 0) { 
            ball.dy *= -1;
            const collidePoint = ball.x - (paddle.x + paddle.width / 2);
            ball.dx = collidePoint * 0.3;
        }
    }

    // 3. 벽돌과 공 충돌 (이전과 동일)
    bricks.forEach(b => {
        if (b.status === 1) { 
            if (ball.x + ball.radius > b.x &&
                ball.x - ball.radius < b.x + brickConfig.width &&
                ball.y + ball.radius > b.y &&
                ball.y - ball.radius < b.y + brickConfig.height) {
                
                b.status = 0;
                b.element.style.visibility = 'hidden'; 
                score += 10;
                activeBricks--;
                updateScoreAndLives();

                if (b.type === 'item') {
                    console.log('아이템 획득! (효과 구현 필요)');
                }

                ball.dy *= -1; // 임시 반사 로직
            }
        }
    });

    // 모든 벽돌 파괴 시 다음 레벨
    if (activeBricks === 0) {
        levelPassed();
    }
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;

    updatePaddle();
    updateBall();
    collisionDetection();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- 이벤트 리스너 ---

// 게임 시작 버튼
startButton.addEventListener('click', startGame);

// 일시정지 버튼
pauseButton.addEventListener('click', togglePause);

// 키보드 입력 (PC)
document.addEventListener('keydown', e => {
    if (gamePaused && e.key !== ' ') return; // 정지 중에는 스페이스바 외 작동 X
    if (e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    } else if (e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === ' ' && ball.isStuck && !gamePaused) { // 스페이스바로 공 발사
        ball.isStuck = false;
    }
});

document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        paddle.dx = 0;
    }
});

// 모바일 터치 입력 (이전과 동일)
let touchStartX = 0;
let paddleStartPosX = 0;

gameBoard.addEventListener('touchstart', e => {
    if (gamePaused) return;
    e.preventDefault(); 
    if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        paddleStartPosX = paddle.x;
        if (ball.isStuck) { 
            ball.isStuck = false;
        }
    }
}, { passive: false });

gameBoard.addEventListener('touchmove', e => {
    if (gamePaused) return;
    e.preventDefault();
    if (e.touches.length > 0) {
        const touchCurrentX = e.touches[0].clientX;
        const deltaX = touchCurrentX - touchStartX;
        paddle.x = paddleStartPosX + deltaX;
        
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > boardWidth) paddle.x = boardWidth - paddle.width;
        paddle.element.setAttribute('x', paddle.x);
    }
}, { passive: false });

// --- 초기 실행 ---
initBackground();
initPaddle();
initBall();
updateScoreAndLives(); // 초기 점수판 업데이트

// 게임 시작은 startButton 클릭으로 시작됩니다.
showOverlay('벽돌깨기', '게임 시작', startGame);