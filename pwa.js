// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Check if the app can be installed
let deferredPrompt;
const appInstallBanner = document.getElementById("appInstallBanner");
const installAppBtn = document.getElementById("installApp");
const dismissInstallBtn = document.getElementById("dismissInstall");
const installAppButton = document.getElementById("installAppButton");
const openPwaGuideBtn = document.getElementById("openPwaGuide");
const pwaGuideModal = document.getElementById("pwaGuideModal");
const closePwaGuideBtn = document.getElementById("closePwaGuide");
const deviceTabs = document.querySelectorAll(".device-tab");
const deviceInstructions = document.querySelectorAll(".device-instructions");

// Handle beforeinstallprompt event
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install banner
  appInstallBanner.classList.add("show");
  // Show the install button
  installAppButton.style.display = "flex";
});

// Install app button in banner
installAppBtn.addEventListener("click", () => {
  // Hide the app install banner
  appInstallBanner.classList.remove("show");
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
      // Hide the install button once installed
      installAppButton.style.display = "none";
    } else {
      console.log("User dismissed the install prompt");
    }
    // Clear the deferredPrompt variable
    deferredPrompt = null;
  });
});

// Dismiss install banner button
dismissInstallBtn.addEventListener("click", () => {
  // Hide the app install banner
  appInstallBanner.classList.remove("show");
});

// Install app button in main UI
installAppButton.addEventListener("click", () => {
  if (deferredPrompt) {
    // If we have the deferredPrompt, use it to show the install prompt
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        installAppButton.style.display = "none";
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  } else {
    // If no deferredPrompt is available, show the PWA guide modal
    openPwaGuide();
  }
});

// Open PWA guide button
openPwaGuideBtn.addEventListener("click", openPwaGuide);

// Function to open PWA guide
function openPwaGuide() {
  pwaGuideModal.style.display = "flex";
}

// Close PWA guide button
closePwaGuideBtn.addEventListener("click", () => {
  pwaGuideModal.style.display = "none";
});

// Device tabs in PWA guide
deviceTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remove active class from all tabs
    deviceTabs.forEach((t) => t.classList.remove("active"));
    // Add active class to clicked tab
    tab.classList.add("active");

    // Hide all device instructions
    deviceInstructions.forEach((inst) => (inst.style.display = "none"));

    // Show the selected device instructions
    const device = tab.dataset.device;
    document.getElementById(`${device}Instructions`).style.display = "block";
  });
});

// Handle app installed event
window.addEventListener("appinstalled", (e) => {
  // Hide the app install banner if it's still showing
  appInstallBanner.classList.remove("show");
  // Hide the install button
  installAppButton.style.display = "none";
  console.log("WeatherNow has been installed");

  // Show success message
  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  successText.textContent = "WeatherNow app has been successfully installed!";
  successMessage.style.display = "flex";

  setTimeout(() => {
    successMessage.style.display = "none";
  }, 3000);
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === pwaGuideModal) {
    pwaGuideModal.style.display = "none";
  }

  const shareModal = document.getElementById("shareModal");
  if (e.target === shareModal) {
    shareModal.style.display = "none";
  }
});

// Detect iOS devices
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detect Android devices
function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

// On page load, show appropriate install button based on device
document.addEventListener("DOMContentLoaded", () => {
  // Initially hide the install app button
  installAppButton.style.display = "none";

  // If it's iOS or Android but we don't have the deferredPrompt
  // (meaning the app can't be installed automatically), show the install button anyway
  if (isIOS() || isAndroid()) {
    installAppButton.style.display = "flex";

    // Pre-select the appropriate tab in the PWA guide
    if (isIOS()) {
      document.querySelector('.device-tab[data-device="ios"]').click();
    } else if (isAndroid()) {
      document.querySelector('.device-tab[data-device="android"]').click();
    }
  }
});
