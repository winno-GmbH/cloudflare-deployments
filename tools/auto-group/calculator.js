console.log("v 0.2.21");
let scriptLoaded = false;

class AutoGroupCalculator {
  constructor() {
    this.pricingData = null;
    this.currentPath = window.location.pathname;
    this.loader = document.querySelector(".cmp--calculator-loader.cmp");
  }

  init() {
    // Only run on relevant pages
    if (!this.isRelevantPage()) {
      return;
    }

    console.log("Calculator loaded");
    this.showLoader();
    this.fetchPricingData()
      .then(() => {
        this.hideLoader();
        this.routeToHandler();
      })
      .catch(this.handleError.bind(this));
  }

  isRelevantPage() {
    return (
      this.currentPath === "/formular" || this.currentPath === "/auto-abo" || this.currentPath.startsWith("/auto-abo/")
    );
  }

  showLoader() {
    if (this.loader) {
      this.loader.classList.remove("hidden");
    }
  }

  hideLoader() {
    if (this.loader) {
      this.loader.classList.add("hidden");
    }
  }

  async fetchPricingData() {
    const response = await fetch("https://pub-ca3292da20874e628ec9745223ecc04e.r2.dev/pricing-data.json");
    this.pricingData = await response.json();
    return this.pricingData;
  }

  handleError(error) {
    console.error("Error fetching pricing data:", error);
    this.hideLoader();
  }

  routeToHandler() {
    if (this.currentPath === "/formular") {
      console.log(localStorage);
      this.handleContactPage();
    } else if (this.currentPath === "/auto-abo") {
      this.handleVehiclesPage();
    } else if (this.currentPath.startsWith("/auto-abo/")) {
      console.log(localStorage);
      this.handleVehicleDetailPage();
    }
  }

  createRadioButton(template, { label, value, name }, isFirstButton, onChangeCallback) {
    // Clone the template and its children
    const radioDiv = template.cloneNode(true);
    const input = radioDiv.querySelector('input[type="radio"]');
    const labelElement = radioDiv.querySelector(".lbl--rb.lbl");

    input.value = value;
    input.name = name;
    labelElement.textContent = label;
    input.checked = isFirstButton;

    input.addEventListener("change", () => {
      if (input.checked && onChangeCallback) {
        onChangeCallback();
      }
    });

    return radioDiv;
  }

  setupForm(formName, updatePriceCallback) {
    const form = document.querySelector(`[name="${formName}"]`);
    if (!form) {
      console.log("Form not found");
      return null;
    }

    const mietdauerRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[0];
    const kilometerpaketRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[1];
    const rbTemplate = form.querySelector(".cmp--rb.cmp");

    if (!mietdauerRadioGroup || !kilometerpaketRadioGroup || !rbTemplate) {
      console.log("Form elements not found");
      return null;
    }

    // Clear existing radio buttons
    mietdauerRadioGroup.innerHTML = "";
    kilometerpaketRadioGroup.innerHTML = "";

    // Add event listeners to insurance checkboxes
    form
      .querySelectorAll('input[name="premium-versicherung"], input[name="parkschaden-versicherung"]')
      .forEach((input) => {
        input.addEventListener("change", updatePriceCallback);
      });

    return { form, mietdauerRadioGroup, kilometerpaketRadioGroup, rbTemplate };
  }

  handleVehicleDetailPage() {
    const vehicleName = document.querySelector("h1").textContent;
    const vehicleData = this.pricingData.find((item) => item.sheetName === vehicleName);

    if (!vehicleData) {
      console.log("Vehicle data not found");
      return;
    }

    const updatePrice = () => this.updateVehiclePrice(vehicleData);

    const formElements = this.setupForm("kontakt-form", updatePrice);
    if (!formElements) return;

    const { form, mietdauerRadioGroup, kilometerpaketRadioGroup, rbTemplate } = formElements;

    // Get options from vehicle data
    const mietdauerOptions = vehicleData.pricingData[0].options.map((option) => ({
      label: option.key,
      value: option.key,
    }));

    const kilometerOptions = vehicleData.pricingData.map((item) => ({
      label: item.distance,
      value: item.distance,
    }));

    // Setup "Anfragen" button to save selections to localStorage
    this.setupAnfragenButton(form, vehicleName);

    // Generate radio buttons
    this.generateRadioButtons(mietdauerRadioGroup, rbTemplate, mietdauerOptions, "Mietdauer", updatePrice);
    this.generateRadioButtons(kilometerpaketRadioGroup, rbTemplate, kilometerOptions, "Kilometer", updatePrice);

    // Initial price update
    updatePrice();
    scriptLoaded = true;
  }

