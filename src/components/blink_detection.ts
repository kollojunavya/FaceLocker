import * as faceapi from "face-api.js";

let earHistory: number[] = [];
let BLINK_THRESHOLD = 0.28; // Increased for natural blinks
const MIN_FRAMES = 3;

function calculateEAR(eyePoints: faceapi.Point[]): number {
  const A = Math.hypot(eyePoints[1].x - eyePoints[5].x, eyePoints[1].y - eyePoints[5].y);
  const B = Math.hypot(eyePoints[2].x - eyePoints[4].x, eyePoints[2].y - eyePoints[4].y);
  const C = Math.hypot(eyePoints[0].x - eyePoints[3].x, eyePoints[0].y - eyePoints[3].y);
  return (A + B) / (2.0 * C);
}

// Calibrate threshold based on user's blinks
async function calibrateThreshold(video: HTMLVideoElement, faceapiInstance: typeof faceapi): Promise<void> {
  let earSum = 0;
  let count = 0;
  const calibrationFrames = 10;

  for (let i = 0; i < calibrationFrames; i++) {
    const detection = await faceapiInstance
      .detectSingleFace(video, new faceapiInstance.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
      .withFaceLandmarks();

    if (detection) {
      const landmarks = detection.landmarks.positions;
      const leftEye = landmarks.slice(36, 42);
      const rightEye = landmarks.slice(42, 48);
      const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;
      earSum += avgEAR;
      count++;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (count > 0) {
    const avgEAR = earSum / count;
    BLINK_THRESHOLD = Math.max(0.25, avgEAR - 0.2); // Set threshold slightly below average open-eye EAR
    console.log(`Calibrated BLINK_THRESHOLD: ${BLINK_THRESHOLD}`);
  }
}

async function detectBlink(video: HTMLVideoElement, faceapiInstance: typeof faceapi): Promise<{ blinkDetected: boolean; error?: string; ear?: number }> {
  try {
    const detection = await faceapiInstance
      .detectSingleFace(video, new faceapiInstance.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
      .withFaceLandmarks();

    if (!detection) {
      return { blinkDetected: false, error: "No face detected" };
    }

    const landmarks = detection.landmarks.positions;
    const leftEye = landmarks.slice(36, 42);
    const rightEye = landmarks.slice(42, 48);
    const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;

    earHistory.push(avgEAR);
    if (earHistory.length > 5) earHistory.shift();

    // Detect blink if EAR drops below threshold
    if (earHistory.length >= MIN_FRAMES && earHistory[earHistory.length - 1] < BLINK_THRESHOLD) {
      earHistory = [];
      console.log(`Blink detected with EAR: ${avgEAR}`);
      return { blinkDetected: true, ear: avgEAR };
    }

    return { blinkDetected: false, ear: avgEAR };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { blinkDetected: false, error: errorMessage };
  }
}

export { detectBlink, calibrateThreshold };