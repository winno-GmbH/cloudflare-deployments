const currentScript =
  document.currentScript ||
  (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

const scriptSrc = currentScript.src;

const urlParams = new URLSearchParams(scriptSrc.split("?")[1]);

const accessKey = urlParams.get("key") ?? "fd821fc7-53b3-4f4c-b3b0-f4adf10491c7";
const formName = urlParams.get("form") ?? "Testformular";
const captchaKey = urlParams.get("captcha-key");

console.log("Form Submit v0.3.21");

const serverUrl = "https://gecko-form-tool-be-new.vercel.app/api/forms/submit";

const formStepPairs = [];

const form = document.querySelector(`[name="${formName}"]`);

const getFields = (parent) => {
  const fields = [];
  parent.querySelectorAll("input, textarea").forEach((field) => {
    const type = field.getAttribute("type");
    const required = field.required;

    const value = field.value;
    const customValidatorRegex = field.getAttribute("data-validator");
    const name = field.getAttribute("name");
    const label = field.closest(".cmp--form-item.cmp").querySelector(".lbl").innerText;
    if (type === "radio" || type === "checkbox") {
      const name = field.getAttribute("name");
      fields.push({
        type,
        required,
        name,
        item: field,
        value: field.closest(".cmp").querySelector(".lbl").innerText,
        checked: field.checked,
        variable: field.getAttribute("data-variable") ?? undefined,
        customValidatorRegex,
        label,
      });
    } else {
      fields.push({
        type,
        required,
        value,
        customValidatorRegex,
        item: field,
        name,
        label,
        variable: field.getAttribute("data-variable") ?? undefined,
      });
    }
  });
  return fields;
};

const convertFieldsToFormData = (fields) => {
  const allFields = [];
  fields.forEach((field) => {
    const req = {
      type: field.type,
      value: field.value,
      label: field.label,
    };
    if (field.variable) {
      req.variable = field.variable;
    }
    if (field.type === "radio" || field.type === "checkbox") {
      if (field.checked) {
        if (allFields.find((f) => f.label === field.label)) {
          const valueBefore = allFields.find((f) => f.label === field.label).value;
          allFields.find((f) => f.label === field.label).value = `${valueBefore}, ${field.value}`;
        } else {
          allFields.push(req);
        }
      }
    } else {
      allFields.push(req);
    }
  });
  return allFields;
};

function getCookie(name) {
  var cookieArray = document.cookie.split("; ");

  for (var i = 0; i < cookieArray.length; i++) {
    var cookie = cookieArray[i].split("=");
    if (cookie[0] === name) {
      return decodeURIComponent(cookie[1]);
    }
  }

  return null; // Return null if the cookie with the specified name is not found
}

const onSubmit = (e) => {
  const fields = getFields(form);
  const isValid = validateFields(fields);
  if (!isValid) {
    return;
  }
  const categories = [];
  formStepPairs.forEach((formStep) => {
    if (!(formStep.id !== "" && formStep.formStep.getAttribute("condition-active") !== "true")) {
      const fields = convertFieldsToFormData(getFields(formStep.formStep));
      const category = {
        name: formStep.name,
        form: fields,
      };
      categories.push(category);
    }
  });

  const keyword = getCookie("kwd");
  const campaign = getCookie("cid");
  const location = getCookie("loc");

  const request = {
    formData: {
      categories: categories,
    },
    test: accessKey,
    token: captchaKey,
    location: location,
    campaign: campaign,
    keyword: keyword,
  };

  var requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };

  e.target.classList.add("pending");
  e.target.disabled = true;
  const buttonText = e.target.getAttribute("pending-text") ?? "Loading...";
  e.target.innerText = buttonText;

  fetch(serverUrl, requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    })
    .then((data) => {
      // Handle the successful response data

      if (typeof gtag_report_conversion !== "undefined") {
        gtag_report_conversion();
      }
      if (dataLayer) {
        dataLayer.push({
          event: "form_conversion",
        });
      }

      form.querySelector(".cmp--form-steps.cmp")?.classList.add("hidden");
      formStepPairs.forEach((formStep) => {
        Array.from(formStep.formStep.classList).includes("cmp--form")
          ? formStep.formStep.classList.add("hidden")
          : formStep.formStep.querySelector(".cmp--form.cmp").classList.add("hidden");
      });
      form.querySelector(".cmp--btn-group.cmp")?.classList.add("hidden");
      form.querySelector(".cmp--form-success.cmp")?.classList.remove("hidden");
    })
    .catch((error) => {
      // Handle errors during the fetch request
      console.error("Error during sending data:", error.message);
    });
};

