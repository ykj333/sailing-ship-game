/**
 * 유틸리티 함수 모음
 */

// 각도를 라디안으로 변환
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// 라디안을 각도로 변환
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// 두 값 사이의 선형 보간
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// 값을 특정 범위로 제한
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 랜덤 정수 생성 (min 이상, max 미만)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// 랜덤 부동 소수점 생성 (min 이상, max 이하)
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 방향 문자열 반환 (북, 북동, 동, 남동, 남, 남서, 서, 북서)
function getDirectionString(angle) {
    // 각도를 0-360 범위로 정규화
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // 방향 배열 (시계 방향으로 북쪽부터 시작)
    const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    
    // 각도를 8방향으로 매핑 (각 방향은 45도 범위)
    const index = Math.round(normalizedAngle / 45) % 8;
    
    return directions[index];
}

// 바람 속도에 따른 보퍼트 풍력 계급 반환
function getBeaufortScale(windSpeed) {
    const beaufortScale = [
        { force: 0, description: '고요함', maxSpeed: 0.5 },
        { force: 1, description: '실바람', maxSpeed: 1.5 },
        { force: 2, description: '남실바람', maxSpeed: 3.3 },
        { force: 3, description: '산들바람', maxSpeed: 5.5 },
        { force: 4, description: '건들바람', maxSpeed: 7.9 },
        { force: 5, description: '흔들바람', maxSpeed: 10.7 },
        { force: 6, description: '된바람', maxSpeed: 13.8 },
        { force: 7, description: '센바람', maxSpeed: 17.1 },
        { force: 8, description: '큰바람', maxSpeed: 20.7 },
        { force: 9, description: '큰센바람', maxSpeed: 24.4 },
        { force: 10, description: '노대바람', maxSpeed: 28.4 },
        { force: 11, description: '왕바람', maxSpeed: 32.6 },
        { force: 12, description: '싹쓸바람', maxSpeed: Infinity }
    ];
    
    for (let i = 0; i < beaufortScale.length; i++) {
        if (windSpeed <= beaufortScale[i].maxSpeed) {
            return beaufortScale[i];
        }
    }
    
    return beaufortScale[beaufortScale.length - 1];
}

// 노트를 km/h로 변환
function knotsToKmh(knots) {
    return knots * 1.852;
}

// km/h를 노트로 변환
function kmhToKnots(kmh) {
    return kmh / 1.852;
}

// 두 3D 위치 사이의 거리 계산
function distance3D(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 로딩 관리자 클래스
class LoadingManager {
    constructor(onLoad, onProgress) {
        this.totalItems = 0;
        this.loadedItems = 0;
        this.onLoad = onLoad || (() => {});
        this.onProgress = onProgress || (() => {});
    }
    
    addItem() {
        this.totalItems++;
        return this;
    }
    
    itemLoaded() {
        this.loadedItems++;
        const progress = this.totalItems > 0 ? this.loadedItems / this.totalItems : 0;
        this.onProgress(progress);
        
        if (this.loadedItems === this.totalItems) {
            this.onLoad();
        }
        
        return this;
    }
    
    reset() {
        this.totalItems = 0;
        this.loadedItems = 0;
        return this;
    }
}
