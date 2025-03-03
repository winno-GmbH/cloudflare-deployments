/**
 * Form Tool v2
 * Compiled on 2025-03-03T14:46:05.783Z
 */
(function() {
// Define a global object to store exported values
window.FormToolV2 = window.FormToolV2 || {};


// Source: fields.js
function getFields(parent) {
    const fields = [];
    const elements = Array.from(parent.querySelectorAll("input, textarea")).filter((el) => !el.closest('[condition-active="false"]'));
    elements.forEach((field) => {
        const type = field.getAttribute("type");
        const required = field.required;
        const value = field.value;
        const customValidatorRegex = field.getAttribute("data-validator");
        const name = field.getAttribute("name") || "";
        const label = field.closest(".cmp--form-item.cmp")?.querySelector(".lbl")?.innerText || "";
        if (type === "radio" || type === "checkbox") {
            fields.push({
                type,
                required,
                name,
                item: field,
                value: field.closest(".cmp")?.querySelector(".lbl")?.innerText || "",
                checked: field.checked,
                variable: field.getAttribute("data-variable") || undefined,
                customValidatorRegex: customValidatorRegex || undefined,
                label,
            });
        }
        else {
            fields.push({
                type: type || null,
                required,
                value,
                customValidatorRegex: customValidatorRegex || undefined,
                item: field,
                name,
                label,
                variable: field.getAttribute("data-variable") || undefined,
            });
        }
    });
    return fields;
}
function convertFieldsToFormData(fields) {
    const allFields = [];
    fields.forEach((field) => {
        const req = {
            type: field.type,
            value: field.value,
            label: field.label,
            name: field.name,
            required: field.required,
            item: field.item,
        };
        if (field.variable) {
            req.variable = field.variable;
        }
        if (field.type === "radio" || field.type === "checkbox") {
            if (field.checked) {
                const existingField = allFields.find((f) => f.label === field.label);
                if (existingField) {
                    existingField.value = `${existingField.value}, ${field.value}`;
                }
                else {
                    allFields.push(req);
                }
            }
        }
        else {
            allFields.push(req);
        }
    });
    return allFields;
}
function convertFormDataToFields(formData, form) {
    let lastStepName = "";
    formData.categories.forEach((category) => {
        const formStepParent = form.querySelector(`[name="${category.name}"]`);
        if (!formStepParent)
            return;
        category.form.forEach((field) => {
            const labelEl = getElementByXpathWithIndex(`//label[text()="${field.label}"]`, formStepParent, 0);
            if (!labelEl || field.value === "")
                return;
            lastStepName = category.name;
            if (field.type === null) {
                const parent = labelEl.closest(".cmp--ta.cmp");
                const input = parent?.querySelector("textarea");
                if (input) {
                    input.value = field.value;
                    parent?.classList.add("filled");
                }
            }
            else if (field.type === "checkbox") {
                const parent = labelEl.closest(".cmp--form-item.cmp");
                const selectedItems = field.value.split(", ");
                selectedItems.forEach((item) => {
                    const inputLabel = getElementByXpathWithIndex(`//label[text()="${item}"]`, parent, 0);
                    const inputParent = inputLabel?.closest(".cmp--cb.cmp");
                    const input = inputParent?.querySelector("input");
                    if (input) {
                        input.checked = true;
                        inputParent?.classList.add("checked");
                        input.dispatchEvent(new Event("change"));
                    }
                });
            }
            else if (field.type === "radio") {
                const parent = labelEl.closest(".cmp--form-item.cmp");
                const inputLabel = getElementByXpathWithIndex(`//label[text()="${field.value}"]`, parent, 0);
                const inputParent = inputLabel?.closest(".cmp--rb.cmp");
                const input = inputParent?.querySelector("input");
                if (input) {
                    input.checked = true;
                    inputParent?.classList.add("checked");
                    input.dispatchEvent(new Event("change"));
                }
            }
            else {
                const parent = labelEl.closest(".cmp--tf.cmp");
                const input = parent?.querySelector("input");
                if (input) {
                    input.value = field.value;
                    parent?.classList.add("filled");
                }
            }
        });
    });
    return lastStepName;
}
function getElementByXpathWithIndex(xpath, parent, index) {
    const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let elements = [];
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
        elements.push(xpathResult.snapshotItem(i));
    }
    const descendantElements = elements.filter((element) => parent.contains(element));
    return descendantElements[index] || null;
}


// Source: formtool-v2.js




class FormTool {
    constructor() {
        this.formSteps = null;
        this.formSubmission = null;
        this.currentScript = this.getCurrentScript();
        const scriptSrc = this.currentScript.src;
        const urlParams = new URLSearchParams(scriptSrc.split("?")[1]);
        this.accessKey = urlParams.get("key") ?? "fd821fc7-53b3-4f4c-b3b0-f4adf10491c7";
        this.formName = urlParams.get("form") ?? "Testformular";
        this.captchaKey = urlParams.get("captcha-key");
        console.log("Form Submit v0.2.6");
        this.form = document.querySelector(`[name="${this.formName}"]`);
    }
    getCurrentScript() {
        if (document.currentScript) {
            return document.currentScript;
        }
        const scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
    }
    unwrapElements() {
        const elements = document.querySelectorAll('[unwrap="true"]');
        elements.forEach((element) => {
            const parent = element.parentNode;
            while (element.firstChild) {
                parent?.insertBefore(element.firstChild, element);
            }
            parent?.removeChild(element);
        });
    }
    setupFormFields() {
        document.querySelectorAll(".cmp--tf.cmp").forEach((tf) => {
            updatePadding(tf);
            const preLabel = tf.querySelector(".lbl--tf-pre");
            if (preLabel) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === "childList" || mutation.type === "characterData") {
                            updatePadding(tf);
                        }
                    });
                });
                observer.observe(preLabel, { childList: true, characterData: true });
            }
            const parents = tf.querySelectorAll(".cmp--tf-pre.cmp, .cmp--tf-main.cmp, .cmp--tf-suf.cmp");
            parents.forEach((parent) => {
                const input = parent.querySelector("input");
                if (!input)
                    return;
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
                    }
                    else {
                        parent.classList.add("filled");
                    }
                    if (!parent.querySelector(".cmp--tf-md.cmp") || tf.querySelector(".cmp--tf-md.cmp.hidden")) {
                        if (validateTextInput({ type: input.type, required: input.required, value: input.value, name: input.name, label: input?.labels?.[0]?.textContent ?? "", item: input })) {
                            parent.classList.remove("error");
                            parent.classList.add("success");
                        }
                        else {
                            parent.classList.add("error");
                            parent.classList.remove("success");
                        }
                    }
                });
            });
        });
        document.querySelectorAll(".cmp--cb.cmp").forEach((cb) => {
            const input = cb.querySelector("input");
            if (!input)
                return;
            cb.addEventListener("click", (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                if (input.checked) {
                    cb.classList.add("checked");
                }
                else {
                    cb.classList.remove("checked");
                }
                this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
                    checkbox.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--rb.cmp").forEach((rb) => {
            const input = rb.querySelector("input");
            if (!input)
                return;
            rb.addEventListener("click", () => {
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
        document.querySelectorAll(".cmp--sw.cmp").forEach((sw) => {
            const input = sw.querySelector("input");
            if (!input)
                return;
            sw.addEventListener("click", (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                if (input.checked) {
                    sw.classList.add("checked");
                }
                else {
                    sw.classList.remove("checked");
                }
                this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((switchBtns) => {
                    switchBtns.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--ct.cmp").forEach((ct) => {
            const input = ct.querySelector("input");
            if (!input)
                return;
            ct.addEventListener("click", (e) => {
                if (e.target !== input) {
                    input.checked = !input.checked;
                }
                if (input.checked) {
                    ct.classList.add("checked");
                }
                else {
                    ct.classList.remove("checked");
                }
                this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox) => {
                    checkbox.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--ta.cmp").forEach((ta) => {
            const input = ta.querySelector("textarea");
            if (!input)
                return;
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
                }
                else {
                    ta.classList.add("filled");
                }
                if (validateTextInput({ type: input.type, required: input.required, value: input.value, name: input.name, label: input?.labels?.[0]?.textContent ?? "", item: input })) {
                    ta.classList.remove("error");
                    ta.classList.add("success");
                }
                else {
                    ta.classList.add("error");
                    ta.classList.remove("success");
                }
            });
        });
        this.setupSelectAndDatepicker();
    }
    setupSelectAndDatepicker() {
        document.querySelectorAll(".cmp--tf-md.cmp").forEach((tf) => {
            let parent = tf.closest(".cmp--tf.cmp");
            const overlay = parent?.querySelector(".el--tf-md-overlay.el");
            parent = tf.closest(".cmp.cmp--tf-pre") ?? tf.closest(".cmp.cmp--tf-suf") ?? parent;
            const input = parent?.querySelector("input") ??
                parent?.querySelector(".lbl--tf-pre.lbl") ??
                parent?.querySelector(".lbl--tf-suf.lbl");
            const options = Array.from(parent?.querySelectorAll(".cmp--tf-md-option.cmp") || []);
            if (options.length === 0 || tf.getAttribute("generate") === "true") {
                if (tf.getAttribute("data-type") === "country-code") {
                    this.setupCountryCodePicker(input, tf, options);
                }
                else {
                    this.setupDatePicker(input, parent);
                }
            }
            else {
                this.setupOptions(input, parent, options);
            }
        });
    }
    setupCountryCodePicker(input, tf, existingOptions) {
        const overlay = tf.querySelector(".el--tf-md-overlay.el");
        fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json")
            .then((response) => response.json())
            .then((data) => {
            const parent = tf.lastChild?.lastChild;
            if (!parent)
                return;
            parent.innerHTML = "";
            const filteredData = data.filter((country) => {
                const found = existingOptions.find((option) => option.textContent?.trim() === `${country.emoji} ${country.code} ${country.dial_code}`);
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
            options = options.concat(filteredData.map((country) => {
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
            }));
            options.forEach((option) => {
                if (option.seperator) {
                    parent.appendChild(option.item);
                    return;
                }
                option.item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const text = cleanString(option.item.textContent || "");
                    input.value = text;
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
    setupDatePicker(input, parent) {
    }
    setupOptions(input, parent, options) {
        options.forEach((option) => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();
                input.value = option.textContent?.trim() || "";
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
            const value = e.target.value.toLowerCase();
            const found = options.find((option) => option.textContent?.trim().toLowerCase() === value);
            options.forEach((option) => {
                if (option.textContent?.trim().toLowerCase().includes(value) || found) {
                    option.classList.remove("hidden");
                }
                else {
                    option.classList.add("hidden");
                }
            });
        });
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
    }
    init() {
        if (!this.form)
            return;
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
            submitButton.addEventListener("click", (e) => this.formSubmission?.handleSubmit(e));
        }
    }
}
const formTool = new FormTool();
formTool.init();


// Source: steps.js


class FormSteps {
    constructor(form, accessKey) {
        this.currentStep = 0;
        this.formStepPairs = [];
        this.form = form;
        this.accessKey = accessKey;
        this.nextStepButton = form.querySelector(".wr_btn--form-control-next.wr_btn");
        this.previousStepButton = form.querySelector(".wr_btn--form-control-prev.wr_btn");
        this.submitButton = form.querySelector(".wr_btn--form-control-submit.wr_btn");
    }
    setStepsActivity() {
        if (!this.previousStepButton || !this.submitButton || !this.nextStepButton)
            return;
        this.previousStepButton.classList.add("hidden");
        this.submitButton.classList.add("hidden");
        this.nextStepButton.classList.remove("hidden");
        let lastActiveIndex = 0;
        this.formStepPairs.forEach((formStep, index) => {
            formStep.formStepNumber.classList.remove("completed");
            formStep.formStepNumber.classList.remove("active");
            formStep.formStepNumber.classList.remove("locked");
            if (formStep.id !== "" && formStep.formStep.getAttribute("condition-active") !== "true") {
                formStep.formStepNumber.classList.add("hidden");
            }
            else {
                formStep.formStepNumber.classList.remove("hidden");
                const stepNumber = formStep.formStepNumber.querySelector(".p--form-step-nr");
                if (stepNumber) {
                    stepNumber.textContent = (lastActiveIndex + 1).toString();
                }
                lastActiveIndex++;
            }
            if (index === this.currentStep) {
                formStep.formStepNumber.classList.add("active");
                formStep.formStep.classList.remove("hidden");
            }
            else {
                formStep.formStepNumber.classList.remove("locked");
                formStep.formStep.classList.add("hidden");
                if (index < this.currentStep) {
                    formStep.formStepNumber.classList.add("completed");
                }
                else {
                    formStep.formStepNumber.classList.add("locked");
                }
            }
        });
        if (this.currentStep > 0) {
            this.previousStepButton.classList.remove("hidden");
        }
        if (this.currentStep === this.formStepPairs.length - 1) {
            this.nextStepButton.classList.add("hidden");
            this.submitButton.classList.remove("hidden");
        }
        else {
            const currentStepNumber = this.formStepPairs[this.currentStep].formStepNumber.querySelector(".p--form-step-nr");
            if (currentStepNumber && lastActiveIndex === parseInt(currentStepNumber.textContent || "0")) {
                this.nextStepButton.classList.add("hidden");
                this.submitButton.classList.remove("hidden");
            }
        }
    }
    init() {
        const formSteps = this.form.querySelectorAll(".cmp--form.cmp");
        const formStepNumbers = this.form.querySelectorAll(".cmp--form-step.cmp");
        formSteps.forEach((formStep, index) => {
            this.formStepPairs.push({
                formStep: formStep,
                formStepNumber: formStepNumbers[index],
                name: formStep.getAttribute("name") || "",
                id: formStep.getAttribute("id") || "",
            });
            formStep.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((input) => {
                if (input.getAttribute("conditional-step")) {
                    input.addEventListener("change", (e) => {
                        const conditionalSteps = e.target.getAttribute("conditional-step")?.replace(" ", "").split(",") || [];
                        this.formStepPairs.forEach((formStep) => {
                            if (e.target.checked) {
                                if (conditionalSteps.includes(formStep.id)) {
                                    formStep.formStepNumber.classList.remove("hidden");
                                    formStep.formStep.setAttribute("condition-active", "true");
                                }
                            }
                            else {
                                if (conditionalSteps.includes(formStep.id)) {
                                    formStep.formStepNumber.classList.add("hidden");
                                    formStep.formStep.setAttribute("condition-active", "false");
                                }
                            }
                        });
                        this.setStepsActivity();
                    });
                }
            });
        });
        this.setStepsActivity();
        if (localStorage.getItem("form-save-id")) {
            this.loadSavedForm();
        }
    }
    async loadSavedForm() {
        try {
            const response = await fetch(`https://gecko-form-tool-be-new.vercel.app/api/forms/save-step/${localStorage.getItem("form-save-id")}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (data.data) {
                const formData = JSON.parse(data.data);
                const lastStepName = convertFormDataToFields(formData, this.form);
                this.setStepsActivity();
                this.setCurrentStep(lastStepName);
            }
        }
        catch (error) {
            console.error("Error loading saved form:", error);
        }
    }
    setCurrentStep(stepName) {
        this.formStepPairs.forEach((formStep, index) => {
            if (formStep.name === stepName) {
                this.currentStep = index;
            }
        });
        this.setStepsActivity();
    }
    async nextStep() {
        const fields = getFields(this.formStepPairs[this.currentStep].formStep);
        const isValid = validateFields(fields, this.form);
        if (!isValid)
            return;
        for (let i = this.currentStep + 1; i < this.formStepPairs.length; i++) {
            if (!this.formStepPairs[i].formStepNumber.classList.contains("hidden")) {
                this.currentStep = i;
                break;
            }
        }
        this.setStepsActivity();
        const categories = [];
        this.formStepPairs.forEach((formStep) => {
            if (!(formStep.id !== "" && formStep.formStep.getAttribute("condition-active") !== "true")) {
                const fields = convertFieldsToFormData(getFields(formStep.formStep));
                categories.push({
                    name: formStep.name,
                    form: fields,
                });
            }
        });
        try {
            const response = await fetch("https://gecko-form-tool-be-new.vercel.app/api/forms/save-step", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: localStorage.getItem("form-save-id") || undefined,
                    data: {
                        categories: categories,
                    },
                    token: this.accessKey,
                }),
            });
            const data = await response.json();
            if (data.id) {
                localStorage.setItem("form-save-id", data.id);
            }
        }
        catch (error) {
            console.error("Error saving form step:", error);
        }
    }
    previousStep() {
        for (let i = this.currentStep - 1; i >= 0; i--) {
            if (!this.formStepPairs[i].formStepNumber.classList.contains("hidden")) {
                this.currentStep = i;
                break;
            }
        }
        this.setStepsActivity();
    }
    addEventListeners() {
        if (this.nextStepButton) {
            this.nextStepButton.addEventListener("click", () => this.nextStep());
        }
        if (this.previousStepButton) {
            this.previousStepButton.addEventListener("click", () => this.previousStep());
        }
    }
}


// Source: submission.js



class FormSubmission {
    constructor(form, accessKey, captchaKey) {
        this.serverUrl = "https://gecko-form-tool-be-new.vercel.app/api/forms/submit";
        this.form = form;
        this.accessKey = accessKey;
        this.captchaKey = captchaKey;
    }
    getGoogleAdsData() {
        return {
            keyword: getCookie("keyword") || undefined,
            campaign: getCookie("campaignid") || undefined,
            location: getCookie("loc_physical_ms") || undefined,
            adGroupID: getCookie("adgroupid") || undefined,
            feedItemID: getCookie("feeditemid") || undefined,
            extensionID: getCookie("extensionid") || undefined,
            targetID: getCookie("targetid") || undefined,
            locInterestMS: getCookie("loc_interest_ms") || undefined,
            matchType: getCookie("matchtype") || undefined,
            network: getCookie("network") || undefined,
            device: getCookie("device") || undefined,
            deviceModel: getCookie("devicemodel") || undefined,
            gclid: getCookie("gclid") || undefined,
            creative: getCookie("creative") || undefined,
            placement: getCookie("placement") || undefined,
            target: getCookie("target") || undefined,
            adPosition: getCookie("adposition") || undefined,
        };
    }
    getMetaAdsData() {
        return {
            ad_id: getCookie("fb_ad_id") || undefined,
            adset_id: getCookie("fb_adset_id") || undefined,
            campaign_id: getCookie("fb_campaign_id") || undefined,
            placement: getCookie("fb_placement") || undefined,
            site_source_name: getCookie("fb_site_source_name") || undefined,
            creative_id: getCookie("fb_creative_id") || undefined,
            product_id: getCookie("fb_product_id") || undefined,
            product_group_id: getCookie("fb_product_group_id") || undefined,
            product_category: getCookie("fb_product_category") || undefined,
            source: getCookie("fb_source") || undefined,
            publisher_platform: getCookie("fb_publisher_platform") || undefined,
            platform_position: getCookie("fb_platform_position") || undefined,
            region: getCookie("fb_region") || undefined,
            device_type: getCookie("fb_device_type") || undefined,
            targeting: getCookie("fb_targeting") || undefined,
            ad_format: getCookie("fb_ad_format") || undefined,
            click_id: getCookie("fb_click_id") || undefined,
            ad_name: getCookie("fb_ad_name") || undefined,
            campaign_name: getCookie("fb_campaign_name") || undefined,
            adset_name: getCookie("fb_adset_name") || undefined,
        };
    }
    async submitForm(request) {
        try {
            const response = await fetch(this.serverUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            this.handleSuccess(data);
        }
        catch (error) {
            console.error("Error during sending data:", error);
        }
    }
    handleSuccess(data) {
        if (typeof window.gtag_report_conversion !== "undefined") {
            window.gtag_report_conversion();
        }
        if (typeof window.dataLayer !== "undefined") {
            window.dataLayer.push({
                event: "form_conversion",
            });
        }
        const buttonWrapper = this.form.querySelector(".wr_btn--form-control-submit.wr_btn");
        if (buttonWrapper) {
            const targetLink = buttonWrapper.getAttribute("target-link");
            if (targetLink) {
                window.location.href = targetLink;
            }
        }
        this.form.querySelector(".cmp--form-steps.cmp")?.classList.add("hidden");
        const formSteps = this.form.querySelectorAll(".cmp--form.cmp");
        formSteps.forEach((formStep) => {
            if (Array.from(formStep.classList).includes("cmp--form")) {
                formStep.classList.add("hidden");
            }
            else {
                formStep.querySelector(".cmp--form.cmp")?.classList.add("hidden");
            }
        });
        this.form.querySelector(".cmp--btn-group.cmp")?.classList.add("hidden");
        const success = this.form.querySelector(".cmp--form-success.cmp");
        if (success) {
            success.classList.remove("hidden");
            success.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }
    async handleSubmit(e) {
        const fields = getFields(this.form);
        const isValid = validateFields(fields, this.form);
        if (!isValid)
            return;
        const categories = [];
        const formSteps = this.form.querySelectorAll(".cmp--form.cmp");
        formSteps.forEach((formStep) => {
            if (!(formStep.getAttribute("id") !== "" && formStep.getAttribute("condition-active") !== "true")) {
                const fields = convertFieldsToFormData(getFields(formStep));
                categories.push({
                    name: formStep.getAttribute("name") || "",
                    form: fields,
                });
            }
        });
        try {
            window.fbq("track", "Lead");
        }
        catch (error) {
        }
        const request = {
            formData: {
                categories: categories,
            },
            test: this.accessKey,
            token: this.captchaKey || undefined,
            id: localStorage.getItem("form-save-id") || undefined,
            googleAds: this.getGoogleAdsData(),
            metaAds: this.getMetaAdsData(),
        };
        const buttonWrapper = e.target.closest(".wr_btn--form-control-submit.wr_btn");
        if (!buttonWrapper)
            return;
        buttonWrapper.classList.add("pending");
        buttonWrapper.setAttribute("disabled", "true");
        const buttonText = buttonWrapper.getAttribute("pending-text") || "Loading...";
        e.target.textContent = buttonText;
        await this.submitForm(request);
    }
}


// Source: types.js



// Source: utils.js
function cleanString(input) {
    return input
        .replace(/\s+/g, " ")
        .trim();
}
function findParentWithClass(element, classNames) {
    let current = element;
    while (current && current.classList) {
        if (classNames.some((className) => current?.classList.contains(className))) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
function getContainerType(element) {
    if (element.classList.contains("cmp--tf-pre"))
        return "pre";
    if (element.classList.contains("cmp--tf-main"))
        return "main";
    if (element.classList.contains("cmp--tf-suf"))
        return "suf";
    return "";
}
function getElementByXpathWithIndex(xpath, parent, index) {
    const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let elements = [];
    for (let i = 0; i < xpathResult.snapshotLength; i++) {
        elements.push(xpathResult.snapshotItem(i));
    }
    const descendantElements = elements.filter((element) => parent.contains(element));
    return descendantElements[index] || null;
}
function getCookie(name) {
    const cookieArray = document.cookie.split("; ");
    for (let i = 0; i < cookieArray.length; i++) {
        const cookie = cookieArray[i].split("=");
        if (cookie[0] === name) {
            return decodeURIComponent(cookie[1]);
        }
    }
    return null;
}
function updatePadding(tfElement) {
    const iconElement = tfElement.querySelector(".wr_ico--tf-pre-lead.wr_ico, .wr_ico--tf-suf-lead.wr_ico, .wr_ico--tf-lead.wr_ico");
    if (!iconElement)
        return;
    const parentContainer = findParentWithClass(iconElement, ["cmp--tf-pre", "cmp--tf-main", "cmp--tf-suf"]);
    if (!parentContainer)
        return;
    const targetFieldset = parentContainer.querySelector("fieldset");
    if (!targetFieldset)
        return;
    const lytElement = parentContainer.firstChild;
    const containerWidth = parentContainer.offsetWidth;
    const tfLeftPadding = parseFloat(getComputedStyle(targetFieldset).paddingLeft);
    let lytGap = 0;
    if (lytElement) {
        lytGap = parseFloat(getComputedStyle(lytElement).gap) || 0;
    }
    const computedPaddingLeft = iconElement.offsetWidth + lytGap + tfLeftPadding;
    targetFieldset.style.paddingLeft = `${computedPaddingLeft}px`;
}


// Source: validation.js
function validateTextInput(field) {
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
        if (type === "tel" &&
            !new RegExp("^\\+?(\\d{1,4})?[\\s.-]?(\\d{1,4})?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}$").test(value)) {
            return false;
        }
        if (type === "password" && !new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$").test(value)) {
            return false;
        }
    }
    return true;
}
function validateCheckbox(field, form) {
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
}
function validateRadio(field, form) {
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
}
function validateFields(fields, form) {
    let isValid = true;
    fields.forEach((field) => {
        let fieldIsValid = true;
        if (field.type === "checkbox") {
            fieldIsValid = validateCheckbox(field, form);
        }
        else if (field.type === "radio") {
            fieldIsValid = validateRadio(field, form);
        }
        else {
            fieldIsValid = validateTextInput(field);
        }
        const formItem = field.item.closest(".lyt--form-item.lyt");
        if (formItem) {
            const lastChild = formItem.lastChild;
            if (!fieldIsValid) {
                lastChild.classList.add("error");
            }
            else {
                lastChild.classList.remove("error");
            }
        }
        if (isValid) {
            isValid = fieldIsValid;
        }
    });
    return isValid;
}


})();