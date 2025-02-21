document.addEventListener("DOMContentLoaded", function () {
  console.log("v 0.0.1");

  const currentPath = window.location.pathname;

  if (currentPath === "/kontakt" || currentPath === "/fahrzeuge" || currentPath.startsWith("/fahrzeuge/")) {
    console.log("calculator loaded");
  } else {
    return;
  }

  // Get the loader element
  const loader = document.querySelector(".cmp--calculator-loader.cmp");

  // Function to handle contact page
  function handleContactPage(data) {
    // Contact page specific logic
    console.log("Contact page handler with pricing data", data);
  }

  // Function to handle vehicle detail pages
  function handleVehicleDetailPage(data) {
    // Vehicle detail page specific logic
    console.log("Vehicle detail page handler with pricing data", data);
  }

  // Function to handle vehicles overview page
  function handleVehiclesPage(data) {
    // Vehicles overview page specific logic
    console.log("Vehicles overview page handler with pricing data", data);
  }

  // Show loader
  if (loader) {
    loader.classList.remove("hidden");
  }

  // Fetch the pricing data
  fetch("https://pub-ca3292da20874e628ec9745223ecc04e.r2.dev/pricing-data.json")
    .then((response) => response.json())
    .then((data) => {
      // Hide loader
      if (loader) {
        loader.classList.add("hidden");
      }

      // Route to appropriate handler based on URL
      if (currentPath === "/contact") {
        handleContactPage(data);
      } else if (currentPath === "/fahrzeuge") {
        handleVehiclesPage(data);
      } else if (currentPath.startsWith("/fahrzeuge/")) {
        handleVehicleDetailPage(data);
      }
    })
    .catch((error) => {
      console.error("Error fetching pricing data:", error);
      // Hide loader on error
      if (loader) {
        loader.classList.add("hidden");
      }
    });
});
