// 메인 게임 초기화 및 실행
document.addEventListener('DOMContentLoaded', function() {
    // 로딩 화면 생성
    function createLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        
        const loadingText = document.createElement('div');
        loadingText.id = 'loading-text';
        loadingText.textContent = '게임 로딩 중...';
        
        const loadingBarContainer = document.createElement('div');
        loadingBarContainer.className = 'loading-bar-container';
        
        const loadingBar = document.createElement('div');
        loadingBar.className = 'loading-bar';
        
        loadingBarContainer.appendChild(loadingBar);
        loadingScreen.appendChild(loadingText);
        loadingScreen.appendChild(loadingBarContainer);
        document.body.appendChild(loadingScreen);
        
        return {
            screen: loadingScreen,
            bar: loadingBar
        };
    }
    
    // 로딩 화면 제거
    function removeLoadingScreen(loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(function() {
            if (document.body.contains(loadingScreen)) {
                document.body.removeChild(loadingScreen);
            }
        }, 500);
    }
    
    // 로딩 화면 생성
    const loading = createLoadingScreen();
    
    // 게임 인스턴스 생성
    let gameInstance = null;
    
    // 디버깅을 위한 콘솔 로그
    console.log('게임 초기화 시작');
    
    // 필요한 Three.js 객체 확인
    console.log('THREE 객체 확인:', typeof THREE !== 'undefined');
    console.log('OrbitControls 확인:', typeof THREE.OrbitControls !== 'undefined');
    console.log('Water 확인:', typeof THREE.Water !== 'undefined');
    console.log('Sky 확인:', typeof THREE.Sky !== 'undefined');
    
    try {
        console.log('Game 클래스 확인:', typeof Game !== 'undefined');
        
        // 게임 인스턴스 생성
        gameInstance = new Game({
            containerId: 'game-container',
            onProgress: function(progress) {
                loading.bar.style.width = `${progress * 100}%`;
            },
            onLoad: function() {
                console.log('게임 로딩 완료');
                
                // 로딩 완료 후 로딩 화면 제거
                setTimeout(function() {
                    removeLoadingScreen(loading.screen);
                    
                    // 로딩 화면이 제거된 후 게임 시작
                    if (gameInstance) {
                        gameInstance.start();
                        console.log('게임 시작됨');
                    }
                }, 500);
                
                // 윈도우 리사이즈 이벤트 처리
                window.addEventListener('resize', function() {
                    if (gameInstance) {
                        gameInstance.resize();
                    }
                });
            }
        });
    } catch (error) {
        console.error('게임 초기화 중 오류 발생:', error);
        console.error('오류 세부 정보:', error.stack);
        
        // 오류 메시지 표시
        loading.bar.style.width = '100%';
        loading.bar.style.backgroundColor = '#ff0000';
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = '게임 로딩 실패: ' + error.message;
        }
    }
});
