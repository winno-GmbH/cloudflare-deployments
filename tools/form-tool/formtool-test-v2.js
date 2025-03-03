/**
 * Form Tool v2
 * Compiled on 2025-03-03T15:00:26.711Z
 * Dependencies resolved automatically
 */
(function(window) {
  // Shared namespace for resolving references
  var _internal = {};


// Source: types.js



// Source: fields.js
function getFields(_parent_fields) {
    const _fields_fields = [];
    const _elements_fields = Array.from(_parent_fields.querySelectorAll("_input_fields, textarea")).filter((el) => !el.closest('[condition-active="false"]'));
    _elements_fields.forEach((field) => {
        const type = field.getAttribute("type");
        const required = field.required;
        const _value_fields = field._value_fields;
        const customValidatorRegex = field.getAttribute("data-validator");
        const name = field.getAttribute("name") || "";
        const label = field.closest(".cmp--form-item.cmp")?.querySelector(".lbl")?.innerText || "";
        if (type === "radio" || type === "checkbox") {
            _fields_fields.push({
                type,
                required,
                name,
                item: field,
                _value_fields: field.closest(".cmp")?.querySelector(".lbl")?.innerText || "",
                checked: field.checked,
                variable: field.getAttribute("data-variable") || undefined,
                customValidatorRegex: customValidatorRegex || undefined,
                label,
            });
        }
        else {
            _fields_fields.push({
                type: type || null,
                required,
                _value_fields,
                customValidatorRegex: customValidatorRegex || undefined,
                item: field,
                name,
                label,
                variable: field.getAttribute("data-variable") || undefined,
            });
        }
    });
    return _fields_fields;
}
function convertFieldsToFormData(_fields_fields) {
    const allFields = [];
    _fields_fields.forEach((field) => {
        const req = {
            type: field.type,
            _value_fields: field._value_fields,
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
                    existingField.value = `${existingField._value_fields}, ${field._value_fields}`;
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
    let _lastStepName_fields = "";
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
                const _parent_fields = labelEl.closest(".cmp--ta.cmp");
                const _input_fields = _parent_fields?.querySelector("textarea");
                if (_input_fields) {
                    _input_fields.value = field._value_fields;
                    _parent_fields?.classList.add("filled");
                }
            }
            else if (field.type === "checkbox") {
                const _parent_fields = labelEl.closest(".cmp--form-item.cmp");
                const selectedItems = field._value_fields.split(", ");
                selectedItems.forEach((item) => {
                    const inputLabel = getElementByXpathWithIndex(`//label[text()="${item}"]`, _parent_fields, 0);
                    const inputParent = inputLabel?.closest(".cmp--cb.cmp");
                    const _input_fields = inputParent?.querySelector("_input_fields");
                    if (_input_fields) {
                        _input_fields.checked = true;
                        inputParent?.classList.add("checked");
                        _input_fields.dispatchEvent(new Event("change"));
                    }
                });
            }
            else if (field.type === "radio") {
                const _parent_fields = labelEl.closest(".cmp--form-item.cmp");
                const inputLabel = getElementByXpathWithIndex(`//label[text()="${field._value_fields}"]`, _parent_fields, 0);
                const inputParent = inputLabel?.closest(".cmp--rb.cmp");
                const _input_fields = inputParent?.querySelector("_input_fields");
                if (_input_fields) {
                    _input_fields.checked = true;
                    inputParent?.classList.add("checked");
                    _input_fields.dispatchEvent(new Event("change"));
                }
            }
            else {
                const _parent_fields = labelEl.closest(".cmp--tf.cmp");
                const _input_fields = _parent_fields?.querySelector("_input_fields");
                if (_input_fields) {
                    _input_fields.value = field._value_fields;
                    _parent_fields?.classList.add("filled");
                }
            }
        });
    });
    return _lastStepName_fields;
}
function _getElementByXpathWithIndex_fields(xpath, _parent_fields, index) {
    const _xpathResult_fields = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let _elements_fields = [];
    for (let _i_fields = 0; _i_fields < _xpathResult_fields.snapshotLength; _i_fields++) {
        _elements_fields.push(_xpathResult_fields.snapshotItem(_i_fields));
    }
    const _descendantElements_fields = _elements_fields.filter((element) => _parent_fields.contains(element));
    return _descendantElements_fields[index] || null;
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
        const _elements_formtool_v2 = document.querySelectorAll('[unwrap="true"]');
        _elements_formtool_v2.forEach((element) => {
            const _parent_formtool_v2 = element.parentNode;
            while (element.firstChild) {
                _parent_formtool_v2?.insertBefore(element.firstChild, element);
            }
            _parent_formtool_v2?.removeChild(element);
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
            parents.forEach((_parent_formtool_v2) => {
                const _input_formtool_v2 = _parent_formtool_v2.querySelector("_input_formtool_v2");
                if (!_input_formtool_v2)
                    return;
                if (_input_formtool_v2.placeholder) {
                    _parent_formtool_v2.classList.add("filled");
                }
                _parent_formtool_v2.addEventListener("click", () => {
                    _parent_formtool_v2.classList.add("focused");
                    _input_formtool_v2.focus();
                });
                _input_formtool_v2.addEventListener("focus", () => {
                    _parent_formtool_v2.classList.add("focused");
                });
                _input_formtool_v2.addEventListener("blur", () => {
                    if (_input_formtool_v2.placeholder) {
                        _parent_formtool_v2.classList.add("filled");
                    }
                    if (_input_formtool_v2.value === "") {
                        _parent_formtool_v2.classList.remove("focused");
                        _parent_formtool_v2.classList.remove("filled");
                    }
                    else {
                        _parent_formtool_v2.classList.add("filled");
                    }
                    if (!_parent_formtool_v2.querySelector(".cmp--tf-md.cmp") || tf.querySelector(".cmp--tf-md.cmp.hidden")) {
                        if (validateTextInput({ type: _input_formtool_v2.type, required: _input_formtool_v2.required, _value_formtool_v2: _input_formtool_v2._value_formtool_v2, name: _input_formtool_v2.name, label: _input_formtool_v2?.labels?.[0]?.textContent ?? "", item: _input_formtool_v2 })) {
                            _parent_formtool_v2.classList.remove("error");
                            _parent_formtool_v2.classList.add("success");
                        }
                        else {
                            _parent_formtool_v2.classList.add("error");
                            _parent_formtool_v2.classList.remove("success");
                        }
                    }
                });
            });
        });
        document.querySelectorAll(".cmp--cb.cmp").forEach((cb) => {
            const _input_formtool_v2 = cb.querySelector("_input_formtool_v2");
            if (!_input_formtool_v2)
                return;
            cb.addEventListener("click", (e) => {
                if (e.target !== _input_formtool_v2) {
                    _input_formtool_v2.checked = !_input_formtool_v2.checked;
                }
                if (_input_formtool_v2.checked) {
                    cb.classList.add("checked");
                }
                else {
                    cb.classList.remove("checked");
                }
                this.form?.querySelectorAll(`_input_formtool_v2[name="${_input_formtool_v2.name}"]`).forEach((checkbox) => {
                    checkbox.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--rb.cmp").forEach((rb) => {
            const _input_formtool_v2 = rb.querySelector("_input_formtool_v2");
            if (!_input_formtool_v2)
                return;
            rb.addEventListener("click", () => {
                this.form?.querySelectorAll(`_input_formtool_v2[name="${_input_formtool_v2.name}"]`).forEach((rb) => {
                    const _parent_formtool_v2 = rb.closest(".cmp--rb.cmp");
                    if (_parent_formtool_v2) {
                        _parent_formtool_v2.classList.remove("checked");
                    }
                });
                _input_formtool_v2.checked = true;
                this.form?.querySelectorAll(`_input_formtool_v2[name="${_input_formtool_v2.name}"]`).forEach((radioGroupBtn) => {
                    radioGroupBtn.dispatchEvent(new Event("change"));
                });
                rb.classList.add("checked");
            });
        });
        document.querySelectorAll(".cmp--sw.cmp").forEach((sw) => {
            const _input_formtool_v2 = sw.querySelector("_input_formtool_v2");
            if (!_input_formtool_v2)
                return;
            sw.addEventListener("click", (e) => {
                if (e.target !== _input_formtool_v2) {
                    _input_formtool_v2.checked = !_input_formtool_v2.checked;
                }
                if (_input_formtool_v2.checked) {
                    sw.classList.add("checked");
                }
                else {
                    sw.classList.remove("checked");
                }
                this.form?.querySelectorAll(`_input_formtool_v2[name="${_input_formtool_v2.name}"]`).forEach((switchBtns) => {
                    switchBtns.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--ct.cmp").forEach((ct) => {
            const _input_formtool_v2 = ct.querySelector("_input_formtool_v2");
            if (!_input_formtool_v2)
                return;
            ct.addEventListener("click", (e) => {
                if (e.target !== _input_formtool_v2) {
                    _input_formtool_v2.checked = !_input_formtool_v2.checked;
                }
                if (_input_formtool_v2.checked) {
                    ct.classList.add("checked");
                }
                else {
                    ct.classList.remove("checked");
                }
                this.form?.querySelectorAll(`_input_formtool_v2[name="${_input_formtool_v2.name}"]`).forEach((checkbox) => {
                    checkbox.dispatchEvent(new Event("change"));
                });
            });
        });
        document.querySelectorAll(".cmp--ta.cmp").forEach((ta) => {
            const _input_formtool_v2 = ta.querySelector("textarea");
            if (!_input_formtool_v2)
                return;
            ta.addEventListener("click", () => {
                ta.classList.add("focused");
                _input_formtool_v2.focus();
            });
            _input_formtool_v2.addEventListener("focus", () => {
                ta.classList.add("focused");
            });
            _input_formtool_v2.addEventListener("blur", () => {
                if (_input_formtool_v2.value === "") {
                    ta.classList.remove("focused");
                    ta.classList.remove("filled");
                }
                else {
                    ta.classList.add("filled");
                }
                if (validateTextInput({ type: _input_formtool_v2.type, required: _input_formtool_v2.required, _value_formtool_v2: _input_formtool_v2._value_formtool_v2, name: _input_formtool_v2.name, label: _input_formtool_v2?.labels?.[0]?.textContent ?? "", item: _input_formtool_v2 })) {
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
            let _parent_formtool_v2 = tf.closest(".cmp--tf.cmp");
            const overlay = _parent_formtool_v2?.querySelector(".el--tf-md-overlay.el");
            parent = tf.closest(".cmp.cmp--tf-pre") ?? tf.closest(".cmp.cmp--tf-suf") ?? _parent_formtool_v2;
            const _input_formtool_v2 = _parent_formtool_v2?.querySelector("_input_formtool_v2") ??
                _parent_formtool_v2?.querySelector(".lbl--tf-pre.lbl") ??
                _parent_formtool_v2?.querySelector(".lbl--tf-suf.lbl");
            const options = Array.from(_parent_formtool_v2?.querySelectorAll(".cmp--tf-md-option.cmp") || []);
            if (options.length === 0 || tf.getAttribute("generate") === "true") {
                if (tf.getAttribute("data-type") === "country-code") {
                    this.setupCountryCodePicker(_input_formtool_v2, tf, options);
                }
                else {
                    this.setupDatePicker(_input_formtool_v2, _parent_formtool_v2);
                }
            }
            else {
                this.setupOptions(_input_formtool_v2, _parent_formtool_v2, options);
            }
        });
    }
    setupCountryCodePicker(_input_formtool_v2, tf, existingOptions) {
        const overlay = tf.querySelector(".el--tf-md-overlay.el");
        fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json")
            .then((response) => response.json())
            .then((data) => {
            const _parent_formtool_v2 = tf.lastChild?.lastChild;
            if (!_parent_formtool_v2)
                return;
            _parent_formtool_v2.innerHTML = "";
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
                    _parent_formtool_v2.appendChild(option.item);
                    return;
                }
                option.item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const text = cleanString(option.item.textContent || "");
                    _input_formtool_v2.value = text;
                    _input_formtool_v2.innerHTML = text;
                    _parent_formtool_v2.classList.add("filled");
                    overlay?.classList.add("hidden");
                    tf.classList.add("hidden");
                    _parent_formtool_v2.classList.add("success");
                    _parent_formtool_v2.classList.remove("error");
                    options.forEach((option) => {
                        option.item.classList.remove("hidden");
                        option.item.classList.remove("checked");
                    });
                    option.item.classList.add("checked");
                    _input_formtool_v2.dispatchEvent(new Event("blur"));
                });
                _parent_formtool_v2.appendChild(option.item);
            });
            _parent_formtool_v2.addEventListener("click", () => {
                overlay?.classList.remove("hidden");
                tf.classList.remove("hidden");
            });
            overlay?.addEventListener("click", (e) => {
                e.stopPropagation();
                overlay.classList.add("hidden");
                tf.classList.add("hidden");
                _input_formtool_v2.dispatchEvent(new Event("blur"));
            });
        });
    }
    setupDatePicker(_input_formtool_v2, _parent_formtool_v2) {
    }
    setupOptions(_input_formtool_v2, _parent_formtool_v2, options) {
        options.forEach((option) => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();
                _input_formtool_v2.value = option.textContent?.trim() || "";
                _parent_formtool_v2.classList.add("filled");
                _parent_formtool_v2.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden");
                _parent_formtool_v2.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden");
                _parent_formtool_v2.classList.add("success");
                _parent_formtool_v2.classList.remove("error");
                options.forEach((option) => {
                    option.classList.remove("hidden");
                    option.classList.remove("checked");
                });
                _input_formtool_v2.dispatchEvent(new Event("blur"));
                option.classList.add("checked");
            });
        });
        _input_formtool_v2.addEventListener("_input_formtool_v2", (e) => {
            const _value_formtool_v2 = e.target._value_formtool_v2.toLowerCase();
            const found = options.find((option) => option.textContent?.trim().toLowerCase() === _value_formtool_v2);
            options.forEach((option) => {
                if (option.textContent?.trim().toLowerCase().includes(_value_formtool_v2) || found) {
                    option.classList.remove("hidden");
                }
                else {
                    option.classList.add("hidden");
                }
            });
        });
        _parent_formtool_v2.addEventListener("click", () => {
            _parent_formtool_v2.querySelector(".el--tf-md-overlay.el")?.classList.remove("hidden");
            _parent_formtool_v2.querySelector(".cmp--tf-md.cmp")?.classList.remove("hidden");
        });
        _parent_formtool_v2.querySelector(".el--tf-md-overlay.el")?.addEventListener("click", (e) => {
            e.stopPropagation();
            _parent_formtool_v2.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden");
            _parent_formtool_v2.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden");
            _input_formtool_v2.dispatchEvent(new Event("blur"));
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
        const _formSteps_steps = this.form.querySelectorAll(".cmp--form.cmp");
        const formStepNumbers = this.form.querySelectorAll(".cmp--form-step.cmp");
        _formSteps_steps.forEach((formStep, index) => {
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
            const _response_steps = await fetch(`https://gecko-form-tool-be-new.vercel.app/api/forms/save-step/${localStorage.getItem("form-save-id")}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const _data_steps = await _response_steps.json();
            if (_data_steps._data_steps) {
                const formData = JSON.parse(_data_steps._data_steps);
                const _lastStepName_steps = convertFormDataToFields(formData, this.form);
                this.setStepsActivity();
                this.setCurrentStep(_lastStepName_steps);
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
        const _fields_steps = getFields(this.formStepPairs[this.currentStep].formStep);
        const _isValid_steps = validateFields(_fields_steps, this.form);
        if (!_isValid_steps)
            return;
        for (let _i_steps = this.currentStep + 1; _i_steps < this.formStepPairs.length; _i_steps++) {
            if (!this.formStepPairs[_i_steps].formStepNumber.classList.contains("hidden")) {
                this.currentStep = _i_steps;
                break;
            }
        }
        this.setStepsActivity();
        const _categories_steps = [];
        this.formStepPairs.forEach((formStep) => {
            if (!(formStep.id !== "" && formStep.formStep.getAttribute("condition-active") !== "true")) {
                const _fields_steps = convertFieldsToFormData(getFields(formStep.formStep));
                _categories_steps.push({
                    name: formStep.name,
                    form: _fields_steps,
                });
            }
        });
        try {
            const _response_steps = await fetch("https://gecko-form-tool-be-new.vercel.app/api/forms/save-step", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: localStorage.getItem("form-save-id") || undefined,
                    _data_steps: {
                        _categories_steps: _categories_steps,
                    },
                    token: this.accessKey,
                }),
            });
            const _data_steps = await _response_steps.json();
            if (_data_steps.id) {
                localStorage.setItem("form-save-id", _data_steps.id);
            }
        }
        catch (error) {
            console.error("Error saving form step:", error);
        }
    }
    previousStep() {
        for (let _i_steps = this.currentStep - 1; _i_steps >= 0; _i_steps--) {
            if (!this.formStepPairs[_i_steps].formStepNumber.classList.contains("hidden")) {
                this.currentStep = _i_steps;
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
            const _response_submission = await fetch(this.serverUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });
            if (!_response_submission.ok) {
                throw new Error("Network _response_submission was not ok");
            }
            const _data_submission = await _response_submission.json();
            this.handleSuccess(_data_submission);
        }
        catch (error) {
            console.error("Error during sending _data_submission:", error);
        }
    }
    handleSuccess(_data_submission) {
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
        const _formSteps_submission = this.form.querySelectorAll(".cmp--form.cmp");
        _formSteps_submission.forEach((formStep) => {
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
        const _fields_submission = getFields(this.form);
        const _isValid_submission = validateFields(_fields_submission, this.form);
        if (!_isValid_submission)
            return;
        const _categories_submission = [];
        const _formSteps_submission = this.form.querySelectorAll(".cmp--form.cmp");
        _formSteps_submission.forEach((formStep) => {
            if (!(formStep.getAttribute("id") !== "" && formStep.getAttribute("condition-active") !== "true")) {
                const _fields_submission = convertFieldsToFormData(getFields(formStep));
                _categories_submission.push({
                    name: formStep.getAttribute("name") || "",
                    form: _fields_submission,
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
                _categories_submission: _categories_submission,
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
function _getElementByXpathWithIndex_utils(xpath, parent, index) {
    const _xpathResult_utils = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let _elements_utils = [];
    for (let _i_utils = 0; _i_utils < _xpathResult_utils.snapshotLength; _i_utils++) {
        _elements_utils.push(_xpathResult_utils.snapshotItem(_i_utils));
    }
    const _descendantElements_utils = _elements_utils.filter((element) => parent.contains(element));
    return _descendantElements_utils[index] || null;
}
function getCookie(name) {
    const cookieArray = document.cookie.split("; ");
    for (let _i_utils = 0; _i_utils < cookieArray.length; _i_utils++) {
        const cookie = cookieArray[_i_utils].split("=");
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
    let _isValid_validation = true;
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
        if (_isValid_validation) {
            isValid = fieldIsValid;
        }
    });
    return _isValid_validation;
}


  
})(window);