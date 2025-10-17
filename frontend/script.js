// Initialize Vanta backgrounds
VANTA.NET({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    color: 0xffffff,
    backgroundColor: 0x28328c
});

document.addEventListener("DOMContentLoaded", () => {
  if (!window._vantaForm) {
    window._vantaForm = window.VANTA.BIRDS({
      el: "#vanta-form-bg",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      backgroundAlpha: 0.0,
      color1: 0x22c55e,
      color2: 0x3b82f6,
      birdSize: 1.2,
      wingSpan: 20,
      speedLimit: 4,
      separation: 50,
      alignment: 30,
      cohesion: 20,
    });
  }
});

// Form submission: save data and redirect
const form = document.getElementById("symptomForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    age: Number(document.getElementById("age").value),
    symptoms: document.getElementById("symptoms").value.trim()
  };

  // Save to sessionStorage
  sessionStorage.setItem("formData", JSON.stringify(data));

  // --- Step 0: Get user coordinates for nearby doctors ---
  let lat = null;
  let lon = null;

  try {
    // Request geolocation
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lat = position.coords.latitude;
          lon = position.coords.longitude;
          resolve();
        },
        (err) => {
          console.warn("Geolocation failed or denied:", err.message);
          resolve(); // fallback: continue without coordinates
        }
      );
    });

    // Optionally, if no coordinates, ask for city name input from user
    // const city = document.getElementById("city")?.value.trim() || "";

    // Call backend to fetch nearby doctors
    let query = "";
    if (lat && lon) {
      query = `lat=${lat}&lon=${lon}`;
    }
    // else if (city) {
    //   query = `city=${encodeURIComponent(city)}`;
    // }

    if (query) {
      const resp = await fetch(`/nearby-doctors?${query}`);
      const doctors = await resp.json();
      console.log("Nearby doctors data:", doctors);

      // Save doctors data in sessionStorage to use on result page
      sessionStorage.setItem("nearbyDoctors", JSON.stringify(doctors));
    }
  } catch (err) {
    console.error("Failed to fetch nearby doctors:", err);
  }

  // Redirect to results page
  window.location.href = "result.html";
});
