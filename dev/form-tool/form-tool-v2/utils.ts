export function cleanString(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .trim();
}

export function findParentWithClass(element: HTMLElement, classNames: string[]): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current && current.classList) {
    if (classNames.some((className) => current?.classList.contains(className))) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function getContainerType(element: HTMLElement): string {
  if (element.classList.contains("cmp--tf-pre")) return "pre";
  if (element.classList.contains("cmp--tf-main")) return "main";
  if (element.classList.contains("cmp--tf-suf")) return "suf";
  return "";
}

export function getElementByXpathWithIndex(xpath: string, parent: HTMLElement, index: number): HTMLElement | null {
  const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  let elements: HTMLElement[] = [];
  for (let i = 0; i < xpathResult.snapshotLength; i++) {
    elements.push(xpathResult.snapshotItem(i) as HTMLElement);
  }
  const descendantElements = elements.filter((element) => parent.contains(element));
  return descendantElements[index] || null;
}

export function getCookie(name: string): string | null {
  const cookieArray = document.cookie.split("; ");

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].split("=");
    if (cookie[0] === name) {
      return decodeURIComponent(cookie[1]);
    }
  }

  return null;
}

export function updatePadding(tfElement: HTMLElement): void {
  const iconElement = tfElement.querySelector(
    ".wr_ico--tf-pre-lead.wr_ico, .wr_ico--tf-suf-lead.wr_ico, .wr_ico--tf-lead.wr_ico"
  ) as HTMLElement;

  if (!iconElement) return;

  const parentContainer = findParentWithClass(iconElement, ["cmp--tf-pre", "cmp--tf-main", "cmp--tf-suf"]);

  if (!parentContainer) return;

  const targetFieldset = parentContainer.querySelector("fieldset") as HTMLElement;

  if (!targetFieldset) return;

  const lytElement = parentContainer.firstChild as HTMLElement;

  const containerWidth = parentContainer.offsetWidth;
  const tfLeftPadding = parseFloat(getComputedStyle(targetFieldset).paddingLeft);

  let lytGap = 0;
  if (lytElement) {
    lytGap = parseFloat(getComputedStyle(lytElement).gap) || 0;
  }

  const computedPaddingLeft = iconElement.offsetWidth + lytGap + tfLeftPadding;
  targetFieldset.style.paddingLeft = `${computedPaddingLeft}px`;
} 