  setupAnfragenButton(form, vehicleName) {
    const anfragenButton = form.querySelector(".wr_btn--form.wr_btn:last-child");
    if (!anfragenButton) {
      console.log("Anfragen button not found");
      return;
    }

    anfragenButton.addEventListener("click", () => {
      // Save selected values to localStorage
      const selectedMietdauer = form.querySelector('input[name="Mietdauer"]:checked')?.value;
      const selectedKilometer = form.querySelector('input[name="Kilometer"]:checked')?.value;
      const premiumAddon = form.querySelector('input[name="premium-versicherung"]').checked;
      const parkingAddon = form.querySelector('input[name="parkschaden-versicherung"]').checked;

      localStorage.setItem("selectedMietdauer", selectedMietdauer);
      localStorage.setItem("selectedKilometer", selectedKilometer);
      localStorage.setItem("premiumAddon", premiumAddon);
      localStorage.setItem("parkingAddon", parkingAddon);
      localStorage.setItem("selectedVehicle", vehicleName);

      window.location.href = "/formular";
    });
  }

  generateRadioButtons(container, template, options, name, onChangeCallback) {
    const selectedValue = localStorage.getItem(`selected${name}`);
    let firstButton = null;
    let selectedButton = null;

    options.forEach((option, index) => {
      const radioButton = this.createRadioButton(
        template,
        {
          label: option.label,
          value: option.value,
          name: name,
        },
        index === 0,
        onChangeCallback
      );

      container.appendChild(radioButton);

      if (index === 0) {
        firstButton = radioButton;
      }

      if (selectedValue && option.value === selectedValue) {
        selectedButton = radioButton;
      }
    });

    // Click either the selected button or the first one
    if (selectedButton) {
      selectedButton.dispatchEvent(new Event("click"));
      console.log("clicked selected button");
    } else if (firstButton) {
      firstButton.dispatchEvent(new Event("click"));
      console.log("clicked first button");
    }
    console.log("generated radio buttons");
  }

  updateVehiclePrice(vehicleData) {
    const form = document.querySelector('[name="kontakt-form"]');
    if (!form) return;

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

    // Find matching mietdauer option
    const mietdauerOption = kilometerPackage.options.find((option) => option.key === selectedMietdauer);
    if (!mietdauerOption) {
      console.error("Mietdauer option not found");
      return;
    }

    // Calculate price
    let price = mietdauerOption.value;
    if (premiumAddon) price += vehicleData.premiumInsurance;
    if (parkingAddon) price += vehicleData.parkingDamageInsurance;

    // save to localstorage
    localStorage.setItem("selectedMietdauer", selectedMietdauer);
    localStorage.setItem("selectedKilometer", selectedKilometer);
    localStorage.setItem("premiumAddon", premiumAddon);
    localStorage.setItem("parkingAddon", parkingAddon);

    // Update price display
    const priceElement = document.getElementById("car-price");
    if (priceElement) {
      priceElement.textContent = `${price}.-`;
    }
  }

  handleContactPage() {
    // Retrieve stored selections
    const selectedVehicle = localStorage.getItem("selectedVehicle");

    const updateAllPrices = () => this.updateVehiclePrice(vehicleData);

    const formElements = this.setupForm("kontakt-form", updateAllPrices);
    if (!formElements) return;

    const { form, mietdauerRadioGroup, kilometerpaketRadioGroup, rbTemplate } = formElements;

    const vehicleData = selectedVehicle
      ? this.pricingData.find((item) => item.sheetName === selectedVehicle)
      : this.pricingData[0];

    // Additional contact page logic can be implemented here
    this.generateCarSelectOptions(form);

    // Generate radio buttons
    this.generateRadioButtons(
      mietdauerRadioGroup,
      rbTemplate,
      vehicleData.pricingData[0].options.map((option) => ({ label: option.key, value: option.key })),
      "Mietdauer",
      updateAllPrices
    );
    this.generateRadioButtons(
      kilometerpaketRadioGroup,
      rbTemplate,
      vehicleData.pricingData.map((item) => ({ label: item.distance, value: item.distance })),
      "Kilometer",
      updateAllPrices
    );
    scriptLoaded = true;
  }

