const getCookies = () => {
  const setCookieByName = (name) => {
    const value = getQueryParam(name);
    if (value) {
      setCookie(name, value, 7);
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
  setCookieByName("fb_ad_id");
  setCookieByName("fb_adset_id");
  setCookieByName("fb_campaign_id");
  setCookieByName("fb_placement");
  setCookieByName("fb_site_source_name");
  setCookieByName("fb_creative_id");
  setCookieByName("fb_product_id");
  setCookieByName("fb_product_group_id");
  setCookieByName("fb_product_category");
  setCookieByName("fb_source");
  setCookieByName("fb_publisher_platform");
  setCookieByName("fb_platform_position");
  setCookieByName("fb_region");
  setCookieByName("fb_device_type");
  setCookieByName("fb_targeting");
  setCookieByName("fb_ad_format");
  setCookieByName("fb_click_id");
  setCookieByName("fb_ad_name");
  setCookieByName("fb_campaign_name");
  setCookieByName("fb_adset_name");

  // let addOn = "";
  // if (window.location.href.includes("edit")) {
  //   addOn = "?edit";
  // }

  // window.history.replaceState({}, document.title, window.location.pathname + addOn);
};

getCookies();
