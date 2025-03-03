import { FormField } from './types';

export function validateTextInput(field: FormField): boolean {
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
    if (
      type === "tel" &&
      !new RegExp("^\\+?(\\d{1,4})?[\\s.-]?(\\d{1,4})?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}$").test(
        value
      )
    ) {
      return false;
    }
    if (type === "password" && !new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$").test(value)) {
      return false;
    }
  }

  return true;
}

export function validateCheckbox(field: FormField, form: HTMLElement): boolean {
  const { required, name } = field;
  const checkboxes = form.querySelectorAll(`input[name="${name}"]`);
  let oneChecked = false;
  checkboxes.forEach((checkbox) => {
    if ((checkbox as HTMLInputElement).checked) {
      oneChecked = true;
    }
  });
  if (required && !oneChecked) {
    return false;
  }
  return true;
}

export function validateRadio(field: FormField, form: HTMLElement): boolean {
  const { required, name } = field;
  const radios = form.querySelectorAll(`input[name="${name}"]`);
  let oneChecked = false;
  radios.forEach((radio) => {
    if ((radio as HTMLInputElement).checked) {
      oneChecked = true;
    }
  });
  if (required && !oneChecked) {
    return false;
  }
  return true;
}

export function validateFields(fields: FormField[], form: HTMLElement): boolean {
  let isValid = true;
  fields.forEach((field) => {
    let fieldIsValid = true;
    if (field.type === "checkbox") {
      fieldIsValid = validateCheckbox(field, form);
    } else if (field.type === "radio") {
      fieldIsValid = validateRadio(field, form);
    } else {
      fieldIsValid = validateTextInput(field);
    }

    const formItem = field.item.closest(".lyt--form-item.lyt");
    if (formItem) {
      const lastChild = formItem.lastChild as HTMLElement;
      if (!fieldIsValid) {
        lastChild.classList.add("error");
      } else {
        lastChild.classList.remove("error");
      }
    }

    if (isValid) {
      isValid = fieldIsValid;
    }
  });
  return isValid;
} 