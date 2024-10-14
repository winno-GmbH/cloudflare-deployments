const getCookies = () => {
  const setCookieByName = (name, cookieName) => {
    let cookieNameToSet = cookieName || name;
    const value = getQueryParam(name);
    if (value) {
      setCookie(cookieNameToSet, value, 7);
    }
  };

  const getQueryParam = (param) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
  };
  // Function to save a value in a cookie
  const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  // Get the value of the 'kwd' parameter from the URL

  // google ads tracking
  setCookieByName("keyword");
  setCookieByName("campaignid");
  setCookieByName("loc_physical_ms");
  setCookieByName("adgroupid");
  setCookieByName("feeditemid");
  setCookieByName("extensionid");
  setCookieByName("targetid");
  setCookieByName("loc_interest_ms");
  setCookieByName("matchtype");
  setCookieByName("network");
  setCookieByName("device");
  setCookieByName("devicemodel");
  setCookieByName("gclid");
  setCookieByName("creative");
  setCookieByName("placement");
  setCookieByName("target");
  setCookieByName("adposition");

  // meta ads tracking
  setCookieByName("ad_id", "fb_ad_id");
  setCookieByName("adset_id", "fb_adset_id");
  setCookieByName("campaign_id", "fb_campaign_id");
  setCookieByName("placement", "fb_placement");
  setCookieByName("site_source_name", "fb_site_source_name");
  setCookieByName("creative_id", "fb_creative_id");
  setCookieByName("product_id", "fb_product_id");
  setCookieByName("product_group_id", "fb_product_group_id");
  setCookieByName("product_category", "fb_product_category");
  setCookieByName("source", "fb_source");
  setCookieByName("publisher_platform", "fb_publisher_platform");
  setCookieByName("platform_position", "fb_platform_position");
  setCookieByName("region", "fb_region");
  setCookieByName("device_type", "fb_device_type");
  setCookieByName("targeting", "fb_targeting");
  setCookieByName("ad_format", "fb_ad_format");
  setCookieByName("click_id", "fb_click_id");
  setCookieByName("ad_name", "fb_ad_name");
  setCookieByName("campaign_name", "fb_campaign_name");
  setCookieByName("adset_name", "fb_adset_name");

  // let addOn = "";
  // if (window.location.href.includes("edit")) {
  //   addOn = "?edit";
  // }

  // window.history.replaceState({}, document.title, window.location.pathname + addOn);
};

getCookies();