const formSteps = () => {
  let currentStep = 0;

  const nextStepButton = form.querySelector(".wr_btn--form-control-next.wr_btn");
  const previousStepButton = form.querySelector(".wr_btn--form-control-prev.wr_btn");

  const setStepsActivity = () => {
    previousStepButton.classList.add("hidden");
    submitButton.classList.add("hidden");
    nextStepButton.classList.remove("hidden");

    let lastActiveIndex = 0;

    formStepPairs.forEach((formStep, index) => {
      formStep.formStepNumber.classList.remove("completed");
      formStep.formStepNumber.classList.remove("active");
      formStep.formStepNumber.classList.remove("locked");
      if (formStep.formStep.id !== "" && formStep.formStep.getAttribute("condition-active") !== "true") {
        formStep.formStepNumber.classList.add("hidden");
      } else {
        formStep.formStepNumber.classList.remove("hidden");
        formStep.formStepNumber.querySelector(".p--form-step-nr").innerText = lastActiveIndex + 1;
        lastActiveIndex++;
      }
      if (index === currentStep) {
        formStep.formStepNumber.classList.add("active");
        formStep.formStep.classList.remove("hidden");
      } else {
        formStep.formStepNumber.classList.remove("locked");
        formStep.formStep.classList.add("hidden");
        if (index < currentStep) {
          formStep.formStepNumber.classList.add("completed");
        } else {
          formStep.formStepNumber.classList.add("locked");
        }
      }
    });

    if (currentStep > 0) {
      previousStepButton.classList.remove("hidden");
    }

    if (currentStep === formStepPairs.length - 1) {
      nextStepButton.classList.add("hidden");
      submitButton.classList.remove("hidden");
    }
  };

  const init = () => {
    const formSteps = form.querySelectorAll(".cmp--form.cmp");
    const formStepNumbers = form.querySelectorAll(".cmp--form-step.cmp");

    formSteps.forEach((formStep, index) => {
      formStepPairs.push({
        formStep: formStep,
        formStepNumber: formStepNumbers[index],
        name: formStep.getAttribute("name"),
        id: formStep.getAttribute("id") ?? "",
      });
      formStep.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((input) => {
        if (input.getAttribute("conditional-step")) {
          input.addEventListener("change", (e) => {
            const conditionalSteps = input.getAttribute("conditional-step").replace(" ", "").split(",");
            formStepPairs.map((formStep) => {
              if (e.target.checked) {
                if (conditionalSteps.includes(formStep.id)) {
                  formStep.formStepNumber.classList.remove("hidden");
                  formStep.formStep.setAttribute("condition-active", true);
                }
              } else {
                if (conditionalSteps.includes(formStep.id)) {
                  formStep.formStepNumber.classList.add("hidden");
                  formStep.formStep.setAttribute("condition-active", false);
                }
              }
            });
            setStepsActivity();
          });
        }
      });
    });
    setStepsActivity();
  };

  const nextStep = () => {
    const fields = getFields(formStepPairs[currentStep].formStep);
    const isValid = validateFields(fields);
    if (!isValid) {
      return;
    }

    for (let i = currentStep + 1; i < formStepPairs.length; i++) {
      if (!formStepPairs[i].formStepNumber.classList.contains("hidden")) {
        currentStep = i;
        break;
      }
    }

    setStepsActivity();
  };

  const previousStep = () => {
    for (let i = currentStep - 1; i >= 0; i--) {
      if (!formStepPairs[i].formStepNumber.classList.contains("hidden")) {
        currentStep = i;
        break;
      }
    }
    setStepsActivity();
  };

  init();
  nextStepButton.addEventListener("click", nextStep);
  previousStepButton.addEventListener("click", previousStep);
};

const submitButton = form.querySelector(".wr_btn--form-control-submit.wr_btn");
submitButton.addEventListener("click", onSubmit);

const validateTextInput = (field) => {
  const { value, required, customValidatorRegex, type } = field;

  if (required) {
    if (customValidatorRegex && !new RegExp(customValidatorRegex).test(value)) {
      return false;
    }
    if (value === "") {
      return false;
    }
    if (type === "email" && !new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$").test(value)) {
      return false;
    }
    if (type === "tel" && !new RegExp("^[0-9]{10,12}$").test(value)) {
      return false;
    }
    if (type === "password" && !new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$").test(value)) {
      return false;
    }
  }

  return true;
};

