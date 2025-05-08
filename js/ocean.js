/**
 * 해양 환경 클래스
 * 물, 하늘, 날씨 효과를 처리합니다.
 */
class Ocean {
    constructor(options = {}) {
        // 기본 옵션 설정
        this.options = Object.assign({
            scene: null,
            renderer: null,
            size: 10000, // 해양 크기
            segments: 128, // 세그먼트 수
            waterColor: 0x001e0f, // 물 색상
            waterDistortionScale: 3.7, // 물 왜곡 스케일
            waterSunColor: 0xffffff, // 물 위의 태양 반사 색상
            sunPosition: new THREE.Vector3(100, 100, 100), // 태양 위치
            skyExposure: 0.5, // 하늘 노출
            skyRayleigh: 2, // 하늘 레일리 산란
            skyTurbidity: 10, // 하늘 탁도
            skyMieCoefficient: 0.005, // 하늘 미 계수
            skyMieDirectionalG: 0.8, // 하늘 미 방향성
            fogEnabled: true, // 안개 활성화
            fogColor: 0x5d8fbd, // 안개 색상
            fogNear: 1, // 안개 시작 거리
            fogFar: 2000, // 안개 끝 거리
            windDirection: 0, // 바람 방향 (도)
            windSpeed: 5, // 바람 속도 (노트)
            timeOfDay: 0.5, // 하루 중 시간 (0-1, 0: 자정, 0.5: 정오)
        }, options);
        
        // 필수 옵션 확인
        if (!this.options.scene || !this.options.renderer) {
            throw new Error('Ocean requires scene and renderer');
        }
        
        // 속성 초기화
        this.scene = this.options.scene;
        this.renderer = this.options.renderer;
        this.windDirection = this.options.windDirection;
        this.windSpeed = this.options.windSpeed;
        this.timeOfDay = this.options.timeOfDay;
        
        // 바람 변화 타이머
        this.windChangeTimer = 0;
        this.targetWindDirection = this.windDirection;
        this.targetWindSpeed = this.windSpeed;
        
        // 환경 생성
        this.createWater();
        this.createSky();
        this.setupFog();
        this.createLighting();
    }
    
