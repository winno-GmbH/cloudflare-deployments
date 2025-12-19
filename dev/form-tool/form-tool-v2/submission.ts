import { FormRequest, GoogleAdsData, MetaAdsData, FormCategory } from "./types";
import { getFields, convertFieldsToFormData } from "./fields";
import { validateFields } from "./validation";
import { getCookie, getCookieTimingInfo } from "./utils";

declare global {
  interface Window {
    gtag_report_conversion: () => void;
    dataLayer: any[];
    fbq: (action: string, event: string) => void;
  }

  const grecaptcha: {
    enterprise: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  };
}

export class FormSubmission {
  private form: HTMLElement;
  private accessKey: string;
  private captchaKey: string | null;
  private serverUrl: string =
    "https://gecko-form-tool-be-new.vercel.app/api/forms/submit";

  constructor(form: HTMLElement, accessKey: string, captchaKey: string | null) {
    this.form = form;
    this.accessKey = accessKey;
    this.captchaKey = captchaKey;
  }

  private getGoogleAdsData(): GoogleAdsData {
    // Check cookie timing information
    const timing = getCookieTimingInfo("campaignid");
    const isXo = window.location.hostname.includes("xo-angels");
    if (timing.value && timing.createdAt && isXo) {
      const minutesSinceCreated = Math.floor(
        (Date.now() - timing.createdAt.getTime()) / (1000 * 60)
      );
      if (minutesSinceCreated > 30) {
        return {};
      }
    }

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

  private getMetaAdsData(): MetaAdsData {
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

  private async submitForm(request: FormRequest): Promise<void> {
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
    } catch (error) {
      console.error("Error during sending data:", error);
    }
  }

  private handleSuccess(data: any): void {
    if (typeof window.gtag_report_conversion !== "undefined") {
      window.gtag_report_conversion();
    }
    if (typeof window.dataLayer !== "undefined") {
      window.dataLayer.push({
        event: "form_conversion",
      });
    }

    const buttonWrapper = this.form.querySelector(
      ".wr_btn--form-control-submit.wr_btn"
    );
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
      } else {
        formStep.querySelector(".cmp--form.cmp")?.classList.add("hidden");
      }
    });
    this.form.querySelector(".cmp--btn-group.cmp")?.classList.add("hidden");
    const success = this.form.querySelector(".cmp--form-success.cmp");
    if (success) {
      success.classList.remove("hidden");
      success.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    localStorage.removeItem("form-save-id");
  }

  public async handleSubmit(e: Event, sessionId: string): Promise<void> {
    e.preventDefault();

    const fields = getFields(this.form);
    const isValid = validateFields(fields, this.form);
    if (!isValid) return;

    const categories: FormCategory[] = [];
    const formSteps = this.form.querySelectorAll(".cmp--form.cmp");
    if (formSteps.length === 1) {
      const fields = convertFieldsToFormData(
        getFields(formSteps[0] as HTMLElement)
      );
      categories.push({
        name: formSteps[0].getAttribute("name") || "",
        form: fields,
      });
    } else {
      formSteps.forEach((formStep) => {
        if (
          !(
            formStep.id !== "" &&
            formStep.getAttribute("condition-active") !== "true"
          )
        ) {
          const fields = convertFieldsToFormData(
            getFields(formStep as HTMLElement)
          );
          categories.push({
            name: formStep.getAttribute("name") || "",
            form: fields,
          });
        }
      });
    }
    try {
      window.fbq("track", "Lead");
    } catch (error) {
      // ignore
    }

    let recaptchaToken: string | null = null;
    if (
      this.captchaKey &&
      typeof grecaptcha !== "undefined" &&
      grecaptcha.enterprise
    ) {
      try {
        await new Promise<void>((resolve) => {
          grecaptcha.enterprise.ready(async () => {
            recaptchaToken = await grecaptcha.enterprise.execute(
              this.captchaKey!,
              {
                action: "submit",
              }
            );
            resolve();
          });
        });
      } catch (error) {
        console.error("reCAPTCHA error:", error);
      }
    }

    const request: FormRequest = {
      formData: {
        categories: categories,
      },
      test: this.accessKey,
      token: recaptchaToken || undefined,
      id: localStorage.getItem("form-save-id") || undefined,
      googleAds: this.getGoogleAdsData(),
      metaAds: this.getMetaAdsData(),
      sessionId: sessionId,
    };

    const buttonWrapper = (e.target as HTMLElement).closest(
      ".wr_btn--form-control-submit.wr_btn"
    );
    if (!buttonWrapper) return;

    buttonWrapper.classList.add("pending");
    buttonWrapper.setAttribute("disabled", "true");
    const buttonText =
      buttonWrapper.getAttribute("pending-text") || "Loading...";
    (e.target as HTMLElement).textContent = buttonText;

    await this.submitForm(request);
  }
}