const validateCheckbox = (field) => {
  const { required, name } = field;
  const checkboxes = form.querySelectorAll(`input[name="${name}"]`);
  let oneChecked = false;
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      oneChecked = true;
    }
  });
  if (required && !oneChecked) {
    return false;
  }
  return true;
};

const validateRadio = (field) => {
  const { required, name } = field;
  const radios = form.querySelectorAll(`input[name="${name}"]`);
  let oneChecked = false;
  radios.forEach((radio) => {
    if (radio.checked) {
      oneChecked = true;
    }
  });
  if (required && !oneChecked) {
    return false;
  }
  return true;
};

const validateFields = (fields) => {
  let isValid = true;
  fields.forEach((field) => {
    let fieldIsValid = true;
    if (field.type === "checkbox") {
      fieldIsValid = validateCheckbox(field);
    } else if (field.type === "radio") {
      fieldIsValid = validateRadio(field);
    } else {
      fieldIsValid = validateTextInput(field);
    }

    if (!fieldIsValid) {
      field.item.closest(".lyt--form-item.lyt").lastChild.classList.add("error");
    } else {
      field.item.closest(".lyt--form-item.lyt").lastChild.classList.remove("error");
    }
    if (isValid) {
      isValid = fieldIsValid;
    }
  });
  return isValid;
};

if (form.querySelector(".cmp--form-steps.cmp")) {
  formSteps();
} else {
  formStepPairs.push({
    formStep: form,
    formStepNumber: 0,
    name: "Form Data",
  });
}

// tf - focused and filled
document.querySelectorAll(".cmp--tf.cmp").forEach((tf) => {
  const input = tf.querySelector("input");
  if (input.placeholder) {
    input.classList.add("filled");
  }
  tf.addEventListener("click", () => {
    tf.classList.add("focused");
    input.focus();
  });
  input.addEventListener("focus", () => {
    tf.classList.add("focused");
  });
  input.addEventListener("blur", () => {
    if (input.value === "") {
      tf.classList.remove("focused");
      tf.classList.remove("filled");
    } else {
      tf.classList.add("filled");
    }
    if (!tf.querySelector(".cmp--tf-md.cmp") || tf.querySelector(".cmp--tf-md.cmp.hidden")) {
      if (validateTextInput({ type: input.type, required: input.required, value: input.value, item: input })) {
        tf.classList.remove("error");
        tf.classList.add("success");
      } else {
        tf.classList.add("error");
        tf.classList.remove("success");
      }
    }
  });
});

// cb - checked
document.querySelectorAll(".cmp--cb.cmp").forEach((cb) => {
  const input = cb.querySelector("input");
  cb.addEventListener("click", (e) => {
    if (e.target !== input) {
      input.checked = !input.checked;
    }
    if (input.checked) {
      cb.classList.add("checked");
    } else {
      cb.classList.remove("checked");
    }
    form.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
      checkbox.dispatchEvent(new Event("change"));
    });
  });
});

// rb - checked
document.querySelectorAll(".cmp--rb.cmp").forEach((rb) => {
  const input = rb.querySelector("input");
  rb.addEventListener("click", () => {
    document.querySelectorAll(".cmp--rb.cmp").forEach((rb) => {
      rb.classList.remove("checked");
    });
    input.checked = true;
    form.querySelectorAll(`input[name="${input.name}"]`).forEach((radioGroupBtn) => {
      radioGroupBtn.dispatchEvent(new Event("change"));
    });
    rb.classList.add("checked");
  });
});

// sw - checked
document.querySelectorAll(".cmp--sw.cmp").forEach((sw) => {
  const input = sw.querySelector("input");
  sw.addEventListener("click", (e) => {
    if (e.target !== input) {
      input.checked = !input.checked;
    }
    if (input.checked) {
      sw.classList.add("checked");
    } else {
      sw.classList.remove("checked");
    }
    form.querySelectorAll(`input[name="${input.name}"]`).forEach((switchBtns) => {
      switchBtns.dispatchEvent(new Event("change"));
    });
  });
});

// ct - checked
document.querySelectorAll(".cmp--ct.cmp").forEach((ct) => {
  const input = ct.querySelector("input");
  ct.addEventListener("click", (e) => {
    if (e.target !== input) {
      input.checked = !input.checked;
    }
    if (input.checked) {
      ct.classList.add("checked");
    } else {
      ct.classList.remove("checked");
    }
    form.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
      checkbox.dispatchEvent(new Event("change"));
    });
  });
});