  generateCarSelectOptions(form) {
    const parent = form.querySelector(".select-options:empty");
    if (!parent) return;

    const options = this.pricingData.map((item) => item.sheetName);
    options.forEach((option) => {
      this.generateSelectOption(option, parent);
    });
  }

  generateSelectOption(option, parent) {
    const html = `
      <div class="cmp--tf-md-option cmp"><div class="lyt--tf-md-option lyt"><div class="wr_lbl--tf-md-option wr_lbl"><div class="lbl--tf-md-option lbl">${option}</div></div></div></div>
    `;

    parent.insertAdjacentHTML("beforeend", html);
  }

  handleVehiclesPage() {
    // Find all unique options across all vehicles
    const allOptions = this.collectUniqueOptions();

    const updateAllPrices = () => this.updateAllVehiclePrices();

    const formElements = this.setupForm("kontakt-form", updateAllPrices);
    if (!formElements) return;

    const { form, mietdauerRadioGroup, kilometerpaketRadioGroup, rbTemplate } = formElements;

    // Generate radio buttons
    this.generateRadioButtons(
      mietdauerRadioGroup,
      rbTemplate,
      allOptions.mietdauerOptions,
      "Mietdauer",
      updateAllPrices
    );
    this.generateRadioButtons(
      kilometerpaketRadioGroup,
      rbTemplate,
      allOptions.kilometerOptions,
      "Kilometer",
      updateAllPrices
    );

    // Initial price update
    updateAllPrices();
    scriptLoaded = true;
  }

  collectUniqueOptions() {
    const allKilometerOptions = new Set();
    const allMietdauerOptions = new Set();

    // Collect all unique options
    this.pricingData.forEach((vehicle) => {
      vehicle.pricingData.forEach((item) => {
        allKilometerOptions.add(item.distance);
        item.options.forEach((option) => {
          allMietdauerOptions.add(option.key);
        });
      });
    });

    // Convert sets to sorted arrays
    const kilometerOptions = Array.from(allKilometerOptions)
      .sort()
      .map((option) => ({ label: option, value: option }));

    const mietdauerOptions = Array.from(allMietdauerOptions)
      .sort((a, b) => {
        // Sort by the numeric value in the string (e.g., "1 Monat" comes before "3 Monate")
        const numA = parseInt(a.split(" ")[0]);
        const numB = parseInt(b.split(" ")[0]);
        return numA - numB;
      })
      .map((option) => ({ label: option, value: option }));

    return { kilometerOptions, mietdauerOptions };
  }

  updateAllVehiclePrices() {
    const form = document.querySelector('[name="kontakt-form"]');
    if (!form) return;

    const selectedMietdauer = form.querySelector('input[name="Mietdauer"]:checked')?.value;
    const selectedKilometer = form.querySelector('input[name="Kilometer"]:checked')?.value;
    const premiumAddon = form.querySelector('input[name="premium-versicherung"]').checked;
    const parkingAddon = form.querySelector('input[name="parkschaden-versicherung"]').checked;

    // save to localstorage
    localStorage.setItem("selectedMietdauer", selectedMietdauer);
    localStorage.setItem("selectedKilometer", selectedKilometer);
    localStorage.setItem("premiumAddon", premiumAddon);
    localStorage.setItem("parkingAddon", parkingAddon);

    // Get all car cards
    const carCards = document.querySelectorAll(".lyt--l-cars.lyt.w-dyn-items .cmp--l-car");

    carCards.forEach((card) => {
      // Get the vehicle name from the card
      const vehicleName = card.querySelector("h3").textContent.trim();

      // Find the matching vehicle data
      const vehicleData = this.pricingData.find((item) => item.sheetName === vehicleName);
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
        this.updateAvailabilityDisplay(priceElement, false);
        return;
      }

      // Find the matching mietdauer option
      const mietdauerOption = kilometerPackage.options.find((option) => option.key === selectedMietdauer);
      if (!mietdauerOption) {
        this.updateAvailabilityDisplay(priceElement, false);
        return;
      }

      this.updateAvailabilityDisplay(priceElement, true);

      // Calculate price
      let price = mietdauerOption.value;
      if (premiumAddon) price += vehicleData.premiumInsurance;
      if (parkingAddon) price += vehicleData.parkingDamageInsurance;

      // Update the price
      priceElement.textContent = `${price}.-`;
    });
  }

  updateAvailabilityDisplay(priceElement, isAvailable) {
    const parent = priceElement.closest(".wr_p--form-item.wr_p").parentElement;
    const availableElement = parent.querySelector(".wr_p--form-item.wr_p");
    const notAvailableElement = parent.querySelector(".wr_p--form-item.wr_p.not-available");

    if (isAvailable) {
      availableElement.classList.remove("hidden");
      notAvailableElement.classList.add("hidden");
    } else {
      availableElement.classList.add("hidden");
      notAvailableElement.classList.remove("hidden");
    }
  }
}

