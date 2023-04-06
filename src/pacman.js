let capture;
let detector;
// let handState = "open"; // stato iniziale
let currentAngle = 0; // angolo corrente di apertura della bocca
let targetAngle = 0; // angolo desiderato di apertura della bocca
let pallini = []
const smoothingFactor = 0.2; // fattore di smoothing per l'interpolazione

// Configurazione dell’elemento video
const videoConfig = {
  width: 750,
  height: 500,
  fps: 60
}

async function setup() {
  createCanvas(750, 500);
  currentAngle = 0;
  capture = createCapture(VIDEO);
  capture.size(750, 500);
  capture.hide();
  capture.position(0, 0);

  console.log("Carico modello...");
  detector = await createDetector();
  console.log("Modello caricato.");
}



async function draw() {
  background('#00095B');
  
  for (let i = 0; i < pallini.length; i++) {
    pallini[i].display();
  }


  if (detector && capture.loadedmetadata) {
    const hands = await detector.estimateHands(capture.elt, { flipHorizontal: true });
    for (let j = 0; j < hands.length; j++) {
		const hand = hands[j];
		const handedness = hand.handedness;
		const thumb = hand.keypoints[4];
		const index = hand.keypoints[8];
		let distance = dist(thumb.x, thumb.y, index.x, index.y);

		let newDistance = distance < 25 ? 0 : distance;
		targetAngle = map(newDistance, 0, 25, 0, 90); // calcola l'angolo di apertura desiderato della bocca

		let handstate
		if (distance < 25) { // se le dita sono vicine, chiudi la bocca
			handState = "closed";
		} else { // altrimenti apri la bocca
			handState = "open";
		}

		// interpolazione "smooth" tra l'angolo corrente e quello desiderato
		currentAngle = lerp(currentAngle, targetAngle, smoothingFactor);

		if (handedness == "Right") {
			console.log("destra")
			drawPacman(index.x, index.y, 125, currentAngle, false);
		} else {
			console.log("sinistra")
			drawPacman(index.x, index.y, 125, currentAngle, true);
		}


      // controlla la collisione con i pallini
	  	if (handState == "closed") {
			for (let i = pallini.length-1; i >=0; i--) {
				if (pallini[i].collide(index.x, index.y, 125/2)) {
					pallini.splice(i, 1);
				}
			}
		}
    }
  }
}




function drawPacman(x, y, size, angle, flip) {
	const mouthSize = size * 0.5;
  
	noStroke();
	fill(255, 255, 0); // colore giallo per il corpo di Pacman
 
	angle = min(angle, 90);

	const a2 = radians(angle/2)

	if (flip) {
		arc(x, y, size, size, a2, TAU-a2,  PIE );
	} else {
		arc(x, y, size, size, PI+a2, PI-a2,  PIE );
	}
  }
  
  

  function keyPressed() {
	if (keyCode === 32) {
		let newPallino = new Pallino();
		pallini.push(newPallino);
	}
}
class Pallino {
	constructor() {
		this.x = random(width);
		this.y = random(height);
		this.r = 10
	}

	display() {
		fill(255);
		ellipse(this.x, this.y, this.r*2, this.r*2)
	}

	collide(x, y, r) {
		const distCentri = dist(x, y, this.x, this.y);
		const sommaRaggi = this.r + r; // raggio della bocca
		if (distCentri < sommaRaggi) {
			return true;
		} else {
			return false;
		}
	}

}


async function createDetector() {
	// Configurazione Media Pipe
	// https://google.github.io/mediapipe/solutions/hands
	const mediaPipeConfig = {
		runtime: "mediapipe",
		modelType: "full",
		maxHands: 2,
		solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
	}
	return window.handPoseDetection.createDetector(window.handPoseDetection.SupportedModels.MediaPipeHands, mediaPipeConfig)
}