// ta - focused and filled
document.querySelectorAll(".cmp--ta.cmp").forEach((ta) => {
  const input = ta.querySelector("textarea");
  ta.addEventListener("click", () => {
    ta.classList.add("focused");
    input.focus();
  });
  input.addEventListener("focus", () => {
    ta.classList.add("focused");
  });
  input.addEventListener("blur", () => {
    if (input.value === "") {
      ta.classList.remove("focused");
      ta.classList.remove("filled");
    } else {
      ta.classList.add("filled");
    }
    if (validateTextInput({ type: input.type, required: input.required, value: input.value, item: input })) {
      ta.classList.remove("error");
      ta.classList.add("success");
    } else {
      ta.classList.add("error");
      ta.classList.remove("success");
    }
  });

  ta.addEventListener("click", () => {
    ta.classList.add("focused");
    input.focus();
  });
  input.addEventListener("blur", () => {
    if (input.value === "") {
      ta.classList.remove("focused");
    } else {
      ta.classList.add("filled");
    }
  });
});

// select / datepicker
document.querySelectorAll(".cmp--tf-md.cmp").forEach((tf) => {
  let parent = tf.closest(".cmp--tf.cmp");
  const overlay = parent.querySelector(".el--tf-md-overlay.el");
  parent = tf.closest(".cmp.cmp--tf-pre") ?? tf.closest(".cmp.cmp--tf-suf") ?? parent;
  const input =
    parent.querySelector("input") ??
    parent.querySelector(".lbl--tf-pre.lbl") ??
    parent.querySelector(".lbl--tf-suf.lbl");

  const options = Array.from(parent.querySelectorAll(".cmp--tf-md-option.cmp"));

  const generateDatePicker = (input, parent) => {
    const months = [
      { short: "JAN", long: "Januar", index: 0 },
      { short: "FEB", long: "Februar", index: 1 },
      { short: "MAR", long: "März", index: 2 },
      { short: "APR", long: "April", index: 3 },
      { short: "MAY", long: "Mai", index: 4 },
      { short: "JUN", long: "Juni", index: 5 },
      { short: "JUL", long: "Juli", index: 6 },
      { short: "AUG", long: "August", index: 7 },
      { short: "SEP", long: "September", index: 8 },
      { short: "OCT", long: "Oktober", index: 9 },
      { short: "NOV", long: "November", index: 10 },
      { short: "DEC", long: "Dezember", index: 11 },
    ];

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1;
    };

    input.addEventListener("input", (e) => {
      e.stopPropagation();
      input.value = "";
    });

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let selectedDay = "";
    if (input.value) {
      const [day, month, year] = input.value.split(".");
      currentYear = parseInt(year);
      currentMonth = parseInt(month) - 1;
      selectedDay = `${day}-${months[currentMonth].short}-${currentYear}`;
    }

    let currentView = "dp";

    const getNumberDisplay = (number) => {
      return number < 10 ? "0" + number : number;
    };

    const updateCalendar = () => {
      const dayPickerCmp = parent.querySelector(".cmp--dp.cmp");
      dayPickerCmp.innerHTML = "";

      const dayPicker = document.createElement("div");
      dayPicker.className = "lyt--dp lyt";
      dayPickerCmp.appendChild(dayPicker);

      const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      const daysInPrevMonth = getDaysInMonth(currentMonth - 1, currentYear);
      let daysUntilSundayAtEnd = (7 - ((firstDay + daysInMonth) % 7)) % 7;

      let day = 1;
      let nextMonthDay = 1;

      for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement("div");
        dayElement.className = "cmp--dp-day cmp";

        if (i < firstDay) {
          dayElement.classList.add("dif-month");
          dayElement.innerHTML = `<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${
            daysInPrevMonth - (firstDay - i - 1)
          }</p></div></div>`;
        } else if (day > daysInMonth) {
          if (daysUntilSundayAtEnd <= 0) {
            break;
          }
          daysUntilSundayAtEnd--;
          dayElement.classList.add("dif-month");
          dayElement.innerHTML = `<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${nextMonthDay++}</p></div></div>`;
        } else {
          if (`${getNumberDisplay(day)}-${months[currentMonth].short}-${currentYear}` === selectedDay)
            dayElement.classList.add("selected");
          if ((i + 1) % 7 === 6 || (i + 1) % 7 === 0) dayElement.classList.add("weekend");
          dayElement.innerHTML = `<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${getNumberDisplay(
            day
          )}</p></div></div>`;
          dayElement.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedDay = `${e.target.innerText.trim()}-${months[currentMonth].short}-${currentYear}`;
            updateCalendar();
            input.value = `${e.target.innerText.trim()}.${getNumberDisplay(
              months[currentMonth].index + 1
            )}.${currentYear}`;
            parent.classList.add("filled");
            overlay.classList.add("hidden");
            tf.classList.add("hidden");
            input.dispatchEvent(new Event("blur"));
          });
          day++;
        }

        dayPicker.appendChild(dayElement);
      }

      parent.querySelector(".cmp--dtp-nav-btn p").innerText = `${months[currentMonth].long} ${currentYear}`;
    };

    const updateMonthPicker = () => {
      const monthPickerCmp = parent.querySelector(".cmp--mp.cmp");
      monthPickerCmp.innerHTML = "";

      const monthPicker = document.createElement("div");
      monthPicker.className = "lyt--mp lyt";
      monthPickerCmp.appendChild(monthPicker);

      months.forEach((month, index) => {
        const monthElement = document.createElement("div");
        monthElement.className = "cmp--mp-month cmp";
        if (index === currentMonth) monthElement.classList.add("selected");

        monthElement.innerHTML = `<div class="lyt--mp-month lyt"><div class="wr_p--mp-month wr_p"><p class="p--m">${month.short}</p></div></div>`;
        monthElement.addEventListener("click", () => {
          currentMonth = index;
          currentView = "dp";
          switchView();
        });

        monthPicker.appendChild(monthElement);
      });
    };

    const updateYearPicker = () => {
      const yearPickerCmp = parent.querySelector(".cmp--yp.cmp");
      yearPickerCmp.innerHTML = "";

      const yearPicker = document.createElement("div");
      yearPicker.className = "lyt--yp lyt";
      yearPickerCmp.appendChild(yearPicker);

      for (let year = new Date().getFullYear() + 1; year >= 1900; year--) {
        const yearElement = document.createElement("div");
        yearElement.className = "cmp--yp-year cmp";
        if (year === currentYear) yearElement.classList.add("selected");

        yearElement.innerHTML = `<div class="lyt--yp-year lyt"><div class="wr_p--yp-year wr_p"><p class="p--m">${year}</p></div></div>`;
        yearElement.addEventListener("click", () => {
          currentYear = year;
          currentView = "mp";
          switchView();
        });

        yearPicker.appendChild(yearElement);
      }
    };

    const switchView = () => {
      const dayPickerCmp = parent.querySelector(".cmp--dp.cmp");
      const monthPickerCmp = parent.querySelector(".cmp--mp.cmp");
      const yearPickerCmp = parent.querySelector(".cmp--yp.cmp");

      dayPickerCmp.classList.add("hidden");
      monthPickerCmp.classList.add("hidden");
      yearPickerCmp.classList.add("hidden");

      if (currentView === "dp") {
        dayPickerCmp.classList.remove("hidden");
        updateCalendar();
      } else if (currentView === "mp") {
        monthPickerCmp.classList.remove("hidden");
        updateMonthPicker();
      } else if (currentView === "yp") {
        yearPickerCmp.classList.remove("hidden");
        updateYearPicker();
      }
      parent.querySelector(".cmp--dtp-nav-btn p").innerText = `${months[currentMonth].long} ${currentYear}`;
    };

    parent.querySelector(".cmp--dtp.cmp").innerHTML = `
      <div class="lyt--dtp lyt"></div>
      <div class="cmp--dp cmp hidden"></div>
      <div class="cmp--mp cmp hidden"></div>
      <div class="cmp--yp cmp hidden"></div>
    `;

    const container = parent.querySelector(".lyt--dtp.lyt");

    const navElement = `
    <div class="cmp--dtp-nav cmp">
      <div class="lyt--dtp-nav lyt">
        <div class="cmp--dtp-nav-prevnext cmp prev">
          <div class="lyt--dtp-nav-prevnext lyt">
            <div class="wr_ico--dtp-nav-prevnext wr_ico">
              <div class="w-embed">
                <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">
                  <path d="M560-240 320-480l240-240 56 56-184 184 184 184z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="cmp--dtp-nav-btn cmp">
          <div class="lyt--dtp-nav-btn lyt">
            <div class="wr_p--date-nav-btn wr_p">
              <p class="p--m">${months[currentMonth].long} ${currentYear}</p>
            </div>
            <div class="wr_ico--dtp-nav-btn wr_ico">
              <div class="w-embed">
                <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">
                  <path d="M480-345 240-585l56-56 184 184 184-184 56 56z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="cmp--dtp-nav-prevnext cmp next">
          <div class="lyt--dtp-nav-prevnext lyt">
            <div class="wr_ico--dtp-nav-prevnext wr_ico">
              <div class="w-embed">
                <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">
                  <path d="M504-480 320-664l56-56 240 240-240 240-56-56z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    container.innerHTML = navElement;

    const dayPicker = document.createElement("div");
    dayPicker.className = "cmp--dp cmp hidden";
    container.appendChild(dayPicker);

    const monthPicker = document.createElement("div");
    monthPicker.className = "cmp--mp cmp hidden";
    container.appendChild(monthPicker);

    const yearPicker = document.createElement("div");
    yearPicker.className = "cmp--yp cmp hidden";
    container.appendChild(yearPicker);

    parent.querySelector(".cmp--dtp-nav-prevnext.prev").addEventListener("click", () => {
      handlePrev();
    });

    parent.querySelector(".cmp--dtp-nav-prevnext.next").addEventListener("click", () => {
      handleNext();
    });

    parent.querySelector(".cmp--dtp-nav-btn.cmp").addEventListener("click", () => {
      if (currentView === "dp") currentView = "mp";
      else if (currentView === "mp") currentView = "yp";
      else if (currentView === "yp") currentView = "mp";
      switchView();
    });

    const handlePrev = () => {
      if (currentView === "dp") {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        updateCalendar();
      } else if (currentView === "mp") {
        currentYear--;
        updateMonthPicker();
      } else if (currentView === "yp") {
        currentYear -= 10;
        updateYearPicker();
      }
    };

    const handleNext = () => {
      if (currentView === "dp") {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        updateCalendar();
      } else if (currentView === "mp") {
        currentYear++;
        updateMonthPicker();
      } else if (currentView === "yp") {
        currentYear += 10;
        updateYearPicker();
      }
    };

    currentView = "dp";
    switchView();
  };

  const generateCountryCodePicker = (input, parent) => {
    fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json").then((response) => {
      response.json().then((data) => {
        parent.lastChild.lastChild.innerHTML = "";

        const options = data.map((country) => {
          const option = document.createElement("div");
          option.className = "cmp--tf-md-option cmp";
          option.textContent = `${country.emoji} ${country.code} ${country.dial_code}`;
          return option;
        });

        options.forEach((option) => {
          option.addEventListener("click", (e) => {
            e.stopPropagation();
            input.value = option.textContent.trim();
            input.innerHTML = option.textContent.trim();
            parent.classList.add("filled");
            overlay.classList.add("hidden");
            tf.classList.add("hidden");
            parent.classList.add("success");
            parent.classList.remove("error");
            options.forEach((option) => {
              option.classList.remove("hidden");
              option.classList.remove("checked");
            });
            option.classList.add("checked");
          });
          parent.lastChild.lastChild.appendChild(option);
        });

        parent.addEventListener("click", () => {
          overlay.classList.remove("hidden");
          tf.classList.remove("hidden");
        });

        overlay.addEventListener("click", (e) => {
          e.stopPropagation();
          overlay.classList.add("hidden");
          tf.classList.add("hidden");
          input.dispatchEvent(new Event("blur"));
        });
      });
    });
  };

  if (options.length === 0) {
    if (tf.getAttribute("data-type") === "country-code") {
      generateCountryCodePicker(input, tf);
    } else {
      generateDatePicker(input, parent);
    }
  } else {
    options.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        input.value = option.textContent.trim();
        parent.classList.add("filled");
        overlay.classList.add("hidden");
        tf.classList.add("hidden");
        parent.classList.add("success");
        parent.classList.remove("error");
        options.forEach((option) => {
          option.classList.remove("hidden");
          option.classList.remove("checked");
        });
        option.classList.add("checked");
      });
    });
  }

  input.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase(); // Get the input value and convert to lowercase for case-insensitive search

    const found = options.find((option) => option.textContent.trim().toLowerCase() === value);

    options.forEach((option) => {
      if (option.textContent.trim().toLowerCase().includes(value) || found) {
        option.classList.remove("hidden");
      } else {
        option.classList.add("hidden");
      }
    });
  });

  parent.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    tf.classList.remove("hidden");
  });
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.classList.add("hidden");
    tf.classList.add("hidden");
    input.dispatchEvent(new Event("blur"));
  });
});
