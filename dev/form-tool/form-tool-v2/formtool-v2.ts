import { FormSteps } from './steps';
import { FormSubmission } from './submission';
import { updatePadding, cleanString } from './utils';
import { validateTextInput } from './validation';
import { FileHandler } from './file-handler';

class FormTool {
  private currentScript: HTMLScriptElement;
  private accessKey: string;
  private formName: string;
  private captchaKey: string | null;
  private form: HTMLElement | null;
  private formSteps: FormSteps | null = null;
  private formSubmission: FormSubmission | null = null;
  private sessionId: string;

  constructor() {
    this.currentScript = this.getCurrentScript();
    const scriptSrc = this.currentScript.src;
    const urlParams = new URLSearchParams(scriptSrc.split("?")[1]);

    this.accessKey = urlParams.get("key") ?? "fd821fc7-53b3-4f4c-b3b0-f4adf10491c7";
    this.formName = urlParams.get("form") ?? "Testformular";
    this.captchaKey = urlParams.get("captcha-key");

    this.sessionId = this.generateSessionId();

    console.log("Form Submit v0.2.63");

    this.form = document.querySelector(`[name="${this.formName}"]`);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getCurrentScript(): HTMLScriptElement {
    if (document.currentScript) {
      return document.currentScript as HTMLScriptElement;
    }
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1] as HTMLScriptElement;
  }

