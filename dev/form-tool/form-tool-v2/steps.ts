import { FormStep, FormCategory } from './types';
import { getFields, convertFieldsToFormData, convertFormDataToFields } from './fields';
import { validateFields } from './validation';

export class FormSteps {
  private currentStep: number = 0;
  private formStepPairs: FormStep[] = [];
  private form: HTMLElement;
  private nextStepButton: HTMLElement | null;
  private previousStepButton: HTMLElement | null;
  private submitButton: HTMLElement | null;
  private accessKey: string;

  constructor(form: HTMLElement, accessKey: string) {
    this.form = form;
    this.accessKey = accessKey;
    this.nextStepButton = form.querySelector(".wr_btn--form-control-next.wr_btn");
    this.previousStepButton = form.querySelector(".wr_btn--form-control-prev.wr_btn");
    this.submitButton = form.querySelector(".wr_btn--form-control-submit.wr_btn");
  }

  private setStepsActivity(): void {
    if (!this.previousStepButton || !this.submitButton || !this.nextStepButton) return;

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
      } else {
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
      } else {
        formStep.formStepNumber.classList.remove("locked");
        formStep.formStep.classList.add("hidden");
        if (index < this.currentStep) {
          formStep.formStepNumber.classList.add("completed");
        } else {
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
    } else {
      const currentStepNumber = this.formStepPairs[this.currentStep].formStepNumber.querySelector(".p--form-step-nr");
      if (currentStepNumber && lastActiveIndex === parseInt(currentStepNumber.textContent || "0")) {
        this.nextStepButton.classList.add("hidden");
        this.submitButton.classList.remove("hidden");
      }
    }
  }

  public init(): void {
    const formSteps = this.form.querySelectorAll(".cmp--form.cmp");
    const formStepNumbers = this.form.querySelectorAll(".cmp--form-step.cmp");

    formSteps.forEach((formStep, index) => {
      this.formStepPairs.push({
        formStep: formStep as HTMLElement,
        formStepNumber: formStepNumbers[index] as HTMLElement,
        name: formStep.getAttribute("name") || "",
        id: formStep.getAttribute("id") || "",
      });

      formStep.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((input) => {
        if (input.getAttribute("conditional-step")) {
          input.addEventListener("change", (e) => {
            const conditionalSteps = (e.target as HTMLElement).getAttribute("conditional-step")?.replace(" ", "").split(",") || [];
            this.formStepPairs.forEach((formStep) => {
              if ((e.target as HTMLInputElement).checked) {
                if (conditionalSteps.includes(formStep.id)) {
                  formStep.formStepNumber.classList.remove("hidden");
                  formStep.formStep.setAttribute("condition-active", "true");
                }
              } else {
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

    if (localStorage.getItem("form-save-id") && this.form.getAttribute("save-steps") !== "false") {
      this.loadSavedForm();
    }
  }

  private async loadSavedForm(): Promise<void> {
    try {
      const response = await fetch(
        `https://gecko-form-tool-be-new.vercel.app/api/forms/save-step/${localStorage.getItem("form-save-id")}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.data) {
        const formData = JSON.parse(data.data);
        const lastStepName = convertFormDataToFields(formData, this.form);
        this.setStepsActivity();
        this.setCurrentStep(lastStepName);
      }
    } catch (error) {
      console.error("Error loading saved form:", error);
    }
  }

  private setCurrentStep(stepName: string): void {
    this.formStepPairs.forEach((formStep, index) => {
      if (formStep.name === stepName) {
        this.currentStep = index;
      }
    });
    this.setStepsActivity();
  }

  public async nextStep(): Promise<void> {
    const fields = getFields(this.formStepPairs[this.currentStep].formStep);
    const isValid = validateFields(fields, this.form);
    if (!isValid) return;

    for (let i = this.currentStep + 1; i < this.formStepPairs.length; i++) {
      if (!this.formStepPairs[i].formStepNumber.classList.contains("hidden")) {
        this.currentStep = i;
        break;
      }
    }

    this.setStepsActivity();

    const categories: FormCategory[] = [];
    this.formStepPairs.forEach((formStep) => {
      if (!(formStep.formStep.getAttribute("condition-active") !== "true")) {
        const fields = convertFieldsToFormData(getFields(formStep.formStep));
        categories.push({
          name: formStep.name,
          form: fields,
        });
      }
    });

    if (this.form.getAttribute("save-steps") !== "false") {
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
      } catch (error) {
        console.error("Error saving form step:", error);
      }
    }
  }

  public previousStep(): void {
    for (let i = this.currentStep - 1; i >= 0; i--) {
      if (!this.formStepPairs[i].formStepNumber.classList.contains("hidden")) {
        this.currentStep = i;
        break;
      }
    }
    this.setStepsActivity();
  }

  public addEventListeners(): void {
    if (this.nextStepButton) {
      this.nextStepButton.addEventListener("click", () => this.nextStep());
    }
    if (this.previousStepButton) {
      this.previousStepButton.addEventListener("click", () => this.previousStep());
    }
  }
} 