let wakeLock = null;

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock active");

      wakeLock.addEventListener("release", () => {
        console.log("Wake Lock released");
      });

      // Reacquire if page comes back into focus
      document.addEventListener("visibilitychange", async () => {
        if (wakeLock !== null && document.visibilityState === "visible") {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("Wake Lock re-acquired");
        }
      });
    }
  } catch (err) {
    console.error(`Wake Lock error: ${err.name}, ${err.message}`);
  }
}

function enableWakeLock() {
  sessionStorage.setItem("wakelock", "true");
  requestWakeLock();
}

function disableWakeLock() {
  sessionStorage.removeItem("wakelock");
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// On every page load, auto re-enable if session says so
if (sessionStorage.getItem("wakelock") === "true") {
  requestWakeLock();
}