  private unwrapElements(): void {
    const elements = document.querySelectorAll('[unwrap="true"]');
    elements.forEach((element) => {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent?.insertBefore(element.firstChild, element);
      }
      parent?.removeChild(element);
    });
  }

  private setupFormFields(): void {
    // Text fields
    document.querySelectorAll(".cmp--tf.cmp").forEach((tf) => {
      updatePadding(tf as HTMLElement);

      const preLabel = tf.querySelector(".lbl--tf-pre");
      if (preLabel) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
              updatePadding(tf as HTMLElement);
            }
          });
        });
        observer.observe(preLabel, { childList: true, characterData: true });
      }

      const parents = tf.querySelectorAll(".cmp--tf-pre.cmp, .cmp--tf-main.cmp, .cmp--tf-suf.cmp");
      parents.forEach((parent) => {
        const input = parent.querySelector("input");
        if (!input) return;
        if (input.placeholder) {
          parent.classList.add("filled");
        }
        parent.addEventListener("click", () => {
          parent.classList.add("focused");
          input.focus();
        });
        input.addEventListener("focus", () => {
          parent.classList.add("focused");
        });
        input.addEventListener("blur", () => {
          if (input.placeholder) {
            parent.classList.add("filled");
          }
          if (input.value === "") {
            parent.classList.remove("focused");
            parent.classList.remove("filled");
          } else {
            parent.classList.add("filled");
          }
          if (!parent.querySelector(".cmp--tf-md.cmp") || tf.querySelector(".cmp--tf-md.cmp.hidden")) {
            if (validateTextInput({ type: input.type, required: input.required, value: input.value, name: input.name, label: input?.labels?.[0]?.textContent ?? "", item: input })) {
              parent.classList.remove("error");
              parent.classList.add("success");
            } else {
              parent.classList.add("error");
              parent.classList.remove("success");
            }
          }
        });
      });
    });

    // Checkboxes
    document.querySelectorAll(".cmp--cb.cmp").forEach((cb) => {
      const input = cb.querySelector("input");
      if (!input) return;
      cb.addEventListener("click", (e) => {
        if (e.target !== input) {
          input.checked = !input.checked;
        }
        if (input.checked) {
          cb.classList.add("checked");
        } else {
          cb.classList.remove("checked");
        }
        this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
          checkbox.dispatchEvent(new Event("change"));
        });
      });
    });

    // Radio buttons
    document.querySelectorAll(".cmp--rb.cmp").forEach((rb) => {
      const input = rb.querySelector("input");
      if (!input) return;
      rb.addEventListener("click", () => {
        console.log("clicked radio button, value: ", input.value);
        this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((rb) => {
          const parent = rb.closest(".cmp--rb.cmp");
          if (parent) {
            parent.classList.remove("checked");
          }
        });
        input.checked = true;
        this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((radioGroupBtn) => {
          radioGroupBtn.dispatchEvent(new Event("change"));
        });
        rb.classList.add("checked");
      });
    });

    // Switches
    document.querySelectorAll(".cmp--sw.cmp").forEach((sw) => {
      const input = sw.querySelector("input");
      if (!input) return;
      sw.addEventListener("click", (e) => {
        if (e.target !== input) {
          input.checked = !input.checked;
        }
        if (input.checked) {
          sw.classList.add("checked");
        } else {
          sw.classList.remove("checked");
        }
        this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((switchBtns) => {
          switchBtns.dispatchEvent(new Event("change"));
        });
      });
    });

    // Checkboxes (ct)
    document.querySelectorAll(".cmp--ct.cmp").forEach((ct) => {
      const input = ct.querySelector("input");
      if (!input) return;
      ct.addEventListener("click", (e) => {
        if (e.target !== input) {
          input.checked = !input.checked;
        }
        if (input.checked) {
          ct.classList.add("checked");
        } else {
          ct.classList.remove("checked");
        }
        this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
          checkbox.dispatchEvent(new Event("change"));
        });
      });
    });

    // Textareas
    document.querySelectorAll(".cmp--ta.cmp").forEach((ta) => {
      const input = ta.querySelector("textarea");
      if (!input) return;
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
        if (validateTextInput({ type: input.type, required: input.required, value: input.value, name: input.name, label: input?.labels?.[0]?.textContent ?? "", item: input })) {
          ta.classList.remove("error");
          ta.classList.add("success");
        } else {
          ta.classList.add("error");
          ta.classList.remove("success");
        }
      });
    });

    // Select / Datepicker
    this.setupSelectAndDatepicker();
    this.setupDragAndDrop();
  }

  private setupSelectAndDatepicker(): void {
    document.querySelectorAll(".cmp--tf-md.cmp").forEach((tf) => {
      let parent = tf.closest(".cmp--tf.cmp");
      if (!parent) return;

      const pre = parent.querySelector(".cmp.cmp--tf-pre");
      const suf = parent.querySelector(".cmp.cmp--tf-suf");
      parent = pre ?? suf ?? parent;
      const input = parent?.querySelector("input") ??
        parent?.querySelector(".lbl--tf-pre.lbl") ??
        parent?.querySelector(".lbl--tf-suf.lbl");

      const options = Array.from(parent?.querySelectorAll(".cmp--tf-md-option.cmp") || []);

      if (!input) return;

      if (options.length === 0 || tf.getAttribute("generate") === "true") {
        if (tf.getAttribute("data-type") === "country-code") {
          this.setupCountryCodePicker(input as HTMLElement, tf as HTMLElement, options);
        } else {
          this.setupDatePicker(input as HTMLElement, parent as HTMLElement);
        }
      } else {
        this.setupOptions(input as HTMLElement, parent as HTMLElement, options);
      }
      parent.addEventListener("click", () => {
        parent.querySelector(".el--tf-md-overlay.el")?.classList.remove("hidden");
        parent.querySelector(".cmp--tf-md.cmp")?.classList.remove("hidden");
      });

      parent.querySelector(".el--tf-md-overlay.el")?.addEventListener("click", (e) => {
        e.stopPropagation();
        parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden");
        parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden");
        input.dispatchEvent(new Event("blur"));
      });
    });
  }

  private setupCountryCodePicker(input: HTMLElement, tf: HTMLElement, existingOptions: Element[]): void {
    const overlay = tf.querySelector(".el--tf-md-overlay.el") as HTMLElement;
    fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json")
      .then((response) => response.json())
      .then((data) => {
        const parent = tf.lastChild?.lastChild as HTMLElement;
        if (!parent) return;

        parent.innerHTML = "";

        const filteredData = data.filter((country: any) => {
          const found = existingOptions.find(
            (option) => option.textContent?.trim() === `${country.emoji} ${country.code} ${country.dial_code}`
          );
          return !found;
        });

        let options = existingOptions.map((option) => ({
          item: option,
          seperator: false,
        }));

        if (options.length > 0) {
          const seperator = document.createElement("div");
          seperator.className = "el--tf-md-sep el";
          options.push({
            item: seperator,
            seperator: true,
          });
        }

        options = options.concat(
          filteredData.map((country: any) => {
            const option = document.createElement("div");
            option.className = "cmp--tf-md-option cmp";
            option.innerHTML = `
              <div class="lyt--tf-md-option lyt">
                <div class="wr_ico--tf-md-option wr_ico">
                ${country.emoji}
                </div>
                <div class="wr_lbl--tf-md-option wr_lbl">
                  <label class="lbl--tf-md-option lbl"> ${country.code} ${country.dial_code}</label>
                </div>
              </div>
            `;
            return {
              item: option,
              seperator: false,
            };
          })
        );

        options.forEach((option) => {
          if (option.seperator) {
            parent.appendChild(option.item);
            return;
          }
          option.item.addEventListener("click", (e) => {
            e.stopPropagation();
            const text = cleanString(option.item.textContent || "");
            (input as HTMLInputElement).value = text;
            input.innerHTML = text;
            parent.classList.add("filled");
            overlay?.classList.add("hidden");
            tf.classList.add("hidden");
            parent.classList.add("success");
            parent.classList.remove("error");
            options.forEach((option) => {
              option.item.classList.remove("hidden");
              option.item.classList.remove("checked");
            });
            option.item.classList.add("checked");
            input.dispatchEvent(new Event("blur"));
          });
          parent.appendChild(option.item);
        });

        parent.addEventListener("click", () => {
          overlay?.classList.remove("hidden");
          tf.classList.remove("hidden");
        });

        overlay?.addEventListener("click", (e) => {
          e.stopPropagation();
          overlay.classList.add("hidden");
          tf.classList.add("hidden");
          input.dispatchEvent(new Event("blur"));
        });
      });
  }

  private setupDatePicker(input: HTMLElement, parent: HTMLElement): void {
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

    const getDaysInMonth = (month: number, year: number): number => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number): number => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1;
    };

    input.addEventListener("input", (e: Event) => {
      e.stopPropagation();
      (input as HTMLInputElement).value = "";
    });

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let selectedDay = "";
    if ((input as HTMLInputElement).value) {
      const [day, month, year] = (input as HTMLInputElement).value.split(".");
      currentYear = parseInt(year);
      currentMonth = parseInt(month) - 1;
      selectedDay = `${day}-${months[currentMonth].short}-${currentYear}`;
    }

    let currentView = "dp";

    const getNumberDisplay = (number: number): string => {
      return number < 10 ? "0" + number : number.toString();
    };

    const updateCalendar = (): void => {
      const dayPickerCmp = parent.querySelector(".cmp--dp.cmp");
      if (!dayPickerCmp) return;
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
          dayElement.innerHTML = `<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${daysInPrevMonth - (firstDay - i - 1)
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
          dayElement.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            selectedDay = `${(e.target as HTMLElement).innerText.trim()}-${months[currentMonth].short}-${currentYear}`;
            updateCalendar();
            (input as HTMLInputElement).value = `${(e.target as HTMLElement).innerText.trim()}.${getNumberDisplay(
              months[currentMonth].index + 1
            )}.${currentYear}`;
            parent.classList.add("filled");
            parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden");
            parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden");
            input.dispatchEvent(new Event("blur"));
          });
          day++;
        }

        dayPicker.appendChild(dayElement);
      }

      const navBtn = parent.querySelector(".cmp--dtp-nav-btn p");
      if (navBtn) {
        navBtn.textContent = `${months[currentMonth].long} ${currentYear}`;
      }
    };

    const updateMonthPicker = (): void => {
      const monthPickerCmp = parent.querySelector(".cmp--mp.cmp");
      if (!monthPickerCmp) return;
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

    const updateYearPicker = (): void => {
      const yearPickerCmp = parent.querySelector(".cmp--yp.cmp");
      if (!yearPickerCmp) return;
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

    const switchView = (): void => {
      const dayPickerCmp = parent.querySelector(".cmp--dp.cmp");
      const monthPickerCmp = parent.querySelector(".cmp--mp.cmp");
      const yearPickerCmp = parent.querySelector(".cmp--yp.cmp");

      if (!dayPickerCmp || !monthPickerCmp || !yearPickerCmp) return;

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

      const navBtn = parent.querySelector(".cmp--dtp-nav-btn p");
      if (navBtn) {
        navBtn.textContent = `${months[currentMonth].long} ${currentYear}`;
      }
    };

    const dtpCmp = parent.querySelector(".cmp--dtp.cmp");
    if (!dtpCmp) return;
    dtpCmp.innerHTML = `
      <div class="lyt--dtp lyt"></div>
      <div class="cmp--dp cmp hidden"></div>
      <div class="cmp--mp cmp hidden"></div>
      <div class="cmp--yp cmp hidden"></div>
    `;

    const container = parent.querySelector(".lyt--dtp.lyt");
    if (!container) return;

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

    const handlePrev = (): void => {
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

    const handleNext = (): void => {
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

    const prevBtn = parent.querySelector(".cmp--dtp-nav-prevnext.prev");
    const nextBtn = parent.querySelector(".cmp--dtp-nav-prevnext.next");
    const navBtn = parent.querySelector(".cmp--dtp-nav-btn.cmp");

    if (prevBtn) {
      prevBtn.addEventListener("click", handlePrev);
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", handleNext);
    }
    if (navBtn) {
      navBtn.addEventListener("click", () => {
        if (currentView === "dp") currentView = "mp";
        else if (currentView === "mp") currentView = "yp";
        else if (currentView === "yp") currentView = "mp";
        switchView();
      });
    }

    currentView = "dp";
    switchView();
  }

  private setupOptions(input: HTMLElement, parent: HTMLElement, options: Element[]): void {
    options.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        (input as HTMLInputElement).value = option.textContent?.trim() || "";
        parent.classList.add("filled");
        parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden");
        parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden");
        parent.classList.add("success");
        parent.classList.remove("error");
        options.forEach((option) => {
          option.classList.remove("hidden");
          option.classList.remove("checked");
        });
        input.dispatchEvent(new Event("blur"));
        option.classList.add("checked");
      });
    });

    input.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value.toLowerCase();
      const found = options.find((option) => option.textContent?.trim().toLowerCase() === value);

      options.forEach((option) => {
        if (option.textContent?.trim().toLowerCase().includes(value) || found) {
          option.classList.remove("hidden");
        } else {
          option.classList.add("hidden");
        }
      });
    });
  }

  private setupDragAndDrop(): void {
    const parent = this.form?.querySelector('.cmp--fu.cmp');

    if (!parent) return;

    const dragDropElement = parent.querySelector('.cmp--fu-drag.cmp');
    const input = parent.querySelector('input') as HTMLInputElement;
    const uploadsContainer = parent.querySelector('.lyt--fu-uploads.lyt');

    if (!dragDropElement || !input || !uploadsContainer) return;

    // Create error message element
    const errorMessageElement = document.createElement('div');
    errorMessageElement.className = 'cmp--fu-error-message';
    errorMessageElement.style.color = 'red';
    errorMessageElement.style.marginTop = '8px';
    errorMessageElement.style.display = 'none';
    parent.appendChild(errorMessageElement);

    // Create info message element
    const infoMessageElement = document.createElement('div');
    infoMessageElement.className = 'cmp--fu-info-message';
    infoMessageElement.style.color = '#666';
    infoMessageElement.style.marginTop = '8px';
    infoMessageElement.style.fontSize = '14px';
    infoMessageElement.textContent = 'Maximum 5 files (5MB each)';
    parent.appendChild(infoMessageElement);

    // Create upload status element for visual feedback
    const uploadStatusElement = document.createElement('div');
    uploadStatusElement.className = 'cmp--fu-upload-status';
    uploadStatusElement.style.marginTop = '8px';
    uploadStatusElement.style.display = 'none';
    parent.appendChild(uploadStatusElement);

    const showError = (message: string) => {
      errorMessageElement.textContent = message;
      errorMessageElement.style.display = 'block';
      setTimeout(() => {
        errorMessageElement.style.display = 'none';
      }, 5000); // Hide the error message after 5 seconds
    };

    const updateFilePreviews = (files: FileList) => {
      if (!files || files.length === 0) {
        uploadsContainer.parentElement?.classList.add('hidden');
        return;
      }

      uploadsContainer.parentElement?.classList.remove('hidden');
      uploadsContainer.innerHTML = '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadElement = document.createElement('div');
        uploadElement.className = 'cmp--fu-upload cmp';
        uploadElement.innerHTML = `
          <div class="lyt--fu-upload lyt">
            ${file.type.startsWith('image/')
            ? `<div class="cmp--fu-upload-preview cmp">
                  <div class="lyt--fu-upload-preview lyt">
                    <div class="wr_img--fu-upload-preview wr_img">
                      <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
                    </div>
                  </div>
                </div>`
            : `<div class="cmp--fu-upload-name cmp">
                  <div class="lyt--fu-upload-name lyt">
                    <div class="wr_p--fu-upload-name wr_p">
                      <p class="p--m">${file.name}</p>
                    </div>
                  </div>
                </div>`
          }
            <div class="cmp--fu-upload-delete cmp">
              <div class="lyt--fu-upload-delete lyt">
                <div class="wr_ico--fu-upload-delete wr_ico">
                  <div class="ico--fu-upload-delete w-embed">
                    <svg viewBox="0 0 9 9" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.57684 8.9231L8.93713 7.56274L5.86017 4.48853L8.93713 1.41797L7.57812 0.0563965L4.49994 3.12939L1.42303 0.0539551L0.0627441 1.41406L3.13843 4.48853L0.0627441 7.55908L1.42175 8.91919L4.49866 5.84741L7.57684 8.9231Z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        // Add delete functionality
        const deleteButton = uploadElement.querySelector('.cmp--fu-upload-delete.cmp');
        if (deleteButton) {
          deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            fileHandler.removeFile(i);
          });
        }

        uploadsContainer.appendChild(uploadElement);
      }

      // Update the remaining files count info
      const remainingFiles = fileHandler.getMaxFileCount() - fileHandler.getFileCount();
      if (remainingFiles === 0) {
        infoMessageElement.textContent = 'Maximum number of files reached (5)';
        infoMessageElement.style.color = '#ff9900';
      } else {
        infoMessageElement.textContent = `Maximum 5 files (5MB each) - ${remainingFiles} remaining`;
        infoMessageElement.style.color = '#666';
      }
    };

    // Create the file handler instance with access key and session ID
    const fileHandler = new FileHandler(
      input,
      updateFilePreviews,
      this.accessKey,
      this.sessionId,
    );

    // Provide a method to update the sessionId if needed later
    window.addEventListener('formtool:session-updated', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.sessionId) {
        fileHandler.setSessionId(detail.sessionId);
      }
    });

    // Add click handler to open file input
    parent.addEventListener('click', (e) => {
      // Don't trigger the file dialog if we're at the maximum file count
      if (fileHandler.isFileLimitReached()) {
        showError('Maximum number of files (5) already reached. Please remove a file first.');
        e.stopPropagation();
        return;
      }

      // Don't open file dialog if clicking on a delete button or an existing file
      if (e.target !== parent &&
        !parent.contains(e.target as Node) ||
        (e.target as HTMLElement).closest('.cmp--fu-upload')) {
        return;
      }

      input.click();
    });

    // Handle file input change
    input.addEventListener('change', (e) => {
      const fileInput = e.target as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
        const success = fileHandler.addFiles(fileInput.files);
        if (!success) {
          dragDropElement.classList.add('error');

          // Check if any file is over the size limit
          const maxSize = fileHandler.getMaxFileSize();
          let oversizedFiles = [];

          for (let i = 0; i < fileInput.files.length; i++) {
            if (fileInput.files[i].size > maxSize) {
              oversizedFiles.push(fileInput.files[i].name);
            }
          }

          if (oversizedFiles.length > 0) {
            const message = oversizedFiles.length === 1
              ? `File "${oversizedFiles[0]}" exceeds the maximum size of 5MB.`
              : `${oversizedFiles.length} files exceed the maximum size of 5MB.`;
            showError(message);
          } else if (fileHandler.getFileCount() + fileInput.files.length > fileHandler.getMaxFileCount()) {
            showError(`Cannot add ${fileInput.files.length} files. You can only upload a maximum of 5 files.`);
          } else {
            showError('File type not allowed.');
          }
        } else {
          dragDropElement.classList.remove('error');
          errorMessageElement.style.display = 'none';
        }
      }
    });

    document.body.addEventListener('dragover', (e) => {
      e.preventDefault();

      // If at max files, show a different cursor and class
      if (fileHandler.isFileLimitReached()) {
        (e.dataTransfer as DataTransfer).dropEffect = 'none';
        dragDropElement.classList.add('max-reached');
      } else {
        (e.dataTransfer as DataTransfer).dropEffect = 'copy';
        dragDropElement.classList.remove('max-reached');
      }

      dragDropElement.classList.add('dragging');
      dragDropElement.classList.remove('hidden');
    });

    document.body.addEventListener('dragleave', (e) => {
      e.preventDefault();
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (dragDropElement.contains(relatedTarget)) {
        return;
      }
      dragDropElement.classList.remove('dragging');
      dragDropElement.classList.add('hidden');
    });

    document.body.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropElement.classList.remove('dragging');
      dragDropElement.classList.add('hidden');

      // Don't process the drop if we're at max files
      if (fileHandler.isFileLimitReached()) {
        showError('Maximum number of files (5) already reached. Please remove a file first.');
        return;
      }

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const success = fileHandler.addFiles(e.dataTransfer.files);
        if (!success) {
          dragDropElement.classList.add('error');

          // Check if any file is over the size limit
          const maxSize = fileHandler.getMaxFileSize();
          let oversizedFiles = [];

          for (let i = 0; i < e.dataTransfer.files.length; i++) {
            if (e.dataTransfer.files[i].size > maxSize) {
              oversizedFiles.push(e.dataTransfer.files[i].name);
            }
          }

          if (oversizedFiles.length > 0) {
            const message = oversizedFiles.length === 1
              ? `File "${oversizedFiles[0]}" exceeds the maximum size of 5MB.`
              : `${oversizedFiles.length} files exceed the maximum size of 5MB.`;
            showError(message);
          } else if (fileHandler.getFileCount() + e.dataTransfer.files.length > fileHandler.getMaxFileCount()) {
            showError(`Cannot add ${e.dataTransfer.files.length} files. You can only upload a maximum of 5 files.`);
          } else {
            showError('File type not allowed.');
          }
        } else {
          dragDropElement.classList.remove('error');
          errorMessageElement.style.display = 'none';
        }
      }
    });

    // Add some CSS for the max-reached state
    const style = document.createElement('style');
    style.textContent = `
      .cmp--fu-drag.max-reached {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  public init(): void {
    if (!this.form) return;

    this.unwrapElements();
    this.setupFormFields();

    if (this.form.querySelector(".cmp--form-steps.cmp")) {
      this.formSteps = new FormSteps(this.form, this.accessKey);
      this.formSteps.init();
      this.formSteps.addEventListeners();
    }

    this.formSubmission = new FormSubmission(this.form, this.accessKey, this.captchaKey);
    const submitButton = this.form.querySelector(".wr_btn--form-control-submit.wr_btn");
    if (submitButton) {
      submitButton.addEventListener("click", (e) => this.formSubmission?.handleSubmit(e, this.sessionId));
    }
  }
}

// Initialize the form tool
const formTool = new FormTool();
formTool.init(); 