    // 물 생성
    createWater() {
        // 물 지오메트리
        const waterGeometry = new THREE.PlaneGeometry(
            this.options.size,
            this.options.size,
            this.options.segments,
            this.options.segments
        );
        
        // 물 텍스처
        this.water = new THREE.Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 1.0,
            sunDirection: this.options.sunPosition.clone().normalize(),
            sunColor: this.options.waterSunColor,
            waterColor: this.options.waterColor,
            distortionScale: this.options.waterDistortionScale,
            fog: this.options.fogEnabled
        });
        
        // 물 회전 및 위치 설정
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = 0;
        
        // 씬에 추가
        this.scene.add(this.water);
    }
    
    // 하늘 생성
    createSky() {
        // 하늘 지오메트리
        this.sky = new THREE.Sky();
        this.sky.scale.setScalar(10000);
        
        // 하늘 속성 설정
        const skyUniforms = this.sky.material.uniforms;
        skyUniforms['turbidity'].value = this.options.skyTurbidity;
        skyUniforms['rayleigh'].value = this.options.skyRayleigh;
        skyUniforms['mieCoefficient'].value = this.options.skyMieCoefficient;
        skyUniforms['mieDirectionalG'].value = this.options.skyMieDirectionalG;
        
        // 태양 위치 계산
        const sunPosition = this.calculateSunPosition();
        skyUniforms['sunPosition'].value.copy(sunPosition);
        
        // 씬에 추가
        this.scene.add(this.sky);
    }
    
    // 안개 설정
    setupFog() {
        if (this.options.fogEnabled) {
            this.scene.fog = new THREE.Fog(
                this.options.fogColor,
                this.options.fogNear,
                this.options.fogFar
            );
            this.scene.background = new THREE.Color(this.options.fogColor);
        }
    }
    
    // 조명 생성
    createLighting() {
        // 주변광
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
        
        // 태양 위치 계산
        const sunPosition = this.calculateSunPosition();
        
        // 방향성 조명 (태양)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.copy(sunPosition);
        this.sunLight.castShadow = true;
        
        // 그림자 설정
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.sunLight);
    }
    
    // 태양 위치 계산
    calculateSunPosition() {
        // 시간에 따른 태양 위치 계산 (0: 자정, 0.5: 정오)
        const phi = Math.PI * (this.timeOfDay * 2 - 0.5);
        const theta = Math.PI * 2 * 0.25; // 동쪽에서 시작
        
        const sunPosition = new THREE.Vector3();
        sunPosition.x = 1000 * Math.cos(phi) * Math.cos(theta);
        sunPosition.y = 1000 * Math.sin(phi);
        sunPosition.z = 1000 * Math.cos(phi) * Math.sin(theta);
        
        return sunPosition;
    }
    
    // 바람 방향 가져오기
    getWindDirection() {
        return this.windDirection;
    }
    
    // 바람 속도 가져오기
    getWindSpeed() {
        return this.windSpeed;
    }
    
    // 바람 정보 업데이트
    updateWindInfo() {
        // 바람 정보 UI 업데이트
        const windElement = document.getElementById('wind');
        if (windElement) {
            windElement.textContent = this.windSpeed.toFixed(1);
        }
    }
    
    // 바람 변화 시뮬레이션
    simulateWindChanges(deltaTime) {
        // 바람 변화 타이머 업데이트
        this.windChangeTimer -= deltaTime;
        
        // 새로운 바람 목표 설정
        if (this.windChangeTimer <= 0) {
            // 5-30초마다 바람 변화
            this.windChangeTimer = randomFloat(5, 30);
            
            // 새로운 목표 바람 방향 (현재 방향에서 최대 ±45도)
            this.targetWindDirection = (this.windDirection + randomFloat(-45, 45) + 360) % 360;
            
            // 새로운 목표 바람 속도 (0-15 노트)
            this.targetWindSpeed = clamp(this.windSpeed + randomFloat(-2, 2), 0, 15);
        }
        
        // 현재 바람을 목표 바람으로 부드럽게 변화
        this.windDirection = lerp(this.windDirection, this.targetWindDirection, 0.01);
        this.windSpeed = lerp(this.windSpeed, this.targetWindSpeed, 0.01);
        
        // 바람 정보 업데이트
        this.updateWindInfo();
    }
    
    // 시간 업데이트
    updateTimeOfDay(deltaTime) {
        // 시간 업데이트 (1분에 1일 주기)
        this.timeOfDay = (this.timeOfDay + deltaTime / 60) % 1;
        
        // 태양 위치 업데이트
        const sunPosition = this.calculateSunPosition();
        
        // 하늘 업데이트
        const skyUniforms = this.sky.material.uniforms;
        skyUniforms['sunPosition'].value.copy(sunPosition);
        
        // 태양 조명 업데이트
        this.sunLight.position.copy(sunPosition);
        
        // 물 업데이트
        this.water.material.uniforms['sunDirection'].value.copy(sunPosition.clone().normalize());
        
        // 밤/낮에 따른 조명 강도 조정
        const dayNightCycle = Math.sin(Math.PI * this.timeOfDay * 2 - Math.PI / 2) * 0.5 + 0.5;
        this.sunLight.intensity = Math.max(0.1, dayNightCycle);
        this.ambientLight.intensity = Math.max(0.1, dayNightCycle * 0.5);
        
        // 안개 색상 조정
        if (this.options.fogEnabled) {
            // 낮: 밝은 푸른색, 밤: 어두운 푸른색
            const fogColor = new THREE.Color().setHSL(0.6, 0.5, Math.max(0.1, dayNightCycle * 0.5));
            this.scene.fog.color.copy(fogColor);
            this.scene.background.copy(fogColor);
        }
    }
    
    // 업데이트 메서드
    update(deltaTime) {
        // 물 애니메이션 업데이트
        this.water.material.uniforms['time'].value += deltaTime;
        
        // 바람 변화 시뮬레이션
        this.simulateWindChanges(deltaTime);
        
        // 시간 업데이트
        this.updateTimeOfDay(deltaTime);
    }
}
