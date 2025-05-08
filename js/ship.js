/**
 * 선박 클래스
 * 선박 모델, 물리, 제어를 처리합니다.
 */
class Ship {
    constructor(options = {}) {
        // 기본 옵션 설정
        this.options = Object.assign({
            scene: null,
            initialPosition: new THREE.Vector3(0, 0, 0),
            initialRotation: new THREE.Euler(0, 0, 0),
            scale: 1.0,
            maxSpeed: 10, // 최대 속도 (노트)
            acceleration: 0.05, // 가속도
            rotationSpeed: 0.02, // 회전 속도
            dragCoefficient: 0.98, // 항력 계수
            sailDeployed: false, // 돛 상태
        }, options);
        
        // 필수 옵션 확인
        if (!this.options.scene) {
            throw new Error('Ship requires a scene');
        }
        
        // 속성 초기화
        this.scene = this.options.scene;
        this.position = this.options.initialPosition.clone();
        this.rotation = this.options.initialRotation.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0; // 현재 속도 (노트)
        this.direction = 0; // 현재 방향 (도)
        this.sailDeployed = this.options.sailDeployed;
        
        // 선박 모델 생성
        this.createShipModel();
        
        // 키 입력 상태
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sail: false
        };
        
        // 키보드 이벤트 리스너 설정
        this.setupKeyboardControls();
    }
    
    // 선박 모델 생성
    createShipModel() {
        // 선체 그룹 생성
        this.shipGroup = new THREE.Group();
        this.shipGroup.position.copy(this.position);
        this.shipGroup.rotation.copy(this.rotation);
        this.shipGroup.scale.set(this.options.scale, this.options.scale, this.options.scale);
        
        // 선체 생성
        const hullGeometry = new THREE.BoxGeometry(2, 0.5, 5);
        const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
        this.hull.position.y = 0.25;
        this.shipGroup.add(this.hull);
        
        // 갑판 생성
        const deckGeometry = new THREE.BoxGeometry(1.8, 0.1, 4.8);
        const deckMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
        this.deck = new THREE.Mesh(deckGeometry, deckMaterial);
        this.deck.position.y = 0.55;
        this.shipGroup.add(this.deck);
        
        // 돛대 생성
        const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        this.mast = new THREE.Mesh(mastGeometry, mastMaterial);
        this.mast.position.set(0, 2, 0);
        this.shipGroup.add(this.mast);
        
        // 돛 생성
        const sailGeometry = new THREE.PlaneGeometry(1.5, 2);
        const sailMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.sail = new THREE.Mesh(sailGeometry, sailMaterial);
        this.sail.position.set(0, 1.5, 0);
        this.sail.rotation.y = Math.PI / 2;
        this.sail.visible = this.sailDeployed;
        this.shipGroup.add(this.sail);
        
        // 선수상 생성
        const figurheadGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const figurheadMaterial = new THREE.MeshPhongMaterial({ color: 0xDAA520 });
        this.figurhead = new THREE.Mesh(figurheadGeometry, figurheadMaterial);
        this.figurhead.position.set(0, 0.5, -2.5);
        this.figurhead.rotation.x = Math.PI / 2;
        this.shipGroup.add(this.figurhead);
        
        // 키 생성
        const rudderGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.8);
        const rudderMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        this.rudder = new THREE.Mesh(rudderGeometry, rudderMaterial);
        this.rudder.position.set(0, 0.25, 2.5);
        this.shipGroup.add(this.rudder);
        
        // 그림자 설정
        this.shipGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        
        // 씬에 추가
        this.scene.add(this.shipGroup);
    }
    
    // 키보드 컨트롤 설정
    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
                case ' ':
                    // 스페이스바를 누를 때 돛 상태 토글
                    this.keys.sail = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
                case ' ':
                    if (this.keys.sail) {
                        this.toggleSail();
                        this.keys.sail = false;
                    }
                    break;
            }
        });
    }
    
    // 돛 상태 토글
    toggleSail() {
        this.sailDeployed = !this.sailDeployed;
        this.sail.visible = this.sailDeployed;
        
        // 돛 애니메이션 효과
        if (this.sailDeployed) {
            // 돛을 펼칠 때 애니메이션
            this.sail.scale.set(0.1, 1, 1);
            const expandSail = () => {
                if (this.sail.scale.x < 1) {
                    this.sail.scale.x += 0.1;
                    requestAnimationFrame(expandSail);
                }
            };
            expandSail();
        } else {
            // 돛을 접을 때 애니메이션
            const foldSail = () => {
                if (this.sail.scale.x > 0.1) {
                    this.sail.scale.x -= 0.1;
                    requestAnimationFrame(foldSail);
                }
            };
            foldSail();
        }
    }
    
    // 바람 영향 계산
    calculateWindEffect(windDirection, windSpeed) {
        if (!this.sailDeployed) return 0;
        
        // 선박 방향과 바람 방향의 각도 차이 계산
        const angleDiff = Math.abs(((this.direction - windDirection) % 360 + 360) % 360);
        
        // 바람이 뒤에서 불 때 가장 효과적, 옆에서 불 때 중간, 앞에서 불 때 최소 효과
        let windEffect = 0;
        
        if (angleDiff <= 45 || angleDiff >= 315) {
            // 바람이 뒤에서 불 때 (최대 효과)
            windEffect = windSpeed * 0.8;
        } else if (angleDiff <= 135 || angleDiff >= 225) {
            // 바람이 옆에서 불 때 (중간 효과)
            windEffect = windSpeed * 0.4;
        } else {
            // 바람이 앞에서 불 때 (최소 효과)
            windEffect = windSpeed * 0.1;
        }
        
        return windEffect;
    }
    
    // 업데이트 메서드
    update(deltaTime, windDirection, windSpeed) {
        // 키 입력에 따른 속도 및 방향 변경
        if (this.keys.forward) {
            this.speed += this.options.acceleration;
        } else if (this.keys.backward) {
            this.speed -= this.options.acceleration;
        }
        
        // 바람 효과 적용
        const windEffect = this.calculateWindEffect(windDirection, windSpeed);
        this.speed += windEffect * deltaTime;
        
        // 속도 제한
        this.speed = clamp(this.speed, -this.options.maxSpeed / 2, this.options.maxSpeed);
        
        // 항력 적용 (물의 저항)
        this.speed *= this.options.dragCoefficient;
        
        // 속도가 매우 작으면 0으로 설정
        if (Math.abs(this.speed) < 0.01) {
            this.speed = 0;
        }
        
        // 방향 변경 (속도에 비례하여 회전 속도 조정)
        if (this.keys.left) {
            this.direction += this.options.rotationSpeed * Math.max(0.5, Math.abs(this.speed)) * 100 * deltaTime;
        } else if (this.keys.right) {
            this.direction -= this.options.rotationSpeed * Math.max(0.5, Math.abs(this.speed)) * 100 * deltaTime;
        }
        
        // 방향 정규화 (0-360도)
        this.direction = ((this.direction % 360) + 360) % 360;
        
        // 속도 벡터 계산
        const directionRad = degToRad(this.direction);
        const velocityX = Math.sin(directionRad) * this.speed;
        const velocityZ = Math.cos(directionRad) * this.speed;
        
        // 위치 업데이트
        this.position.x += velocityX * deltaTime;
        this.position.z += velocityZ * deltaTime;
        
        // 선박 모델 위치 및 회전 업데이트
        this.shipGroup.position.copy(this.position);
        this.shipGroup.rotation.y = directionRad;
        
        // 돛대 및 돛 흔들림 효과
        if (this.sailDeployed && this.speed > 0.5) {
            const swayAmount = Math.sin(Date.now() * 0.002) * 0.02 * this.speed;
            this.mast.rotation.x = swayAmount;
            this.sail.rotation.y = Math.PI / 2 + swayAmount;
        }
        
        // 키 회전 효과
        if (this.keys.left) {
            this.rudder.rotation.y = Math.PI / 6;
        } else if (this.keys.right) {
            this.rudder.rotation.y = -Math.PI / 6;
        } else {
            this.rudder.rotation.y = lerp(this.rudder.rotation.y, 0, 0.1);
        }
        
        // 파도에 따른 상하 움직임
        this.shipGroup.position.y = Math.sin(Date.now() * 0.001 + this.position.x * 0.1 + this.position.z * 0.1) * 0.1;
        
        // 파도에 따른 롤링 효과
        this.shipGroup.rotation.z = Math.sin(Date.now() * 0.0015 + this.position.x * 0.05) * 0.05;
        this.shipGroup.rotation.x = Math.sin(Date.now() * 0.001 + this.position.z * 0.05) * 0.05;
        
        // UI 업데이트
        this.updateUI();
    }
    
    // UI 업데이트
    updateUI() {
        // 속도 표시
        const speedElement = document.getElementById('speed');
        if (speedElement) {
            speedElement.textContent = Math.abs(this.speed).toFixed(1);
        }
        
        // 방향 표시
        const directionElement = document.getElementById('direction');
        if (directionElement) {
            directionElement.textContent = getDirectionString(this.direction);
        }
    }
    
    // 위치 가져오기
    getPosition() {
        return this.position.clone();
    }
    
    // 방향 가져오기
    getDirection() {
        return this.direction;
    }
    
    // 속도 가져오기
    getSpeed() {
        return this.speed;
    }
    
    // 돛 상태 가져오기
    isSailDeployed() {
        return this.sailDeployed;
    }
}