// Initialize the calculator
const calculator = new AutoGroupCalculator();
calculator.init();

function setupInitValues() {
  const interval = setInterval(() => {
    if (scriptLoaded) {
      if (window.location.pathname === "/formular") {
        setupForm();
      } else {
        setupNormal();
      }
    }
  }, 100);

  const setupNormal = () => {
    const selectedMietdauer = localStorage.getItem("selectedMietdauer");
    const selectedKilometer = localStorage.getItem("selectedKilometer");
    const premiumAddon = localStorage.getItem("premiumAddon");
    const parkingAddon = localStorage.getItem("parkingAddon");

    const form = document.querySelector('[name="kontakt-form"]');
    if (!form) return;

    const mietdauerRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[0];
    const kilometerpaketRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[1];

    if (mietdauerRadioGroup) {
      selectedMietdauer
        ? mietdauerRadioGroup
            .querySelector(`input[type="radio"][value="${selectedMietdauer}"]`)
            .closest(".cmp--rb.cmp")
            .click()
        : mietdauerRadioGroup.querySelector('input[type="radio"]').closest(".cmp--rb.cmp").click();
    }
    if (kilometerpaketRadioGroup) {
      selectedKilometer
        ? kilometerpaketRadioGroup
            .querySelector(`input[type="radio"][value="${selectedKilometer}"]`)
            .closest(".cmp--rb.cmp")
            .click()
        : kilometerpaketRadioGroup.querySelector('input[type="radio"]').closest(".cmp--rb.cmp").click();
    }

    if (premiumAddon) {
      form.querySelector('input[name="premium-versicherung"]').click();
    }
    if (parkingAddon) {
      form.querySelector('input[name="parkschaden-versicherung"]').click();
    }

    clearInterval(interval);
  };

  const setupForm = () => {
    const selectedVehicle = localStorage.getItem("selectedVehicle");
    const selectedMietdauer = localStorage.getItem("selectedMietdauer");
    const selectedKilometer = localStorage.getItem("selectedKilometer");
    const premiumAddon = localStorage.getItem("premiumAddon");
    const parkingAddon = localStorage.getItem("parkingAddon");

    console.log(selectedVehicle, selectedMietdauer, selectedKilometer, premiumAddon, parkingAddon);

    const form = document.querySelector('[name="kontakt-form"]');
    if (!form) return;

    const mietdauerRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[0];
    const kilometerpaketRadioGroup = form.querySelectorAll(".lyt--rb-group.lyt")[1];

    mietdauerRadioGroup
      .querySelector(`input[type="radio"][value="${selectedMietdauer}"]`)
      .closest(".cmp--rb.cmp")
      .click();
    kilometerpaketRadioGroup
      .querySelector(`input[type="radio"][value="${selectedKilometer}"]`)
      .closest(".cmp--rb.cmp")
      .click();

    if (premiumAddon === "true") {
      form.querySelector('input[name="premium-versicherung"]').click();
    }
    if (parkingAddon === "true") {
      form.querySelector('input[name="parkschaden-versicherung"]').click();
    }

    const options = form.querySelectorAll(".cmp--tf-md-option.cmp");
    options.forEach((option) => {
      if (option.textContent === selectedVehicle) {
        option.click();
      }
    });
    clearInterval(interval);
  };
}
