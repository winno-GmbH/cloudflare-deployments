console.log("v 0.1.15");

let scriptLoaded = false;

function init() {
  const currentPath = window.location.pathname;

  if (currentPath === "/formular" || currentPath === "/fahrzeuge" || currentPath.startsWith("/fahrzeuge/")) {
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
      if (currentPath === "/formular") {
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

// generate all radio buttons for the pricing data
function createRadioButton(template) {
  // Clone the template and its children
  const radioDiv = template.cloneNode(true);
  return radioDiv;
}

function changeRadioButton(radioDiv, { label, value, name }, isFirstButton, updatePrice, vehicleData) {
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

  const anfragenButton = form.querySelector(".wr_btn--form.wr_btn:last-child");

  if (!anfragenButton) {
    console.log("Anfragen button not found");
    return;
  }

  anfragenButton.addEventListener("click", () => {
    // get the selected values and save them to the local storage
    const selectedMietdauer = form.querySelector('input[name="Mietdauer"]:checked')?.value;
    const selectedKilometer = form.querySelector('input[name="Kilometer"]:checked')?.value;
    const premiumAddon = form.querySelector('input[name="premium-versicherung"]').checked;
    const parkingAddon = form.querySelector('input[name="parkschaden-versicherung"]').checked;

    localStorage.setItem("selectedMietdauer", selectedMietdauer);
    localStorage.setItem("selectedKilometer", selectedKilometer);
    localStorage.setItem("premiumAddon", premiumAddon);
    localStorage.setItem("parkingAddon", parkingAddon);
    localStorage.setItem("selectedVehicle", vehicleName);
  });

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
      index === 0,
      updatePrice,
      vehicleData
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
      index === 0,
      updatePrice,
      vehicleData
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

  const selectedVehicle = localStorage.getItem("selectedVehicle");
  const selectedMietdauer = localStorage.getItem("selectedMietdauer");
  const selectedKilometer = localStorage.getItem("selectedKilometer");
  const premiumAddon = localStorage.getItem("premiumAddon");
  const parkingAddon = localStorage.getItem("parkingAddon");

  console.log("Selected vehicle", selectedVehicle);
  console.log("Selected mietdauer", selectedMietdauer);
  console.log("Selected kilometer", selectedKilometer);
  console.log("Premium addon", premiumAddon);
  console.log("Parking addon", parkingAddon);
}

// Function to handle vehicles overview page
function handleVehiclesPage(data) {
  console.log("Vehicles overview page handler with pricing data");

  // Find all unique kilometer options across all vehicles
  const allKilometerOptions = new Set();
  // Find all unique mietdauer options across all vehicles
  const allMietdauerOptions = new Set();

  // Collect all unique options
  data.forEach((vehicle) => {
    vehicle.pricingData.forEach((item) => {
      allKilometerOptions.add(item.distance);

      item.options.forEach((option) => {
        allMietdauerOptions.add(option.key);
      });
    });
  });

  // Convert sets to sorted arrays
  const kilometerOptions = Array.from(allKilometerOptions).sort();
  const mietdauerOptions = Array.from(allMietdauerOptions).sort((a, b) => {
    // Sort by the numeric value in the string (e.g., "1 Monat" comes before "3 Monate")
    const numA = parseInt(a.split(" ")[0]);
    const numB = parseInt(b.split(" ")[0]);
    return numA - numB;
  });

  const form = document.querySelector('[name="kontakt-form"]');

  if (!form) {
    console.log("Form not found");
    return;
  }

  const mietdauerRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[0];
  const kilometerpaketRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[1];

  const rbTemplate = form.querySelector(".cmp--rb.cmp");

  mietdauerRadioGroup.innerHTML = "";
  kilometerpaketRadioGroup.innerHTML = "";

  form
    .querySelectorAll('input[name="premium-versicherung"], input[name="parkschaden-versicherung"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        updateAllVehiclePrices(data);
      });
    });

  // Create radio buttons for mietdauer
  mietdauerOptions.forEach((option, index) => {
    const radioButton = createRadioButton(rbTemplate);
    mietdauerRadioGroup.appendChild(radioButton);
    changeRadioButton(
      radioButton,
      {
        label: option,
        value: option,
        name: "Mietdauer",
      },
      index === 0,
      updateAllVehiclePrices,
      data
    );
  });

  // Create radio buttons for kilometer
  kilometerOptions.forEach((option, index) => {
    const radioButton = createRadioButton(rbTemplate);
    kilometerpaketRadioGroup.appendChild(radioButton);
    changeRadioButton(
      radioButton,
      {
        label: option,
        value: option,
        name: "Kilometer",
      },
      index === 0,
      updateAllVehiclePrices,
      data
    );
  });

  // Add event listeners to all radio buttons
  form.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      updateAllVehiclePrices(data);
    });
  });

  // Initial price update
  updateAllVehiclePrices(data);

  // Function to update prices for all vehicles
  function updateAllVehiclePrices(data) {
    const selectedMietdauer = form.querySelector('input[name="Mietdauer"]:checked').value;
    const selectedKilometer = form.querySelector('input[name="Kilometer"]:checked').value;

    const premiumAddon = form.querySelector('input[name="premium-versicherung"]').checked;
    const parkingAddon = form.querySelector('input[name="parkschaden-versicherung"]').checked;

    // Get all car cards
    const carCards = document.querySelectorAll(".lyt--l-cars.lyt.w-dyn-items .cmp--l-car");

    carCards.forEach((card) => {
      // Get the vehicle name from the card
      const vehicleName = card.querySelector("h3").textContent.trim();

      // Find the matching vehicle data
      const vehicleData = data.find((item) => item.sheetName === vehicleName);

      if (!vehicleData) {
        console.log(`Vehicle data not found for: ${vehicleName}`);
        return;
      }

      // Get the price element
      const priceElement = card.querySelector(".car-price");

      if (!priceElement) {
        console.log(`Price element not found for: ${vehicleName}`);
        return;
      }

      // Find the matching kilometer package
      const kilometerPackage = vehicleData.pricingData.find((item) => item.distance === selectedKilometer);

      if (!kilometerPackage) {
        updateOptions(priceElement, false);
        return;
      }

      // Find the matching mietdauer option
      const mietdauerOption = kilometerPackage.options.find((option) => option.key === selectedMietdauer);

      if (!mietdauerOption) {
        updateOptions(priceElement, false);
        return;
      }

      updateOptions(priceElement, true);

      function updateOptions(priceElement, show) {
        const parent = priceElement.closest(".wr_p--form-item.wr_p").parentElement;
        if (show) {
          parent.querySelector(".wr_p--form-item.wr_p").classList.remove("hidden");
          parent.querySelector(".wr_p--form-item.wr_p.not-available").classList.add("hidden");
        } else {
          parent.querySelector(".wr_p--form-item.wr_p").classList.add("hidden");
          parent.querySelector(".wr_p--form-item.wr_p.not-available").classList.remove("hidden");
        }
      }

      let price = mietdauerOption.value;

      if (premiumAddon) {
        price += vehicleData.premiumInsurance;
      }

      if (parkingAddon) {
        price += vehicleData.parkingDamageInsurance;
      }
      // Update the price
      priceElement.textContent = `${price}.-`;
    });
  }

  scriptLoaded = true;
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
