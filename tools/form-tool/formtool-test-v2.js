!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.FormTool=t():e.FormTool=t()}(this,(()=>(()=>{"use strict";function e(e){const t=[];return Array.from(e.querySelectorAll("input, textarea")).filter((e=>!e.closest('[condition-active="false"]'))).forEach((e=>{const s=e.getAttribute("type"),r=e.required,i=e.value,c=e.getAttribute("data-validator"),n=e.getAttribute("name")||"",o=e.closest(".cmp--form-item.cmp")?.querySelector(".lbl")?.innerText||"";"radio"===s||"checkbox"===s?t.push({type:s,required:r,name:n,item:e,value:e.closest(".cmp")?.querySelector(".lbl")?.innerText||"",checked:e.checked,variable:e.getAttribute("data-variable")||void 0,customValidatorRegex:c||void 0,label:o}):t.push({type:s||null,required:r,value:i,customValidatorRegex:c||void 0,item:e,name:n,label:o,variable:e.getAttribute("data-variable")||void 0})})),t}function t(e){const t=[];return e.forEach((e=>{const s={type:e.type,value:e.value,label:e.label,name:e.name,required:e.required,item:e.item};if(e.variable&&(s.variable=e.variable),"radio"===e.type||"checkbox"===e.type){if(e.checked){const r=t.find((t=>t.label===e.label));r?r.value=`${r.value}, ${e.value}`:t.push(s)}}else t.push(s)})),t}function s(e,t,s){const r=document.evaluate(e,document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);let i=[];for(let e=0;e<r.snapshotLength;e++)i.push(r.snapshotItem(e));return i.filter((e=>t.contains(e)))[s]||null}function r(e){const{value:t,required:s,customValidatorRegex:r,type:i}=e;if(s){if(r&&!new RegExp(r).test(t))return!1;if(""===t)return!1;if("email"===i&&!new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$").test(t))return!1;if("tel"===i&&!new RegExp("^\\+?(\\d{1,4})?[\\s.-]?(\\d{1,4})?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}$").test(t))return!1;if("password"===i&&!new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$").test(t))return!1}return!0}function i(e,t){let s=!0;return e.forEach((e=>{let i=!0;i="checkbox"===e.type?function(e,t){const{required:s,name:r}=e,i=t.querySelectorAll(`input[name="${r}"]`);let c=!1;return i.forEach((e=>{e.checked&&(c=!0)})),!(s&&!c)}(e,t):"radio"===e.type?function(e,t){const{required:s,name:r}=e,i=t.querySelectorAll(`input[name="${r}"]`);let c=!1;return i.forEach((e=>{e.checked&&(c=!0)})),!(s&&!c)}(e,t):r(e);const c=e.item.closest(".lyt--form-item.lyt");if(c){const e=c.lastChild;i?e.classList.remove("error"):e.classList.add("error")}s&&(s=i)})),s}class c{constructor(e,t){this.currentStep=0,this.formStepPairs=[],this.form=e,this.accessKey=t,this.nextStepButton=e.querySelector(".wr_btn--form-control-next.wr_btn"),this.previousStepButton=e.querySelector(".wr_btn--form-control-prev.wr_btn"),this.submitButton=e.querySelector(".wr_btn--form-control-submit.wr_btn")}setStepsActivity(){if(!this.previousStepButton||!this.submitButton||!this.nextStepButton)return;this.previousStepButton.classList.add("hidden"),this.submitButton.classList.add("hidden"),this.nextStepButton.classList.remove("hidden");let e=0;if(this.formStepPairs.forEach(((t,s)=>{if(t.formStepNumber.classList.remove("completed"),t.formStepNumber.classList.remove("active"),t.formStepNumber.classList.remove("locked"),""!==t.id&&"true"!==t.formStep.getAttribute("condition-active"))t.formStepNumber.classList.add("hidden");else{t.formStepNumber.classList.remove("hidden");const s=t.formStepNumber.querySelector(".p--form-step-nr");s&&(s.textContent=(e+1).toString()),e++}s===this.currentStep?(t.formStepNumber.classList.add("active"),t.formStep.classList.remove("hidden")):(t.formStepNumber.classList.remove("locked"),t.formStep.classList.add("hidden"),s<this.currentStep?t.formStepNumber.classList.add("completed"):t.formStepNumber.classList.add("locked"))})),this.currentStep>0&&this.previousStepButton.classList.remove("hidden"),this.currentStep===this.formStepPairs.length-1)this.nextStepButton.classList.add("hidden"),this.submitButton.classList.remove("hidden");else{const t=this.formStepPairs[this.currentStep].formStepNumber.querySelector(".p--form-step-nr");t&&e===parseInt(t.textContent||"0")&&(this.nextStepButton.classList.add("hidden"),this.submitButton.classList.remove("hidden"))}}init(){const e=this.form.querySelectorAll(".cmp--form.cmp"),t=this.form.querySelectorAll(".cmp--form-step.cmp");e.forEach(((e,s)=>{this.formStepPairs.push({formStep:e,formStepNumber:t[s],name:e.getAttribute("name")||"",id:e.getAttribute("id")||""}),e.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((e=>{e.getAttribute("conditional-step")&&e.addEventListener("change",(e=>{const t=e.target.getAttribute("conditional-step")?.replace(" ","").split(",")||[];this.formStepPairs.forEach((s=>{e.target.checked?t.includes(s.id)&&(s.formStepNumber.classList.remove("hidden"),s.formStep.setAttribute("condition-active","true")):t.includes(s.id)&&(s.formStepNumber.classList.add("hidden"),s.formStep.setAttribute("condition-active","false"))})),this.setStepsActivity()}))}))})),this.setStepsActivity(),localStorage.getItem("form-save-id")&&this.loadSavedForm()}async loadSavedForm(){try{const e=await fetch(`https://gecko-form-tool-be-new.vercel.app/api/forms/save-step/${localStorage.getItem("form-save-id")}`,{method:"GET",headers:{"Content-Type":"application/json"}}),t=await e.json();if(t.data){const e=function(e,t){let r="";return e.categories.forEach((e=>{const i=t.querySelector(`[name="${e.name}"]`);i&&e.form.forEach((t=>{const c=s(`//label[text()="${t.label}"]`,i,0);if(c&&""!==t.value)if(r=e.name,null===t.type){const e=c.closest(".cmp--ta.cmp"),s=e?.querySelector("textarea");s&&(s.value=t.value,e?.classList.add("filled"))}else if("checkbox"===t.type){const e=c.closest(".cmp--form-item.cmp");t.value.split(", ").forEach((t=>{const r=s(`//label[text()="${t}"]`,e,0),i=r?.closest(".cmp--cb.cmp"),c=i?.querySelector("input");c&&(c.checked=!0,i?.classList.add("checked"),c.dispatchEvent(new Event("change")))}))}else if("radio"===t.type){const e=c.closest(".cmp--form-item.cmp"),r=s(`//label[text()="${t.value}"]`,e,0),i=r?.closest(".cmp--rb.cmp"),n=i?.querySelector("input");n&&(n.checked=!0,i?.classList.add("checked"),n.dispatchEvent(new Event("change")))}else{const e=c.closest(".cmp--tf.cmp"),s=e?.querySelector("input");s&&(s.value=t.value,e?.classList.add("filled"))}}))})),r}(JSON.parse(t.data),this.form);this.setStepsActivity(),this.setCurrentStep(e)}}catch(e){console.error("Error loading saved form:",e)}}setCurrentStep(e){this.formStepPairs.forEach(((t,s)=>{t.name===e&&(this.currentStep=s)})),this.setStepsActivity()}async nextStep(){if(!i(e(this.formStepPairs[this.currentStep].formStep),this.form))return;for(let e=this.currentStep+1;e<this.formStepPairs.length;e++)if(!this.formStepPairs[e].formStepNumber.classList.contains("hidden")){this.currentStep=e;break}this.setStepsActivity();const s=[];this.formStepPairs.forEach((r=>{if(""===r.id||"true"===r.formStep.getAttribute("condition-active")){const i=t(e(r.formStep));s.push({name:r.name,form:i})}}));try{const e=await fetch("https://gecko-form-tool-be-new.vercel.app/api/forms/save-step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:localStorage.getItem("form-save-id")||void 0,data:{categories:s},token:this.accessKey})}),t=await e.json();t.id&&localStorage.setItem("form-save-id",t.id)}catch(e){console.error("Error saving form step:",e)}}previousStep(){for(let e=this.currentStep-1;e>=0;e--)if(!this.formStepPairs[e].formStepNumber.classList.contains("hidden")){this.currentStep=e;break}this.setStepsActivity()}addEventListeners(){this.nextStepButton&&this.nextStepButton.addEventListener("click",(()=>this.nextStep())),this.previousStepButton&&this.previousStepButton.addEventListener("click",(()=>this.previousStep()))}}function n(e){const t=document.cookie.split("; ");for(let s=0;s<t.length;s++){const r=t[s].split("=");if(r[0]===e)return decodeURIComponent(r[1])}return null}function o(e){const t=e.querySelector(".wr_ico--tf-pre-lead.wr_ico, .wr_ico--tf-suf-lead.wr_ico, .wr_ico--tf-lead.wr_ico");if(!t)return;const s=function(e,t){let s=e;for(;s&&s.classList;){if(t.some((e=>s?.classList.contains(e))))return s;s=s.parentElement}return null}(t,["cmp--tf-pre","cmp--tf-main","cmp--tf-suf"]);if(!s)return;const r=s.querySelector("fieldset");if(!r)return;const i=s.firstChild,c=(s.offsetWidth,parseFloat(getComputedStyle(r).paddingLeft));let n=0;i&&(n=parseFloat(getComputedStyle(i).gap)||0);const o=t.offsetWidth+n+c;r.style.paddingLeft=`${o}px`}class a{constructor(e,t,s){this.serverUrl="https://gecko-form-tool-be-new.vercel.app/api/forms/submit",this.form=e,this.accessKey=t,this.captchaKey=s}getGoogleAdsData(){return{keyword:n("keyword")||void 0,campaign:n("campaignid")||void 0,location:n("loc_physical_ms")||void 0,adGroupID:n("adgroupid")||void 0,feedItemID:n("feeditemid")||void 0,extensionID:n("extensionid")||void 0,targetID:n("targetid")||void 0,locInterestMS:n("loc_interest_ms")||void 0,matchType:n("matchtype")||void 0,network:n("network")||void 0,device:n("device")||void 0,deviceModel:n("devicemodel")||void 0,gclid:n("gclid")||void 0,creative:n("creative")||void 0,placement:n("placement")||void 0,target:n("target")||void 0,adPosition:n("adposition")||void 0}}getMetaAdsData(){return{ad_id:n("fb_ad_id")||void 0,adset_id:n("fb_adset_id")||void 0,campaign_id:n("fb_campaign_id")||void 0,placement:n("fb_placement")||void 0,site_source_name:n("fb_site_source_name")||void 0,creative_id:n("fb_creative_id")||void 0,product_id:n("fb_product_id")||void 0,product_group_id:n("fb_product_group_id")||void 0,product_category:n("fb_product_category")||void 0,source:n("fb_source")||void 0,publisher_platform:n("fb_publisher_platform")||void 0,platform_position:n("fb_platform_position")||void 0,region:n("fb_region")||void 0,device_type:n("fb_device_type")||void 0,targeting:n("fb_targeting")||void 0,ad_format:n("fb_ad_format")||void 0,click_id:n("fb_click_id")||void 0,ad_name:n("fb_ad_name")||void 0,campaign_name:n("fb_campaign_name")||void 0,adset_name:n("fb_adset_name")||void 0}}async submitForm(e){try{const t=await fetch(this.serverUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error("Network response was not ok");const s=await t.json();this.handleSuccess(s)}catch(e){console.error("Error during sending data:",e)}}handleSuccess(e){void 0!==window.gtag_report_conversion&&window.gtag_report_conversion(),void 0!==window.dataLayer&&window.dataLayer.push({event:"form_conversion"});const t=this.form.querySelector(".wr_btn--form-control-submit.wr_btn");if(t){const e=t.getAttribute("target-link");e&&(window.location.href=e)}this.form.querySelector(".cmp--form-steps.cmp")?.classList.add("hidden");this.form.querySelectorAll(".cmp--form.cmp").forEach((e=>{Array.from(e.classList).includes("cmp--form")?e.classList.add("hidden"):e.querySelector(".cmp--form.cmp")?.classList.add("hidden")})),this.form.querySelector(".cmp--btn-group.cmp")?.classList.add("hidden");const s=this.form.querySelector(".cmp--form-success.cmp");s&&(s.classList.remove("hidden"),s.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}))}async handleSubmit(s){const r=e(this.form),c=i(r,this.form);if(console.log(c),console.log(r),!c)return;const n=[],o=this.form.querySelectorAll(".cmp--form.cmp");if(console.log(o),1===o.length){const s=t(e(o[0]));n.push({name:o[0].getAttribute("name")||"",form:s})}else o.forEach((s=>{if(console.log(s.getAttribute("id")),console.log(s.getAttribute("condition-active")),console.log(!(""!==s.getAttribute("id")&&"true"!==s.getAttribute("condition-active"))),""===s.getAttribute("id")||"true"===s.getAttribute("condition-active")){const r=t(e(s));n.push({name:s.getAttribute("name")||"",form:r})}}));try{window.fbq("track","Lead")}catch(e){}const a={formData:{categories:n},test:this.accessKey,token:this.captchaKey||void 0,id:localStorage.getItem("form-save-id")||void 0,googleAds:this.getGoogleAdsData(),metaAds:this.getMetaAdsData()},d=s.target.closest(".wr_btn--form-control-submit.wr_btn");if(!d)return;d.classList.add("pending"),d.setAttribute("disabled","true");const l=d.getAttribute("pending-text")||"Loading...";s.target.textContent=l,await this.submitForm(a)}}return(new class{constructor(){this.formSteps=null,this.formSubmission=null,this.currentScript=this.getCurrentScript();const e=this.currentScript.src,t=new URLSearchParams(e.split("?")[1]);this.accessKey=t.get("key")??"fd821fc7-53b3-4f4c-b3b0-f4adf10491c7",this.formName=t.get("form")??"Testformular",this.captchaKey=t.get("captcha-key"),console.log("Form Submit v0.2.38"),this.form=document.querySelector(`[name="${this.formName}"]`)}getCurrentScript(){if(document.currentScript)return document.currentScript;const e=document.getElementsByTagName("script");return e[e.length-1]}unwrapElements(){document.querySelectorAll('[unwrap="true"]').forEach((e=>{const t=e.parentNode;for(;e.firstChild;)t?.insertBefore(e.firstChild,e);t?.removeChild(e)}))}setupFormFields(){document.querySelectorAll(".cmp--tf.cmp").forEach((e=>{o(e);const t=e.querySelector(".lbl--tf-pre");if(t){new MutationObserver((t=>{t.forEach((t=>{"childList"!==t.type&&"characterData"!==t.type||o(e)}))})).observe(t,{childList:!0,characterData:!0})}e.querySelectorAll(".cmp--tf-pre.cmp, .cmp--tf-main.cmp, .cmp--tf-suf.cmp").forEach((t=>{const s=t.querySelector("input");s&&(s.placeholder&&t.classList.add("filled"),t.addEventListener("click",(()=>{t.classList.add("focused"),s.focus()})),s.addEventListener("focus",(()=>{t.classList.add("focused")})),s.addEventListener("blur",(()=>{s.placeholder&&t.classList.add("filled"),""===s.value?(t.classList.remove("focused"),t.classList.remove("filled")):t.classList.add("filled"),t.querySelector(".cmp--tf-md.cmp")&&!e.querySelector(".cmp--tf-md.cmp.hidden")||(r({type:s.type,required:s.required,value:s.value,name:s.name,label:s?.labels?.[0]?.textContent??"",item:s})?(t.classList.remove("error"),t.classList.add("success")):(t.classList.add("error"),t.classList.remove("success")))})))}))})),document.querySelectorAll(".cmp--cb.cmp").forEach((e=>{const t=e.querySelector("input");t&&e.addEventListener("click",(s=>{s.target!==t&&(t.checked=!t.checked),t.checked?e.classList.add("checked"):e.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${t.name}"]`).forEach((e=>{e.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--rb.cmp").forEach((e=>{const t=e.querySelector("input");t&&e.addEventListener("click",(()=>{this.form?.querySelectorAll(`input[name="${t.name}"]`).forEach((e=>{const t=e.closest(".cmp--rb.cmp");t&&t.classList.remove("checked")})),t.checked=!0,this.form?.querySelectorAll(`input[name="${t.name}"]`).forEach((e=>{e.dispatchEvent(new Event("change"))})),e.classList.add("checked")}))})),document.querySelectorAll(".cmp--sw.cmp").forEach((e=>{const t=e.querySelector("input");t&&e.addEventListener("click",(s=>{s.target!==t&&(t.checked=!t.checked),t.checked?e.classList.add("checked"):e.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${t.name}"]`).forEach((e=>{e.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--ct.cmp").forEach((e=>{const t=e.querySelector("input");t&&e.addEventListener("click",(s=>{s.target!==t&&(t.checked=!t.checked),t.checked?e.classList.add("checked"):e.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${t.name}"]`).forEach((e=>{e.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--ta.cmp").forEach((e=>{const t=e.querySelector("textarea");t&&(e.addEventListener("click",(()=>{e.classList.add("focused"),t.focus()})),t.addEventListener("focus",(()=>{e.classList.add("focused")})),t.addEventListener("blur",(()=>{""===t.value?(e.classList.remove("focused"),e.classList.remove("filled")):e.classList.add("filled"),r({type:t.type,required:t.required,value:t.value,name:t.name,label:t?.labels?.[0]?.textContent??"",item:t})?(e.classList.remove("error"),e.classList.add("success")):(e.classList.add("error"),e.classList.remove("success"))})))})),this.setupSelectAndDatepicker(),this.setupDragAndDrop()}setupSelectAndDatepicker(){document.querySelectorAll(".cmp--tf-md.cmp").forEach((e=>{let t=e.closest(".cmp--tf.cmp");if(!t)return;const s=t.querySelector(".cmp.cmp--tf-pre"),r=t.querySelector(".cmp.cmp--tf-suf");t=s??r??t;const i=t?.querySelector("input")??t?.querySelector(".lbl--tf-pre.lbl")??t?.querySelector(".lbl--tf-suf.lbl"),c=Array.from(t?.querySelectorAll(".cmp--tf-md-option.cmp")||[]);i&&(0===c.length||"true"===e.getAttribute("generate")?"country-code"===e.getAttribute("data-type")?this.setupCountryCodePicker(i,e,c):this.setupDatePicker(i,t):this.setupOptions(i,t,c),t.addEventListener("click",(()=>{t.querySelector(".el--tf-md-overlay.el")?.classList.remove("hidden"),t.querySelector(".cmp--tf-md.cmp")?.classList.remove("hidden")})),t.querySelector(".el--tf-md-overlay.el")?.addEventListener("click",(e=>{e.stopPropagation(),t.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),t.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),i.dispatchEvent(new Event("blur"))})))}))}setupCountryCodePicker(e,t,s){const r=t.querySelector(".el--tf-md-overlay.el");fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json").then((e=>e.json())).then((i=>{const c=t.lastChild?.lastChild;if(!c)return;c.innerHTML="";const n=i.filter((e=>!s.find((t=>t.textContent?.trim()===`${e.emoji} ${e.code} ${e.dial_code}`))));let o=s.map((e=>({item:e,seperator:!1})));if(o.length>0){const e=document.createElement("div");e.className="el--tf-md-sep el",o.push({item:e,seperator:!0})}o=o.concat(n.map((e=>{const t=document.createElement("div");return t.className="cmp--tf-md-option cmp",t.innerHTML=`\n              <div class="lyt--tf-md-option lyt">\n                <div class="wr_ico--tf-md-option wr_ico">\n                ${e.emoji}\n                </div>\n                <div class="wr_lbl--tf-md-option wr_lbl">\n                  <label class="lbl--tf-md-option lbl"> ${e.code} ${e.dial_code}</label>\n                </div>\n              </div>\n            `,{item:t,seperator:!1}}))),o.forEach((s=>{s.seperator||s.item.addEventListener("click",(i=>{i.stopPropagation();const n=function(e){return e.replace(/\s+/g," ").trim()}(s.item.textContent||"");e.value=n,e.innerHTML=n,c.classList.add("filled"),r?.classList.add("hidden"),t.classList.add("hidden"),c.classList.add("success"),c.classList.remove("error"),o.forEach((e=>{e.item.classList.remove("hidden"),e.item.classList.remove("checked")})),s.item.classList.add("checked"),e.dispatchEvent(new Event("blur"))})),c.appendChild(s.item)})),c.addEventListener("click",(()=>{r?.classList.remove("hidden"),t.classList.remove("hidden")})),r?.addEventListener("click",(s=>{s.stopPropagation(),r.classList.add("hidden"),t.classList.add("hidden"),e.dispatchEvent(new Event("blur"))}))}))}setupDatePicker(e,t){const s=[{short:"JAN",long:"Januar",index:0},{short:"FEB",long:"Februar",index:1},{short:"MAR",long:"März",index:2},{short:"APR",long:"April",index:3},{short:"MAY",long:"Mai",index:4},{short:"JUN",long:"Juni",index:5},{short:"JUL",long:"Juli",index:6},{short:"AUG",long:"August",index:7},{short:"SEP",long:"September",index:8},{short:"OCT",long:"Oktober",index:9},{short:"NOV",long:"November",index:10},{short:"DEC",long:"Dezember",index:11}],r=(e,t)=>new Date(t,e+1,0).getDate();e.addEventListener("input",(t=>{t.stopPropagation(),e.value=""}));let i=(new Date).getFullYear(),c=(new Date).getMonth(),n="";if(e.value){const[t,r,o]=e.value.split(".");i=parseInt(o),c=parseInt(r)-1,n=`${t}-${s[c].short}-${i}`}let o="dp";const a=e=>e<10?"0"+e:e.toString(),d=()=>{const o=t.querySelector(".cmp--dp.cmp");if(!o)return;o.innerHTML="";const l=document.createElement("div");l.className="lyt--dp lyt",o.appendChild(l);const p=((e,t)=>{const s=new Date(t,e,1).getDay();return 0===s?6:s-1})(c,i),m=r(c,i),u=r(c-1,i);let f=(7-(p+m)%7)%7,v=1,h=1;for(let r=0;r<42;r++){const o=document.createElement("div");if(o.className="cmp--dp-day cmp",r<p)o.classList.add("dif-month"),o.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${u-(p-r-1)}</p></div></div>`;else if(v>m){if(f<=0)break;f--,o.classList.add("dif-month"),o.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${h++}</p></div></div>`}else`${a(v)}-${s[c].short}-${i}`===n&&o.classList.add("selected"),(r+1)%7!=6&&(r+1)%7!=0||o.classList.add("weekend"),o.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${a(v)}</p></div></div>`,o.addEventListener("click",(r=>{r.stopPropagation(),n=`${r.target.innerText.trim()}-${s[c].short}-${i}`,d(),e.value=`${r.target.innerText.trim()}.${a(s[c].index+1)}.${i}`,t.classList.add("filled"),t.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),t.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),e.dispatchEvent(new Event("blur"))})),v++;l.appendChild(o)}const y=t.querySelector(".cmp--dtp-nav-btn p");y&&(y.textContent=`${s[c].long} ${i}`)},l=()=>{const e=t.querySelector(".cmp--mp.cmp");if(!e)return;e.innerHTML="";const r=document.createElement("div");r.className="lyt--mp lyt",e.appendChild(r),s.forEach(((e,t)=>{const s=document.createElement("div");s.className="cmp--mp-month cmp",t===c&&s.classList.add("selected"),s.innerHTML=`<div class="lyt--mp-month lyt"><div class="wr_p--mp-month wr_p"><p class="p--m">${e.short}</p></div></div>`,s.addEventListener("click",(()=>{c=t,o="dp",m()})),r.appendChild(s)}))},p=()=>{const e=t.querySelector(".cmp--yp.cmp");if(!e)return;e.innerHTML="";const s=document.createElement("div");s.className="lyt--yp lyt",e.appendChild(s);for(let e=(new Date).getFullYear()+1;e>=1900;e--){const t=document.createElement("div");t.className="cmp--yp-year cmp",e===i&&t.classList.add("selected"),t.innerHTML=`<div class="lyt--yp-year lyt"><div class="wr_p--yp-year wr_p"><p class="p--m">${e}</p></div></div>`,t.addEventListener("click",(()=>{i=e,o="mp",m()})),s.appendChild(t)}},m=()=>{const e=t.querySelector(".cmp--dp.cmp"),r=t.querySelector(".cmp--mp.cmp"),n=t.querySelector(".cmp--yp.cmp");if(!e||!r||!n)return;e.classList.add("hidden"),r.classList.add("hidden"),n.classList.add("hidden"),"dp"===o?(e.classList.remove("hidden"),d()):"mp"===o?(r.classList.remove("hidden"),l()):"yp"===o&&(n.classList.remove("hidden"),p());const a=t.querySelector(".cmp--dtp-nav-btn p");a&&(a.textContent=`${s[c].long} ${i}`)},u=t.querySelector(".cmp--dtp.cmp");if(!u)return;u.innerHTML='\n      <div class="lyt--dtp lyt"></div>\n      <div class="cmp--dp cmp hidden"></div>\n      <div class="cmp--mp cmp hidden"></div>\n      <div class="cmp--yp cmp hidden"></div>\n    ';const f=t.querySelector(".lyt--dtp.lyt");if(!f)return;const v=`\n      <div class="cmp--dtp-nav cmp">\n        <div class="lyt--dtp-nav lyt">\n          <div class="cmp--dtp-nav-prevnext cmp prev">\n            <div class="lyt--dtp-nav-prevnext lyt">\n              <div class="wr_ico--dtp-nav-prevnext wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M560-240 320-480l240-240 56 56-184 184 184 184z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div class="cmp--dtp-nav-btn cmp">\n            <div class="lyt--dtp-nav-btn lyt">\n              <div class="wr_p--date-nav-btn wr_p">\n                <p class="p--m">${s[c].long} ${i}</p>\n              </div>\n              <div class="wr_ico--dtp-nav-btn wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M480-345 240-585l56-56 184 184 184-184 56 56z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div class="cmp--dtp-nav-prevnext cmp next">\n            <div class="lyt--dtp-nav-prevnext lyt">\n              <div class="wr_ico--dtp-nav-prevnext wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M504-480 320-664l56-56 240 240-240 240-56-56z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>`;f.innerHTML=v;const h=document.createElement("div");h.className="cmp--dp cmp hidden",f.appendChild(h);const y=document.createElement("div");y.className="cmp--mp cmp hidden",f.appendChild(y);const g=document.createElement("div");g.className="cmp--yp cmp hidden",f.appendChild(g);const S=()=>{"dp"===o?(c--,c<0&&(c=11,i--),d()):"mp"===o?(i--,l()):"yp"===o&&(i-=10,p())},L=()=>{"dp"===o?(c++,c>11&&(c=0,i++),d()):"mp"===o?(i++,l()):"yp"===o&&(i+=10,p())},b=t.querySelector(".cmp--dtp-nav-prevnext.prev"),w=t.querySelector(".cmp--dtp-nav-prevnext.next"),E=t.querySelector(".cmp--dtp-nav-btn.cmp");b&&b.addEventListener("click",S),w&&w.addEventListener("click",L),E&&E.addEventListener("click",(()=>{"dp"===o?o="mp":"mp"===o?o="yp":"yp"===o&&(o="mp"),m()})),o="dp",m()}setupOptions(e,t,s){s.forEach((r=>{r.addEventListener("click",(i=>{i.stopPropagation(),e.value=r.textContent?.trim()||"",t.classList.add("filled"),t.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),t.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),t.classList.add("success"),t.classList.remove("error"),s.forEach((e=>{e.classList.remove("hidden"),e.classList.remove("checked")})),e.dispatchEvent(new Event("blur")),r.classList.add("checked")}))})),e.addEventListener("input",(e=>{const t=e.target.value.toLowerCase(),r=s.find((e=>e.textContent?.trim().toLowerCase()===t));s.forEach((e=>{e.textContent?.trim().toLowerCase().includes(t)||r?e.classList.remove("hidden"):e.classList.add("hidden")}))}))}setupDragAndDrop(){const e=this.form?.querySelector(".cmp--fu.cmp");if(!e)return;const t=e.querySelector(".cmp--fu-drag.cmp"),s=e.querySelector("input"),r=e.querySelector(".lyt--fu-uploads.lyt");if(!t||!s||!r)return;e.addEventListener("click",(()=>{s.click()}));const i=e=>{if(e&&0!==e.length){r.parentElement?.classList.remove("hidden"),r.innerHTML="";for(let t=0;t<e.length;t++){const c=e[t],n=document.createElement("div");n.className="cmp--fu-upload cmp",n.innerHTML=`\n          <div class="lyt--fu-upload lyt">\n            ${c.type.startsWith("image/")?`<div class="cmp--fu-upload-preview cmp">\n                  <div class="lyt--fu-upload-preview lyt">\n                    <div class="wr_img--fu-upload-preview wr_img">\n                      <img src="${URL.createObjectURL(c)}" alt="${c.name}" />\n                    </div>\n                  </div>\n                </div>`:`<div class="cmp--fu-upload-name cmp">\n                  <div class="lyt--fu-upload-name lyt">\n                    <div class="wr_p--fu-upload-name wr_p">\n                      <p class="p--m">${c.name}</p>\n                    </div>\n                  </div>\n                </div>`}\n            <div class="cmp--fu-upload-delete cmp">\n              <div class="lyt--fu-upload-delete lyt">\n                <div class="wr_ico--fu-upload-delete wr_ico">\n                  <div class="ico--fu-upload-delete w-embed">\n                    <svg viewBox="0 0 9 9" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.57684 8.9231L8.93713 7.56274L5.86017 4.48853L8.93713 1.41797L7.57812 0.0563965L4.49994 3.12939L1.42303 0.0539551L0.0627441 1.41406L3.13843 4.48853L0.0627441 7.55908L1.42175 8.91919L4.49866 5.84741L7.57684 8.9231Z"></path>\n                    </svg>\n                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n        `;const o=n.querySelector(".cmp--fu-upload-delete.cmp");o&&o.addEventListener("click",(r=>{r.stopPropagation();const c=new DataTransfer;for(let s=0;s<e.length;s++)s!==t&&c.items.add(e[s]);s.files=c.files,i(s.files)})),r.appendChild(n)}}else r.parentElement?.classList.add("hidden")};s.addEventListener("change",(e=>{const r=e.target.files;if(!r||0===r.length)return;const c=s.getAttribute("accept")?.split(",")||[];let n=!1;for(let e=0;e<r.length;e++)if(c.length>0&&!c.some((t=>r[e].type.match(t.replace("*",".*"))))){n=!0;break}if(n)return void t.classList.add("error");t.classList.remove("error");const o=new DataTransfer;s.files&&Array.from(s.files).forEach((e=>{o.items.add(e)})),Array.from(r).forEach((e=>{o.items.add(e)})),s.files=o.files,i(s.files)})),document.body.addEventListener("dragover",(e=>{e.preventDefault(),t.classList.add("dragging"),t.classList.remove("hidden")})),document.body.addEventListener("dragleave",(e=>{e.preventDefault();const s=e.relatedTarget;t.contains(s)||(t.classList.remove("dragging"),t.classList.add("hidden"))})),document.body.addEventListener("drop",(e=>{e.preventDefault(),t.classList.remove("dragging"),t.classList.add("hidden"),(e=>{if(!e||0===e.length)return;const r=s.getAttribute("accept")?.split(",")||[];let c=!1;for(let t=0;t<e.length;t++)if(r.length>0&&!r.some((s=>e[t].type.match(s.replace("*",".*"))))){c=!0;break}if(c)return void t.classList.add("error");t.classList.remove("error"),console.log("handleFiles",e);const n=new DataTransfer;s.files&&Array.from(s.files).forEach((e=>{n.items.add(e)})),Array.from(e).forEach((e=>{n.items.add(e)})),i(n.files)})(e.dataTransfer?.files||null)}))}init(){if(!this.form)return;this.unwrapElements(),this.setupFormFields(),this.form.querySelector(".cmp--form-steps.cmp")&&(this.formSteps=new c(this.form,this.accessKey),this.formSteps.init(),this.formSteps.addEventListeners()),this.formSubmission=new a(this.form,this.accessKey,this.captchaKey);const e=this.form.querySelector(".wr_btn--form-control-submit.wr_btn");e&&e.addEventListener("click",(e=>this.formSubmission?.handleSubmit(e)))}}).init(),{}})()));