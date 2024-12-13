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
