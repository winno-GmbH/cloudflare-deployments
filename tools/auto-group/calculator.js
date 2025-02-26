console.log("v 0.0.34");

let scriptLoaded = false;

function init() {
  const currentPath = window.location.pathname;

  if (currentPath === "/kontakt" || currentPath === "/fahrzeuge" || currentPath.startsWith("/fahrzeuge/")) {
    console.log("calculator loaded");
  } else {
    return;
  }

  // Get the loader element
  const loader = document.querySelector(".cmp--calculator-loader.cmp");

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
}

// Function to handle vehicle detail pages
function handleVehicleDetailPage(data) {
  const vehicleName = document.querySelector("h1").textContent;
  const vehicleData = data.find((item) => item.sheetName === vehicleName);

  if (!vehicleData) {
    console.log("Vehicle data not found");
    return;
  }

  const form = document.querySelector('[name="kontakt-form"]');

  if (!form) {
    console.log("Form not found");
    return;
  }

  // 0. get radio groups
  const mietdauerRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[0];
  const kilometerpaketRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[1];

  // 1. get pricing data and map it to the mietdauer and kilometerpaket radio groups
  const mietdauerOptions = vehicleData.pricingData[0].options.map((option) => ({
    label: option.key,
    value: option.value,
  }));

  const kilometerOptions = vehicleData.pricingData.map((item) => ({
    label: item.distance,
    value: item.distance,
  }));

  // 2. generate all radio buttons for the pricing data
  function createRadioButton(template) {
    // Clone the template and its children
    const radioDiv = template.cloneNode(true);
    return radioDiv;
  }

  function changeRadioButton(radioDiv, { label, value, name }, isFirstButton) {
    const input = radioDiv.querySelector('input[type="radio"]');
    const labelElement = radioDiv.querySelector(".lbl--rb.lbl");

    input.value = value;
    input.name = name;
    labelElement.textContent = label;
    input.checked = isFirstButton;

    input.addEventListener("change", () => {
      if (input.checked) {
        updatePrice(vehicleData);
      }
    });

    if (isFirstButton) {
      input.closest(".cmp--rb.cmp").dispatchEvent(new Event("click"));
    }
  }

  // Get template radio button
  const rbTemplate = form.querySelector(".cmp--rb.cmp");

  // Clear existing radio buttons
  mietdauerRadioGroup.innerHTML = "";
  kilometerpaketRadioGroup.innerHTML = "";

  // Generate Mietdauer radio buttons
  mietdauerOptions.forEach((option, index) => {
    const radioButton = createRadioButton(rbTemplate);
    mietdauerRadioGroup.appendChild(radioButton);
    changeRadioButton(
      radioButton,
      {
        label: option.label,
        value: option.label,
        name: "Mietdauer",
      },
      index === 0
    );
  });

  // Generate Kilometer radio buttons
  kilometerOptions.forEach((option, index) => {
    const radioButton = createRadioButton(rbTemplate);
    kilometerpaketRadioGroup.appendChild(radioButton);
    changeRadioButton(
      radioButton,
      {
        label: option.label,
        value: option.label,
        name: "Kilometer",
      },
      index === 0
    );
  });

  form
    .querySelectorAll('input[name="premium-versicherung"], input[name="parkschaden-versicherung"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        updatePrice(vehicleData);
      });
    });

  // Add new function to update price
  function updatePrice(vehicleData) {
    // Get selected values
    const selectedMietdauer = form.querySelector('input[name="Mietdauer"]:checked')?.value;
    const selectedKilometer = form.querySelector('input[name="Kilometer"]:checked')?.value;

    const premiumAddon = form.querySelector('input[name="premium-versicherung"]').checked;
    const parkingAddon = form.querySelector('input[name="parkschaden-versicherung"]').checked;

    // Find matching kilometer package
    const kilometerPackage = vehicleData.pricingData.find((item) => item.distance === selectedKilometer);

    if (!kilometerPackage) {
      console.error("Kilometer package not found");
      return;
    }

    // Find matching mietdauer option and get price
    const mietdauerOption = kilometerPackage.options.find((option) => option.key === selectedMietdauer);

    if (!mietdauerOption) {
      console.error("Mietdauer option not found");
      return;
    }

    let price = mietdauerOption.value;

    if (premiumAddon) {
      price += vehicleData.premiumInsurance;
    }

    if (parkingAddon) {
      price += vehicleData.parkingDamageInsurance;
    }

    document.getElementById("car-price").textContent = `${price}.-`;
  }

  scriptLoaded = true;
}

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

function setupInitValues() {
  // setup interval to check if the script is loaded
  const interval = setInterval(() => {
    if (scriptLoaded) {
      const mietdauerRadioGroup = document.querySelectorAll(".lyt--rb-group.lyt")[0];
      const kilometerpaketRadioGroup = document.querySelectorAll(".lyt--rb-group.lyt")[1];

      mietdauerRadioGroup.querySelector('input[type="radio"]').closest(".cmp--rb.cmp").click();
      kilometerpaketRadioGroup.querySelector('input[type="radio"]').closest(".cmp--rb.cmp").click();
      clearInterval(interval);
    }
  }, 100);
}

init();
