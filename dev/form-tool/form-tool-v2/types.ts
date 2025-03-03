export interface FormField {
  type: string | null;
  required: boolean;
  value: string;
  customValidatorRegex?: string;
  item: HTMLInputElement | HTMLTextAreaElement;
  name: string;
  label: string;
  variable?: string;
  checked?: boolean;
}

export interface FormStep {
  formStep: HTMLElement;
  formStepNumber: HTMLElement;
  name: string;
  id: string;
}

export interface FormCategory {
  name: string;
  form: FormField[];
}

export interface FormData {
  categories: FormCategory[];
}

export interface GoogleAdsData {
  keyword?: string;
  campaign?: string;
  location?: string;
  adGroupID?: string;
  feedItemID?: string;
  extensionID?: string;
  targetID?: string;
  locInterestMS?: string;
  matchType?: string;
  network?: string;
  device?: string;
  deviceModel?: string;
  gclid?: string;
  creative?: string;
  placement?: string;
  target?: string;
  adPosition?: string;
}

export interface MetaAdsData {
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  placement?: string;
  site_source_name?: string;
  creative_id?: string;
  product_id?: string;
  product_group_id?: string;
  product_category?: string;
  source?: string;
  publisher_platform?: string;
  platform_position?: string;
  region?: string;
  device_type?: string;
  targeting?: string;
  ad_format?: string;
  click_id?: string;
  ad_name?: string;
  campaign_name?: string;
  adset_name?: string;
}

export interface FormRequest {
  formData: {
    categories: FormCategory[];
  };
  test: string;
  token?: string;
  id?: string;
  googleAds?: GoogleAdsData;
  metaAds?: MetaAdsData;
}

export interface Month {
  short: string;
  long: string;
  index: number;
}

export interface CountryCode {
  emoji: string;
  code: string;
  dial_code: string;
} 