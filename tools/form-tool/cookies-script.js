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

  // delete all query params
  window.history.replaceState({}, document.title, "/");
};
