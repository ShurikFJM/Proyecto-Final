import * as THREE from 'three';
import * as CANNON from 'cannon';

let world: CANNON.World;
let ballBody: CANNON.Body;
let paddleLeftBody: CANNON.Body;
let paddleRightBody: CANNON.Body;
let scoreLeft = 0;
let scoreRight = 0;

function doThree() {
  // Escena y cámara
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 5, -5, 0.1, 100);
  camera.position.set(0, 20, 0);
  camera.lookAt(0, 0, 0);
  scene.background = new THREE.Color('black');

  // Luz ambiental y direccional
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0, 10, 10);
  scene.add(light);

  // Renderizador
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Mundo de física
  world = new CANNON.World();
  world.gravity.set(0, 0, 0);

  // Límite superior e inferior
  const topWall = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  topWall.position.set(0, 0, 5);
  topWall.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(topWall);

  const bottomWall = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  bottomWall.position.set(0, 0, -5);
  bottomWall.quaternion.setFromEuler(Math.PI / 2, 0, 0);
  world.addBody(bottomWall);

  // Pelota
  const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const ballMaterial3D = new THREE.MeshStandardMaterial({ color: 'white' });
  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial3D);
  scene.add(ballMesh);

  ballBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.5),
    position: new CANNON.Vec3(0, 0, 0),
  });
  resetBall();
  world.addBody(ballBody);

  // Paleta izquierda
  const paddleGeometry = new THREE.BoxGeometry(1, 0.2, 2);
  const paddleMaterial3D = new THREE.MeshStandardMaterial({ color: 'blue' });
  const paddleLeftMesh = new THREE.Mesh(paddleGeometry, paddleMaterial3D);
  scene.add(paddleLeftMesh);

  paddleLeftBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.1, 1)),
    position: new CANNON.Vec3(-8, 0, 0),
  });
  world.addBody(paddleLeftBody);

  // Paleta derecha
  const paddleRightMesh = new THREE.Mesh(paddleGeometry, paddleMaterial3D);
  paddleRightMesh.material = new THREE.MeshStandardMaterial({ color: 'red' });
  scene.add(paddleRightMesh);

  paddleRightBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.1, 1)),
    position: new CANNON.Vec3(8, 0, 0),
  });
  world.addBody(paddleRightBody);

  // Control de movimiento de las paletas
  let moveLeftPaddleUp = false;
  let moveLeftPaddleDown = false;
  let moveRightPaddleUp = false;
  let moveRightPaddleDown = false;

  window.addEventListener('keydown', (event) => {
    if (event.key === 'w') moveLeftPaddleUp = true;
    if (event.key === 's') moveLeftPaddleDown = true;
    if (event.key === 'ArrowUp') moveRightPaddleUp = true;
    if (event.key === 'ArrowDown') moveRightPaddleDown = true;
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'w') moveLeftPaddleUp = false;
    if (event.key === 's') moveLeftPaddleDown = false;
    if (event.key === 'ArrowUp') moveRightPaddleUp = false;
    if (event.key === 'ArrowDown') moveRightPaddleDown = false;
  });

  function updatePaddles() {
    if (moveLeftPaddleUp) paddleLeftBody.position.z += 0.1;
    if (moveLeftPaddleDown) paddleLeftBody.position.z -= 0.1;
    if (moveRightPaddleUp) paddleRightBody.position.z += 0.1;
    if (moveRightPaddleDown) paddleRightBody.position.z -= 0.1;

    // Limitar el movimiento de las paletas
    paddleLeftBody.position.z = Math.max(-4, Math.min(4, paddleLeftBody.position.z));
    paddleRightBody.position.z = Math.max(-4, Math.min(4, paddleRightBody.position.z));
  }

  // Limitar la velocidad máxima de la pelota
  const maxSpeed = 5;

  function limitBallSpeed() {
    const speed = ballBody.velocity.norm();
    if (speed > maxSpeed) {
      ballBody.velocity.scale(maxSpeed / speed, ballBody.velocity);
    }
  }

  // Función de animación
  function animate() {
    world.step(1 / 60);

    // Actualizar posiciones
    ballMesh.position.copy(ballBody.position as unknown as THREE.Vector3);
    paddleLeftMesh.position.copy(paddleLeftBody.position as unknown as THREE.Vector3);
    paddleRightMesh.position.copy(paddleRightBody.position as unknown as THREE.Vector3);

    updatePaddles();
    limitBallSpeed();

    // Colisiones con los límites
    if (ballBody.position.z > 4.5 || ballBody.position.z < -4.5) {
      ballBody.velocity.z *= -1;
    }

    if (ballBody.position.x < -9) {
      scoreRight++;
      console.log(`Punto para la derecha! Puntaje - Izquierda: ${scoreLeft}, Derecha: ${scoreRight}`);
      resetBall();
    } else if (ballBody.position.x > 9) {
      scoreLeft++;
      console.log(`Punto para la izquierda! Puntaje - Izquierda: ${scoreLeft}, Derecha: ${scoreRight}`);
      resetBall();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function resetBall() {
    ballBody.position.set(0, 0, 0);
    const initialSpeed = 3;
    ballBody.velocity.set(
      initialSpeed * (Math.random() > 0.5 ? 1 : -1),
      0,
      initialSpeed * (Math.random() > 0.5 ? 1 : -1)
    );
  }

  animate();
}

const App = () => {
  return (
    <>
      {doThree()}
    </>
  );
};

export default App;
