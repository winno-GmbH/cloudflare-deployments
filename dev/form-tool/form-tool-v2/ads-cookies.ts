declare global {
  interface Window {
    CookieConsent?: {
      getConsent: () => Record<string, boolean> | null
      hasConsent: (category: string) => boolean
    }
    __winnoCookiesDone?: boolean
  }
}

function writeCookiesFromUrl(): void {
  const setCookieByName = (param: string, cookieName?: string): void => {
    const name = cookieName ?? param
    const value = new URLSearchParams(window.location.search).get(param)
    if (!value) return
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  // Google Ads
  setCookieByName('keyword')
  setCookieByName('campaignid')
  setCookieByName('loc_physical_ms')
  setCookieByName('adgroupid')
  setCookieByName('feeditemid')
  setCookieByName('extensionid')
  setCookieByName('targetid')
  setCookieByName('loc_interest_ms')
  setCookieByName('matchtype')
  setCookieByName('network')
  setCookieByName('device')
  setCookieByName('devicemodel')
  setCookieByName('gclid')
  setCookieByName('creative')
  setCookieByName('placement')
  setCookieByName('target')
  setCookieByName('adposition')

  // Meta Ads
  setCookieByName('ad_id', 'fb_ad_id')
  setCookieByName('adset_id', 'fb_adset_id')
  setCookieByName('campaign_id', 'fb_campaign_id')
  setCookieByName('placement', 'fb_placement')
  setCookieByName('site_source_name', 'fb_site_source_name')
  setCookieByName('creative_id', 'fb_creative_id')
  setCookieByName('product_id', 'fb_product_id')
  setCookieByName('product_group_id', 'fb_product_group_id')
  setCookieByName('product_category', 'fb_product_category')
  setCookieByName('source', 'fb_source')
  setCookieByName('publisher_platform', 'fb_publisher_platform')
  setCookieByName('platform_position', 'fb_platform_position')
  setCookieByName('region', 'fb_region')
  setCookieByName('device_type', 'fb_device_type')
  setCookieByName('targeting', 'fb_targeting')
  setCookieByName('ad_format', 'fb_ad_format')
  setCookieByName('click_id', 'fb_click_id')
  setCookieByName('ad_name', 'fb_ad_name')
  setCookieByName('campaign_name', 'fb_campaign_name')
  setCookieByName('adset_name', 'fb_adset_name')
}

export function initAdsCookies(): void {
  // Once-guard: multiple form instances on the same page must not re-run this
  if (window.__winnoCookiesDone) return
  window.__winnoCookiesDone = true

  if (window.CookieConsent?.hasConsent('marketing')) {
    writeCookiesFromUrl()
  } else {
    window.addEventListener('cookieConsentUpdate', function handler(e: Event) {
      const detail = (e as CustomEvent<Record<string, boolean>>).detail
      if (detail?.marketing) {
        writeCookiesFromUrl()
        window.removeEventListener('cookieConsentUpdate', handler)
      }
    })
  }
}
