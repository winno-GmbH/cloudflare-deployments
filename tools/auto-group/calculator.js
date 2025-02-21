document.addEventListener("DOMContentLoaded", function () {
  console.log("v 0.0.3");

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

// Function to handle vehicle detail pages
function handleVehicleDetailPage(data) {
  const vehicleName = document.querySelector("h1").textContent;
  const vehicleData = data.find((item) => item.sheetName === vehicleName);

  if (!vehicleData) {
    console.log("Vehicle data not found");
    return;
  }

  const form = document.querySelector('name="kontakt-form"');

  if (!form) {
    console.log("Form not found");
    return;
  }

  // 0. get radio groups
  const mietdauerRadioGroup = form.querySelectorAll(".cmp--rb.cmp")[0];
  const kilometerpaketRadioGroup = form.querySelectorAll(".cmp--rb.cmp")[1];

  // 1. get pricing data and map it to the mietdauer and kilometerpaket radio groups
  const mietdauerOptions = vehicleData.pricingData[0].options.map((option) => ({
    label: option.key,
    value: option.value,
  }));

  const kilometerOptions = vehicleData.pricingData.map((item) => ({
    label: item.distance,
    value: item.distance,
  }));

  console.log("Mietdauer options:", mietdauerOptions);
  console.log("Kilometer options:", kilometerOptions);

  // 2. generate all radio buttons for the pricing data
  function createRadioButton(template, { label, value, name }) {
    const radioDiv = template.cloneNode(true);
    const input = radioDiv.querySelector('input[type="radio"]');
    const labelElement = radioDiv.querySelector(".lbl--rb.lbl");

    input.value = value;
    input.name = name;
    input.checked = false; // Ensure new buttons aren't checked by default
    labelElement.textContent = label;

    return radioDiv;
  }

  // Get template radio buttons
  const mietdauerTemplate = mietdauerRadioGroup.querySelector(".cmp--rb-option.cmp");
  const kilometerTemplate = kilometerpaketRadioGroup.querySelector(".cmp--rb-option.cmp");

  // Clear existing radio buttons
  mietdauerRadioGroup.innerHTML = "";
  kilometerpaketRadioGroup.innerHTML = "";

  // Generate Mietdauer radio buttons
  mietdauerOptions.forEach((option) => {
    const radioButton = createRadioButton(mietdauerTemplate, {
      label: option.label,
      value: option.value,
      name: "Mietdauer",
    });
    mietdauerRadioGroup.appendChild(radioButton);
  });

  // Generate Kilometer radio buttons
  kilometerOptions.forEach((option) => {
    const radioButton = createRadioButton(kilometerTemplate, {
      label: option.label,
      value: option.value,
      name: "Kilometer",
    });
    kilometerpaketRadioGroup.appendChild(radioButton);
  });

  // Vehicle detail page specific logic
  console.log("Vehicle detail page handler with pricing data", vehicleData);
}
