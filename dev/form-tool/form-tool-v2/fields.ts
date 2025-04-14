import { FormField, FormCategory } from './types';

export function getFields(parent: HTMLElement): FormField[] {
  const fields: FormField[] = [];
  const elements = Array.from(parent.querySelectorAll("input, textarea")).filter(
    (el) => !el.closest('[condition-active="false"]')
  ) as (HTMLInputElement | HTMLTextAreaElement)[];

  elements.forEach((field) => {
    const type = field.getAttribute("type");
    const required = field.required;
    const value = field.value;
    const customValidatorRegex = field.getAttribute("data-validator");
    const name = field.getAttribute("name") || "";
    const label = (field.closest(".cmp--form-item.cmp")?.querySelector(".lbl") as HTMLElement)?.innerText || "";

    if (type === "radio" || type === "checkbox") {
      fields.push({
        type,
        required,
        name,
        item: field,
        value: (field.closest(".cmp")?.querySelector(".lbl") as HTMLElement)?.innerText || "",
        checked: (field as HTMLInputElement).checked,
        variable: field.getAttribute("data-variable") || undefined,
        customValidatorRegex: customValidatorRegex || undefined,
        label,
      });
    } else {
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

export function convertFieldsToFormData(fields: FormField[]): FormField[] {
  const allFields: FormField[] = [];


  fields.forEach((field) => {
    const label = field.type === "radio" || field.type === "checkbox" ? field.name : field.label;

    const req: FormField = {
      type: field.type,
      value: field.value,
      label: label,
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
        } else {
          allFields.push(req);
        }
      }
    } else {
      allFields.push(req);
    }
  });

  return allFields;
}

export function convertFormDataToFields(formData: { categories: FormCategory[] }, form: HTMLElement): string {
  let lastStepName = "";

  formData.categories.forEach((category) => {
    const formStepParent = form.querySelector(`[name="${category.name}"]`);
    if (!formStepParent) return;

    category.form.forEach((field) => {
      const labelEl = getElementByXpathWithIndex(`//label[text()="${field.label}"]`, formStepParent as HTMLElement, 0);
      if (!labelEl || field.value === "") return;
      lastStepName = category.name;

      if (field.type === null) {
        const parent = labelEl.closest(".cmp--ta.cmp");
        const input = parent?.querySelector("textarea") as HTMLTextAreaElement;
        if (input) {
          input.value = field.value;
          parent?.classList.add("filled");
        }
      } else if (field.type === "checkbox") {
        const parent = labelEl.closest(".cmp--form-item.cmp");
        const selectedItems = field.value.split(", ");
        selectedItems.forEach((item) => {
          const inputLabel = getElementByXpathWithIndex(`//label[text()="${item}"]`, parent as HTMLElement, 0);
          const inputParent = inputLabel?.closest(".cmp--cb.cmp");
          if (inputParent) {
            inputParent.dispatchEvent(new Event("click"));
          }
        });
      } else if (field.type === "radio") {
        const parent = labelEl.closest(".cmp--form-item.cmp");
        const inputLabel = getElementByXpathWithIndex(`//label[text()="${field.value}"]`, parent as HTMLElement, 0);
        const inputParent = inputLabel?.closest(".cmp--rb.cmp");
        if (inputParent) {
          inputParent.dispatchEvent(new Event("click"));
        }
      } else {
        const parent = labelEl.closest(".cmp--tf.cmp");
        const input = parent?.querySelector("input") as HTMLInputElement;
        if (input) {
          input.value = field.value;
          parent?.classList.add("filled");
        }
      }
    });
  });

  return lastStepName;
}

function getElementByXpathWithIndex(xpath: string, parent: HTMLElement, index: number): HTMLElement | null {
  const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  let elements: HTMLElement[] = [];
  for (let i = 0; i < xpathResult.snapshotLength; i++) {
    elements.push(xpathResult.snapshotItem(i) as HTMLElement);
  }
  const descendantElements = elements.filter((element) => parent.contains(element));
  return descendantElements[index] || null;
} 