/**
 * 메인 게임 클래스
 * 씬 설정, 게임 루프, 게임 메커니즘을 처리합니다.
 */
class Game {
    constructor(options = {}) {
        // 기본 옵션 설정
        this.options = Object.assign({
            containerId: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            fov: 60,
            near: 0.1,
            far: 20000,
            onProgress: null,
            onLoad: null
        }, options);
        
        // 게임 상태
        this.isRunning = false;
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        
        // 로딩 관리자
        this.loadingManager = new LoadingManager(
            this.options.onLoad || (() => {}),
            this.options.onProgress || (() => {})
        );
        
        // 씬 초기화
        this.initScene();
        
        // 카메라 초기화
        this.initCamera();
        
        // 렌더러 초기화
        this.initRenderer();
        
        // 컨트롤 초기화
        this.initControls();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 게임 요소 초기화
        this.initGameElements();
    }
    
    // 씬 초기화
    initScene() {
        this.scene = new THREE.Scene();
    }
    
    // 카메라 초기화
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            this.options.fov,
            this.options.width / this.options.height,
            this.options.near,
            this.options.far
        );
        
        // 초기 카메라 위치 설정
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    // 렌더러 초기화
    initRenderer() {
        // 컨테이너 요소 가져오기
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${this.options.containerId}' not found`);
        }
        
        // 렌더러 생성
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.shadowMap.enabled = true;
        
        // 컨테이너에 렌더러 추가
        this.container.appendChild(this.renderer.domElement);
    }
    
    // 컨트롤 초기화
    initControls() {
        // 오비트 컨트롤 생성
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
        this.controls.update();
        
        // 카메라 모드 (1: 3인칭, 2: 1인칭, 3: 탑다운, 4: 자유)
        this.cameraMode = 1;
        
        // 카메라 모드 전환 이벤트 리스너
        document.addEventListener('keydown', (event) => {
            if (event.key >= '1' && event.key <= '4') {
                this.cameraMode = parseInt(event.key);
                this.updateCameraPosition();
            }
        });
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    // 게임 요소 초기화
    initGameElements() {
        // 로딩 항목 추가
        this.loadingManager.addItem(); // 해양
        this.loadingManager.addItem(); // 선박
        
        // 해양 환경 생성
        this.ocean = new Ocean({
            scene: this.scene,
            renderer: this.renderer
        });
        
        // 로딩 항목 완료
        this.loadingManager.itemLoaded();
        
        // 선박 생성
        this.ship = new Ship({
            scene: this.scene,
            initialPosition: new THREE.Vector3(0, 0, 0)
        });
        
        // 로딩 항목 완료
        this.loadingManager.itemLoaded();
        
        // 섬 생성
        this.createIslands();
        
        // 목표물 생성
        this.createTargets();
    }
    
    // 섬 생성
    createIslands() {
        // 섬 배열
        this.islands = [];
        
        // 섬 수
        const islandCount = 5;
        
        // 섬 생성
        for (let i = 0; i < islandCount; i++) {
            // 섬 위치 (중앙에서 떨어진 위치)
            const distance = randomFloat(100, 500);
            const angle = randomFloat(0, Math.PI * 2);
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // 섬 크기
            const size = randomFloat(20, 50);
            
            // 섬 생성
            this.createIsland(x, z, size);
        }
    }
    
    // 단일 섬 생성
    createIsland(x, z, size) {
        // 섬 그룹
        const islandGroup = new THREE.Group();
        islandGroup.position.set(x, 0, z);
        
        // 섬 지형 생성
        const islandGeometry = new THREE.ConeGeometry(size, size * 0.5, 8);
        const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.y = -size * 0.25;
        island.castShadow = true;
        island.receiveShadow = true;
        islandGroup.add(island);
        
        // 모래 생성
        const sandGeometry = new THREE.CylinderGeometry(size * 1.2, size * 1.5, size * 0.1, 16);
        const sandMaterial = new THREE.MeshPhongMaterial({ color: 0xD2B48C });
        const sand = new THREE.Mesh(sandGeometry, sandMaterial);
        sand.position.y = 0.05;
        sand.receiveShadow = true;
        islandGroup.add(sand);
        
        // 나무 생성 (랜덤 위치)
        const treeCount = Math.floor(randomFloat(3, 8));
        for (let i = 0; i < treeCount; i++) {
            const treeDistance = randomFloat(0, size * 0.7);
            const treeAngle = randomFloat(0, Math.PI * 2);
            const treeX = Math.cos(treeAngle) * treeDistance;
            const treeZ = Math.sin(treeAngle) * treeDistance;
            const treeHeight = randomFloat(5, 10);
            
            this.createTree(treeX, treeZ, treeHeight, islandGroup);
        }
        
        // 씬에 추가
        this.scene.add(islandGroup);
        
        // 섬 배열에 추가
        this.islands.push({
            position: new THREE.Vector3(x, 0, z),
            size: size,
            mesh: islandGroup
        });
    }
    
    // 나무 생성
    createTree(x, z, height, parent) {
        // 나무 그룹
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);
        
        // 나무 줄기
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, height, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // 나뭇잎
        const leavesGeometry = new THREE.ConeGeometry(height / 3, height / 2, 8);
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = height * 0.75;
        leaves.castShadow = true;
        treeGroup.add(leaves);
        
        // 부모에 추가
        parent.add(treeGroup);
    }
    
    // 목표물 생성
    createTargets() {
        // 목표물 배열
        this.targets = [];
        
        // 목표물 수
        const targetCount = 10;
        
        // 목표물 생성
        for (let i = 0; i < targetCount; i++) {
            // 목표물 위치 (중앙에서 떨어진 위치)
            const distance = randomFloat(50, 400);
            const angle = randomFloat(0, Math.PI * 2);
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // 목표물 생성
            this.createTarget(x, z);
        }
    }
    
    // 단일 목표물 생성
    createTarget(x, z) {
        // 목표물 그룹
        const targetGroup = new THREE.Group();
        targetGroup.position.set(x, 0, z);
        
        // 부표 생성
        const buoyGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
        const buoyMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
        const buoy = new THREE.Mesh(buoyGeometry, buoyMaterial);
        buoy.position.y = 1;
        buoy.castShadow = true;
        targetGroup.add(buoy);
        
        // 깃발 생성
        const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const flagPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.set(0, 2.5, 0);
        targetGroup.add(flagPole);
        
        const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
        const flagMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.75, 3, 0);
        flag.rotation.y = Math.PI / 2;
        targetGroup.add(flag);
        
        // 씬에 추가
        this.scene.add(targetGroup);
        
        // 목표물 배열에 추가
        this.targets.push({
            position: new THREE.Vector3(x, 0, z),
            mesh: targetGroup,
            collected: false
        });
    }
    
    // 카메라 위치 업데이트
    updateCameraPosition() {
        const shipPosition = this.ship.getPosition();
        const shipDirection = this.ship.getDirection();
        const directionRad = degToRad(shipDirection);
        
        switch (this.cameraMode) {
            case 1: // 3인칭 모드
                // 선박 뒤에서 약간 위에 위치
                const cameraOffsetX = -Math.sin(directionRad) * 15;
                const cameraOffsetZ = -Math.cos(directionRad) * 15;
                
                this.camera.position.x = shipPosition.x + cameraOffsetX;
                this.camera.position.y = shipPosition.y + 10;
                this.camera.position.z = shipPosition.z + cameraOffsetZ;
                this.camera.lookAt(shipPosition);
                
                // 오비트 컨트롤 비활성화
                this.controls.enabled = false;
                break;
                
            case 2: // 1인칭 모드
                // 선박 위에서 앞을 바라봄
                const lookOffsetX = Math.sin(directionRad) * 10;
                const lookOffsetZ = Math.cos(directionRad) * 10;
                
                this.camera.position.x = shipPosition.x;
                this.camera.position.y = shipPosition.y + 3;
                this.camera.position.z = shipPosition.z;
                this.camera.lookAt(
                    shipPosition.x + lookOffsetX,
                    shipPosition.y + 2,
                    shipPosition.z + lookOffsetZ
                );
                
                // 오비트 컨트롤 비활성화
                this.controls.enabled = false;
                break;
                
            case 3: // 탑다운 모드
                this.camera.position.x = shipPosition.x;
                this.camera.position.y = shipPosition.y + 30;
                this.camera.position.z = shipPosition.z;
                this.camera.lookAt(shipPosition);
                
                // 오비트 컨트롤 비활성화
                this.controls.enabled = false;
                break;
                
            case 4: // 자유 모드
                // 오비트 컨트롤 활성화
                this.controls.enabled = true;
                this.controls.target.copy(shipPosition);
                this.controls.update();
                break;
        }
    }
    
    // 충돌 감지
    detectCollisions() {
        const shipPosition = this.ship.getPosition();
        
        // 섬과의 충돌 감지
        for (const island of this.islands) {
            const distance = distance3D(shipPosition, island.position);
            
            // 섬 반경 내에 있으면 충돌
            if (distance < island.size * 0.8) {
                // 충돌 처리 (선박 속도 감소)
                this.ship.speed *= 0.9;
                
                // 충돌 방향 계산
                const directionX = shipPosition.x - island.position.x;
                const directionZ = shipPosition.z - island.position.z;
                const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
                
                // 선박을 섬에서 약간 밀어냄
                if (length > 0) {
                    shipPosition.x += (directionX / length) * 0.5;
                    shipPosition.z += (directionZ / length) * 0.5;
                }
            }
        }
        
        // 목표물과의 충돌 감지
        for (const target of this.targets) {
            if (!target.collected) {
                const distance = distance3D(shipPosition, target.position);
                
                // 목표물 반경 내에 있으면 수집
                if (distance < 5) {
                    // 목표물 수집 처리
                    target.collected = true;
                    target.mesh.visible = false;
                    
                    // 수집 효과 (간단한 파티클 효과)
                    this.createCollectionEffect(target.position);
                }
            }
        }
    }
    
    // 수집 효과 생성
    createCollectionEffect(position) {
        // 파티클 그룹
        const particleGroup = new THREE.Group();
        particleGroup.position.copy(position);
        
        // 파티클 수
        const particleCount = 20;
        
        // 파티클 생성
        for (let i = 0; i < particleCount; i++) {
            // 파티클 지오메트리
            const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // 랜덤 위치
            particle.position.set(
                randomFloat(-1, 1),
                randomFloat(0, 2),
                randomFloat(-1, 1)
            );
            
            // 랜덤 속도
            particle.userData.velocity = new THREE.Vector3(
                randomFloat(-2, 2),
                randomFloat(2, 5),
                randomFloat(-2, 2)
            );
            
            // 파티클 그룹에 추가
            particleGroup.add(particle);
        }
        
        // 씬에 추가
        this.scene.add(particleGroup);
        
        // 파티클 애니메이션 및 제거 타이머
        const startTime = Date.now();
        const duration = 1000; // 1초
        
        const animateParticles = () => {
            const elapsedTime = Date.now() - startTime;
            const t = elapsedTime / duration;
            
            // 파티클 업데이트
            particleGroup.children.forEach(particle => {
                // 위치 업데이트
                particle.position.x += particle.userData.velocity.x * 0.01;
                particle.position.y += particle.userData.velocity.y * 0.01;
                particle.position.z += particle.userData.velocity.z * 0.01;
                
                // 크기 감소
                particle.scale.multiplyScalar(0.98);
            });
            
            // 애니메이션 종료 조건
            if (t < 1) {
                requestAnimationFrame(animateParticles);
            } else {
                // 파티클 그룹 제거
                this.scene.remove(particleGroup);
            }
        };
        
        // 애니메이션 시작
        animateParticles();
    }
    
    // 게임 시작
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.clock.start();
            this.animate();
        }
    }
    
    // 게임 정지
    stop() {
        this.isRunning = false;
        this.clock.stop();
    }
    
    // 애니메이션 루프
    animate() {
        if (!this.isRunning) return;
        
        // 다음 프레임 요청
        requestAnimationFrame(() => this.animate());
        
        // 델타 타임 계산
        this.deltaTime = this.clock.getDelta();
        this.elapsedTime = this.clock.getElapsedTime();
        
        // 선박 업데이트
        this.ship.update(
            this.deltaTime,
            this.ocean.getWindDirection(),
            this.ocean.getWindSpeed()
        );
        
        // 해양 업데이트
        this.ocean.update(this.deltaTime);
        
        // 카메라 위치 업데이트
        this.updateCameraPosition();
        
        // 충돌 감지
        this.detectCollisions();
        
        // 목표물 애니메이션
        this.animateTargets();
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }
    
    // 목표물 애니메이션
    animateTargets() {
        // 수집되지 않은 목표물만 애니메이션
        this.targets.forEach(target => {
            if (!target.collected) {
                // 파도에 따른 상하 움직임
                target.mesh.position.y = Math.sin(this.elapsedTime * 2 + target.position.x * 0.1 + target.position.z * 0.1) * 0.5;
                
                // 깃발 흔들림
                if (target.mesh.children.length > 2) {
                    const flag = target.mesh.children[2];
                    flag.rotation.z = Math.sin(this.elapsedTime * 3) * 0.2;
                }
            }
        });
    }
    
    // 리사이즈 처리
    resize() {
        // 새 크기 계산
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 카메라 업데이트
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // 렌더러 업데이트
        this.renderer.setSize(width, height);
    }
}
