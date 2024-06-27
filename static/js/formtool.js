// Get the current script tag
var currentScript =
  document.currentScript ||
  (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

// Extract the "src" attribute from the current script tag
var scriptSrc = currentScript.src;

// Use URLSearchParams to parse the query string
var urlParams = new URLSearchParams(scriptSrc.split("?")[1]);

// Access the 'key' and 'form' parameters
const accessKey = urlParams.get("key");
const formName = urlParams.get("form");
const captchaKey = urlParams.get("captcha-key");

console.log("HELLO");

// Script Version
console.log("Form Submit v1.0.2");

const serverUrl = "https://gecko-form-tool-be-new.vercel.app/api/forms/submit/";

// const serverUrl = "https://form-tool-be.vercel.app/api/forms/submit";
// const serverUrl = "http://localhost:5000/api/forms/submit/";

// Now you can use keyParam and formParam as needed
// console.log("AccessKey: ", accessKey);
// console.log("FormName: ", formName);
// console.log("CaptchaKey: ", captchaKey);

// document.addEventListener("DOMContentLoaded", function () {
// Form validation handler
const form = document.querySelector("form[name='" + formName + "']");

// const formElements = form.elements;

// for (let i = 0; i < formElements.length; i++) {
//   const element = formElements[i];
//   const elClassName = ".cmp--" + element.classList[0];

//   if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
// TextArea State Validation
// if (element.type === "textarea") {
//   if (element.disabled) {
//     element.closest(elClassName).classList.add("disabled");
//   }
//   element.addEventListener("focus", (event) => {
//     element.closest(elClassName).classList.remove("error");
//     element.closest(elClassName).classList.add("focused");
//   });
//   element.addEventListener("blur", (event) => {
//     element.closest(elClassName).classList.remove("focused");
//     if (element.required && element.value.trim() === "") {
//       element.closest(elClassName).classList.remove("filled");
//       element.closest(elClassName).classList.add("error");
//     } else if (element.value.trim() === "") {
//       element.closest(elClassName).classList.remove("filled");
//       element.closest(elClassName).classList.remove("error");
//     } else {
//       element.closest(elClassName).classList.remove("error");
//       element.closest(elClassName).classList.add("filled");
//     }
//   });
// }
//   }
// }

function submitForm(userIp) {
  // alert("Submit");
  const formElements = form.elements;

  const submitButton = form.querySelector("[form-type='form-submit']");

  // Create an object to store the form data
  const newFormData = [];

  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    const elClassName = ".cmp--" + element.classList[0];

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      // Check if the field is required and still empty
      const validTypes = ["tel", "email", "text", "url", "number", "date", "time", "textarea"];

      if (validTypes.includes(element.type)) {
        if (element.required && element.value.trim() === "") {
          element.closest(elClassName).classList.add("error");
          element.focus();
          return; // Stop submission if a required field is empty
        }
      }
      let labelValue;

      // Update form data - sending all data from the form to backend point
      if (element.type !== "submit" && element.type !== "reset" && element.tagName !== "BUTTON") {
        const field = element.nextElementSibling;
        if (field) {
          labelValue = field.lastElementChild?.textContent.trim().replace(/\n/g, " ").replace(/\s+/g, " ");
        }

        let newElement = {
          label: element.dataset["name"] || element.name || labelValue,
          value: element.value.trim(),
          type: element.type,
          variable: element.dataset?.["variable"],
        };

        if (element.type === "radio") {
          if (element.checked) {
            newFormData.push(newElement);
          }
        } else if (element.type === "checkbox") {
          if (element.checked) {
            const label = element.dataset["name"] || element.name;
            if (!newFormData.find((item) => item.label === label)) {
              const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${element.name}"]`);

              // Iterate over the checkboxes and concatenate their values
              const checkboxValues = Array.from(checkboxes)
                .filter((checkbox) => checkbox.checked)
                .map((checkbox) => checkbox.value)
                .join(", ");

              newElement.value = checkboxValues;
              newFormData.push(newElement);
            }
          }
        } else {
          newFormData.push(newElement);
        }
      }
    }
  }

  // Function to get the value of a cookie by name
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

  let keyword = getCookie("kwd");
  let campaign = getCookie("cid");
  let location = getCookie("loc");

  // const requestData = {
  //   formData: {
  //     categories: [{ name: "Form Data", form: newFormData }],
  //     keyword: keyword,
  //     campaign: campaign,
  //     location: location,
  //     userIp: userIp,
  //   },
  // };

  const requestData = {
    formData: {
      categories: [{ name: "Form Data", form: newFormData }],
    },
    keyword: keyword,
    campaign: campaign,
    location: location,
    userIp: userIp,
    test: accessKey,
  };

  console.log("Form Submit Data: " + JSON.stringify(requestData.formData));

  // var requestOptions = {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     AccessKey: accessKey, // Include the AccessKey in the Request header
  //   },
  //   body: JSON.stringify(requestData),
  // };

  if (submitButton) {
    submitButton.innerHTML = submitButton.dataset["wait"] || "Sending data ...";
    submitButton.classList.add("sending");
  }

  const submit = (token = "") => {
    requestData.token = token;

    const myHeaders = new Headers();
    myHeaders.append("Accept", "*/*");
    myHeaders.append("Accept-Language", "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7");
    myHeaders.append("Connection", "keep-alive");
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Origin", "https://www.winno.ch");
    myHeaders.append("Referer", "https://www.winno.ch/");
    myHeaders.append("Sec-Fetch-Dest", "empty");
    myHeaders.append("Sec-Fetch-Mode", "cors");
    myHeaders.append("Sec-Fetch-Site", "cross-site");
    myHeaders.append(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );
    myHeaders.append("sec-ch-ua", '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"');
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", '"macOS"');

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestData),
    };

    try {
      fbq("track", "Lead");
    } catch (error) {
      console.log("fb not initialized");
    }

    // Make the fetch request
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
        // if (isset(dataLayer)) {
        //   dataLayer.push({
        //     event: "form_conversion",
        //   });
        // }

        if (typeof dataLayer !== "undefined") {
          dataLayer.push({
            event: "form_conversion",
          });
        }
        console.log("Data sent successfully:", data);
        submitButton.innerHTML = submitButton.dataset["success"] || "Data was sent!";
        submitButton.classList.remove("sending");
        // submitButton.classList.add("disabled");
      })
      .catch((error) => {
        // Handle errors during the fetch request
        console.error("Error during sending data:", error.message);
      });
  };

  if (captchaKey && typeof grecaptcha !== "undefined") {
    // if (captchaKey && grecaptcha) {
    grecaptcha.enterprise.ready(function () {
      grecaptcha.enterprise.execute(captchaKey, { action: "submit" }).then(function (token) {
        submit(token);
        console.log("Token", token);
      });
    });
  } else {
    submit();
  }
}

const customFormSubmitButton = form.querySelector("[form-type='form-submit']");

customFormSubmitButton.addEventListener("click", () => {
  customFormSubmitButton.classList.add("disabled");
  try {
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        let ipAddress = data.ip;
        submitForm(ipAddress);
      });
  } catch (error) {
    console.error("There was an error:", error);
    submitForm("ip not detected");
  }
});
