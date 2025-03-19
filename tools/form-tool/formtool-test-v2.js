!function webpackUniversalModuleDefinition(root,factory){"object"==typeof exports&&"object"==typeof module?module.exports=factory():"function"==typeof define&&define.amd?define([],factory):"object"==typeof exports?exports.FormTool=factory():root.FormTool=factory()}(this,(()=>(()=>{"use strict";function getFields(parent){const fields=[];return Array.from(parent.querySelectorAll("input, textarea")).filter((el=>!el.closest('[condition-active="false"]'))).forEach((field=>{const type=field.getAttribute("type"),required=field.required,value=field.value,customValidatorRegex=field.getAttribute("data-validator"),name=field.getAttribute("name")||"",label=field.closest(".cmp--form-item.cmp")?.querySelector(".lbl")?.innerText||"";"radio"===type||"checkbox"===type?fields.push({type,required,name,item:field,value:field.closest(".cmp")?.querySelector(".lbl")?.innerText||"",checked:field.checked,variable:field.getAttribute("data-variable")||void 0,customValidatorRegex:customValidatorRegex||void 0,label}):fields.push({type:type||null,required,value,customValidatorRegex:customValidatorRegex||void 0,item:field,name,label,variable:field.getAttribute("data-variable")||void 0})})),fields}function convertFieldsToFormData(fields){const allFields=[];return fields.forEach((field=>{const req={type:field.type,value:field.value,label:field.label,name:field.name,required:field.required,item:field.item};if(field.variable&&(req.variable=field.variable),"radio"===field.type||"checkbox"===field.type){if(field.checked){const existingField=allFields.find((f=>f.label===field.label));existingField?existingField.value=`${existingField.value}, ${field.value}`:allFields.push(req)}}else allFields.push(req)})),allFields}function getElementByXpathWithIndex(xpath,parent,index){const xpathResult=document.evaluate(xpath,document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);let elements=[];for(let i=0;i<xpathResult.snapshotLength;i++)elements.push(xpathResult.snapshotItem(i));return elements.filter((element=>parent.contains(element)))[index]||null}function validateTextInput(field){const{value,required,customValidatorRegex,type}=field;if(required){if(customValidatorRegex&&!new RegExp(customValidatorRegex).test(value))return!1;if(""===value)return!1;if("email"===type&&!new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$").test(value))return!1;if("tel"===type&&!new RegExp("^\\+?(\\d{1,4})?[\\s.-]?(\\d{1,4})?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}$").test(value))return!1;if("password"===type&&!new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$").test(value))return!1}return!0}function validateFields(fields,form){let isValid=!0;return fields.forEach((field=>{let fieldIsValid=!0;fieldIsValid="checkbox"===field.type?function validateCheckbox(field,form){const{required,name}=field,checkboxes=form.querySelectorAll(`input[name="${name}"]`);let oneChecked=!1;return checkboxes.forEach((checkbox=>{checkbox.checked&&(oneChecked=!0)})),!(required&&!oneChecked)}(field,form):"radio"===field.type?function validateRadio(field,form){const{required,name}=field,radios=form.querySelectorAll(`input[name="${name}"]`);let oneChecked=!1;return radios.forEach((radio=>{radio.checked&&(oneChecked=!0)})),!(required&&!oneChecked)}(field,form):validateTextInput(field);const formItem=field.item.closest(".lyt--form-item.lyt");if(formItem){const lastChild=formItem.lastChild;fieldIsValid?lastChild.classList.remove("error"):lastChild.classList.add("error")}isValid&&(isValid=fieldIsValid)})),isValid}class FormSteps{constructor(form,accessKey){this.currentStep=0,this.formStepPairs=[],this.form=form,this.accessKey=accessKey,this.nextStepButton=form.querySelector(".wr_btn--form-control-next.wr_btn"),this.previousStepButton=form.querySelector(".wr_btn--form-control-prev.wr_btn"),this.submitButton=form.querySelector(".wr_btn--form-control-submit.wr_btn")}setStepsActivity(){if(!this.previousStepButton||!this.submitButton||!this.nextStepButton)return;this.previousStepButton.classList.add("hidden"),this.submitButton.classList.add("hidden"),this.nextStepButton.classList.remove("hidden");let lastActiveIndex=0;if(this.formStepPairs.forEach(((formStep,index)=>{if(formStep.formStepNumber.classList.remove("completed"),formStep.formStepNumber.classList.remove("active"),formStep.formStepNumber.classList.remove("locked"),""!==formStep.id&&"true"!==formStep.formStep.getAttribute("condition-active"))formStep.formStepNumber.classList.add("hidden");else{formStep.formStepNumber.classList.remove("hidden");const stepNumber=formStep.formStepNumber.querySelector(".p--form-step-nr");stepNumber&&(stepNumber.textContent=(lastActiveIndex+1).toString()),lastActiveIndex++}index===this.currentStep?(formStep.formStepNumber.classList.add("active"),formStep.formStep.classList.remove("hidden")):(formStep.formStepNumber.classList.remove("locked"),formStep.formStep.classList.add("hidden"),index<this.currentStep?formStep.formStepNumber.classList.add("completed"):formStep.formStepNumber.classList.add("locked"))})),this.currentStep>0&&this.previousStepButton.classList.remove("hidden"),this.currentStep===this.formStepPairs.length-1)this.nextStepButton.classList.add("hidden"),this.submitButton.classList.remove("hidden");else{const currentStepNumber=this.formStepPairs[this.currentStep].formStepNumber.querySelector(".p--form-step-nr");currentStepNumber&&lastActiveIndex===parseInt(currentStepNumber.textContent||"0")&&(this.nextStepButton.classList.add("hidden"),this.submitButton.classList.remove("hidden"))}}init(){const formSteps=this.form.querySelectorAll(".cmp--form.cmp"),formStepNumbers=this.form.querySelectorAll(".cmp--form-step.cmp");formSteps.forEach(((formStep,index)=>{this.formStepPairs.push({formStep,formStepNumber:formStepNumbers[index],name:formStep.getAttribute("name")||"",id:formStep.getAttribute("id")||""}),formStep.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((input=>{input.getAttribute("conditional-step")&&input.addEventListener("change",(e=>{const conditionalSteps=e.target.getAttribute("conditional-step")?.replace(" ","").split(",")||[];this.formStepPairs.forEach((formStep=>{e.target.checked?conditionalSteps.includes(formStep.id)&&(formStep.formStepNumber.classList.remove("hidden"),formStep.formStep.setAttribute("condition-active","true")):conditionalSteps.includes(formStep.id)&&(formStep.formStepNumber.classList.add("hidden"),formStep.formStep.setAttribute("condition-active","false"))})),this.setStepsActivity()}))}))})),this.setStepsActivity(),localStorage.getItem("form-save-id")&&this.loadSavedForm()}async loadSavedForm(){try{const response=await fetch(`https://gecko-form-tool-be-new.vercel.app/api/forms/save-step/${localStorage.getItem("form-save-id")}`,{method:"GET",headers:{"Content-Type":"application/json"}}),data=await response.json();if(data.data){const lastStepName=function convertFormDataToFields(formData,form){let lastStepName="";return formData.categories.forEach((category=>{const formStepParent=form.querySelector(`[name="${category.name}"]`);formStepParent&&category.form.forEach((field=>{const labelEl=getElementByXpathWithIndex(`//label[text()="${field.label}"]`,formStepParent,0);if(labelEl&&""!==field.value)if(lastStepName=category.name,null===field.type){const parent=labelEl.closest(".cmp--ta.cmp"),input=parent?.querySelector("textarea");input&&(input.value=field.value,parent?.classList.add("filled"))}else if("checkbox"===field.type){const parent=labelEl.closest(".cmp--form-item.cmp");field.value.split(", ").forEach((item=>{const inputLabel=getElementByXpathWithIndex(`//label[text()="${item}"]`,parent,0),inputParent=inputLabel?.closest(".cmp--cb.cmp"),input=inputParent?.querySelector("input");input&&(input.checked=!0,inputParent?.classList.add("checked"),input.dispatchEvent(new Event("change")))}))}else if("radio"===field.type){const parent=labelEl.closest(".cmp--form-item.cmp"),inputLabel=getElementByXpathWithIndex(`//label[text()="${field.value}"]`,parent,0),inputParent=inputLabel?.closest(".cmp--rb.cmp"),input=inputParent?.querySelector("input");input&&(input.checked=!0,inputParent?.classList.add("checked"),input.dispatchEvent(new Event("change")))}else{const parent=labelEl.closest(".cmp--tf.cmp"),input=parent?.querySelector("input");input&&(input.value=field.value,parent?.classList.add("filled"))}}))})),lastStepName}(JSON.parse(data.data),this.form);this.setStepsActivity(),this.setCurrentStep(lastStepName)}}catch(error){console.error("Error loading saved form:",error)}}setCurrentStep(stepName){this.formStepPairs.forEach(((formStep,index)=>{formStep.name===stepName&&(this.currentStep=index)})),this.setStepsActivity()}async nextStep(){if(!validateFields(getFields(this.formStepPairs[this.currentStep].formStep),this.form))return;for(let i=this.currentStep+1;i<this.formStepPairs.length;i++)if(!this.formStepPairs[i].formStepNumber.classList.contains("hidden")){this.currentStep=i;break}this.setStepsActivity();const categories=[];this.formStepPairs.forEach((formStep=>{if(""===formStep.id||"true"===formStep.formStep.getAttribute("condition-active")){const fields=convertFieldsToFormData(getFields(formStep.formStep));categories.push({name:formStep.name,form:fields})}}));try{const response=await fetch("https://gecko-form-tool-be-new.vercel.app/api/forms/save-step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:localStorage.getItem("form-save-id")||void 0,data:{categories},token:this.accessKey})}),data=await response.json();data.id&&localStorage.setItem("form-save-id",data.id)}catch(error){console.error("Error saving form step:",error)}}previousStep(){for(let i=this.currentStep-1;i>=0;i--)if(!this.formStepPairs[i].formStepNumber.classList.contains("hidden")){this.currentStep=i;break}this.setStepsActivity()}addEventListeners(){this.nextStepButton&&this.nextStepButton.addEventListener("click",(()=>this.nextStep())),this.previousStepButton&&this.previousStepButton.addEventListener("click",(()=>this.previousStep()))}}function getCookie(name){const cookieArray=document.cookie.split("; ");for(let i=0;i<cookieArray.length;i++){const cookie=cookieArray[i].split("=");if(cookie[0]===name)return decodeURIComponent(cookie[1])}return null}function updatePadding(tfElement){const iconElement=tfElement.querySelector(".wr_ico--tf-pre-lead.wr_ico, .wr_ico--tf-suf-lead.wr_ico, .wr_ico--tf-lead.wr_ico");if(!iconElement)return;const parentContainer=function findParentWithClass(element,classNames){let current=element;for(;current&&current.classList;){if(classNames.some((className=>current?.classList.contains(className))))return current;current=current.parentElement}return null}(iconElement,["cmp--tf-pre","cmp--tf-main","cmp--tf-suf"]);if(!parentContainer)return;const targetFieldset=parentContainer.querySelector("fieldset");if(!targetFieldset)return;const lytElement=parentContainer.firstChild,tfLeftPadding=(parentContainer.offsetWidth,parseFloat(getComputedStyle(targetFieldset).paddingLeft));let lytGap=0;lytElement&&(lytGap=parseFloat(getComputedStyle(lytElement).gap)||0);const computedPaddingLeft=iconElement.offsetWidth+lytGap+tfLeftPadding;targetFieldset.style.paddingLeft=`${computedPaddingLeft}px`}class FormSubmission{constructor(form,accessKey,captchaKey){this.serverUrl="https://gecko-form-tool-be-new.vercel.app/api/forms/submit",this.form=form,this.accessKey=accessKey,this.captchaKey=captchaKey}getGoogleAdsData(){return{keyword:getCookie("keyword")||void 0,campaign:getCookie("campaignid")||void 0,location:getCookie("loc_physical_ms")||void 0,adGroupID:getCookie("adgroupid")||void 0,feedItemID:getCookie("feeditemid")||void 0,extensionID:getCookie("extensionid")||void 0,targetID:getCookie("targetid")||void 0,locInterestMS:getCookie("loc_interest_ms")||void 0,matchType:getCookie("matchtype")||void 0,network:getCookie("network")||void 0,device:getCookie("device")||void 0,deviceModel:getCookie("devicemodel")||void 0,gclid:getCookie("gclid")||void 0,creative:getCookie("creative")||void 0,placement:getCookie("placement")||void 0,target:getCookie("target")||void 0,adPosition:getCookie("adposition")||void 0}}getMetaAdsData(){return{ad_id:getCookie("fb_ad_id")||void 0,adset_id:getCookie("fb_adset_id")||void 0,campaign_id:getCookie("fb_campaign_id")||void 0,placement:getCookie("fb_placement")||void 0,site_source_name:getCookie("fb_site_source_name")||void 0,creative_id:getCookie("fb_creative_id")||void 0,product_id:getCookie("fb_product_id")||void 0,product_group_id:getCookie("fb_product_group_id")||void 0,product_category:getCookie("fb_product_category")||void 0,source:getCookie("fb_source")||void 0,publisher_platform:getCookie("fb_publisher_platform")||void 0,platform_position:getCookie("fb_platform_position")||void 0,region:getCookie("fb_region")||void 0,device_type:getCookie("fb_device_type")||void 0,targeting:getCookie("fb_targeting")||void 0,ad_format:getCookie("fb_ad_format")||void 0,click_id:getCookie("fb_click_id")||void 0,ad_name:getCookie("fb_ad_name")||void 0,campaign_name:getCookie("fb_campaign_name")||void 0,adset_name:getCookie("fb_adset_name")||void 0}}async submitForm(request){try{const response=await fetch(this.serverUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(request)});if(!response.ok)throw new Error("Network response was not ok");const data=await response.json();this.handleSuccess(data)}catch(error){console.error("Error during sending data:",error)}}handleSuccess(data){void 0!==window.gtag_report_conversion&&window.gtag_report_conversion(),void 0!==window.dataLayer&&window.dataLayer.push({event:"form_conversion"});const buttonWrapper=this.form.querySelector(".wr_btn--form-control-submit.wr_btn");if(buttonWrapper){const targetLink=buttonWrapper.getAttribute("target-link");targetLink&&(window.location.href=targetLink)}this.form.querySelector(".cmp--form-steps.cmp")?.classList.add("hidden");this.form.querySelectorAll(".cmp--form.cmp").forEach((formStep=>{Array.from(formStep.classList).includes("cmp--form")?formStep.classList.add("hidden"):formStep.querySelector(".cmp--form.cmp")?.classList.add("hidden")})),this.form.querySelector(".cmp--btn-group.cmp")?.classList.add("hidden");const success=this.form.querySelector(".cmp--form-success.cmp");success&&(success.classList.remove("hidden"),success.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}))}async handleSubmit(e){if(!validateFields(getFields(this.form),this.form))return;const categories=[],formSteps=this.form.querySelectorAll(".cmp--form.cmp");if(1===formSteps.length){const fields=convertFieldsToFormData(getFields(formSteps[0]));categories.push({name:formSteps[0].getAttribute("name")||"",form:fields})}else formSteps.forEach((formStep=>{if(""===formStep.getAttribute("id")||"true"===formStep.getAttribute("condition-active")){const fields=convertFieldsToFormData(getFields(formStep));categories.push({name:formStep.getAttribute("name")||"",form:fields})}}));try{window.fbq("track","Lead")}catch(error){}const request={formData:{categories},test:this.accessKey,token:this.captchaKey||void 0,id:localStorage.getItem("form-save-id")||void 0,googleAds:this.getGoogleAdsData(),metaAds:this.getMetaAdsData()},buttonWrapper=e.target.closest(".wr_btn--form-control-submit.wr_btn");if(!buttonWrapper)return;buttonWrapper.classList.add("pending"),buttonWrapper.setAttribute("disabled","true");const buttonText=buttonWrapper.getAttribute("pending-text")||"Loading...";e.target.textContent=buttonText,await this.submitForm(request)}}class FileHandler{constructor(input,onFilesChanged){this.files=[],this.allowedTypes=[],this.input=input,this.onFilesChanged=onFilesChanged,this.allowedTypes=input.getAttribute("accept")?.split(",")||[],input.files&&input.files.length>0&&this.addFiles(input.files)}addFiles(newFiles){if(!newFiles||0===newFiles.length)return!1;let hasError=!1;for(let i=0;i<newFiles.length;i++){const file=newFiles[i];if(this.allowedTypes.length>0&&!this.allowedTypes.some((type=>file.type.match(type.replace("*",".*"))))){hasError=!0;break}}return!hasError&&(Array.from(newFiles).forEach((file=>{this.files.push(file)})),this.updateInputFiles(),this.onFilesChanged(this.getFilesAsList()),!0)}removeFile(index){index>=0&&index<this.files.length&&(this.files.splice(index,1),this.updateInputFiles(),this.onFilesChanged(this.getFilesAsList()))}clearFiles(){this.files=[],this.updateInputFiles(),this.onFilesChanged((new DataTransfer).files)}getFilesAsList(){const dataTransfer=new DataTransfer;return this.files.forEach((file=>{dataTransfer.items.add(file)})),dataTransfer.files}updateInputFiles(){const dataTransfer=new DataTransfer;this.files.forEach((file=>{dataTransfer.items.add(file)})),this.input.files=dataTransfer.files}}return(new class FormTool{constructor(){this.formSteps=null,this.formSubmission=null,this.currentScript=this.getCurrentScript();const scriptSrc=this.currentScript.src,urlParams=new URLSearchParams(scriptSrc.split("?")[1]);this.accessKey=urlParams.get("key")??"fd821fc7-53b3-4f4c-b3b0-f4adf10491c7",this.formName=urlParams.get("form")??"Testformular",this.captchaKey=urlParams.get("captcha-key"),console.log("Form Submit v0.2.42"),this.form=document.querySelector(`[name="${this.formName}"]`)}getCurrentScript(){if(document.currentScript)return document.currentScript;const scripts=document.getElementsByTagName("script");return scripts[scripts.length-1]}unwrapElements(){document.querySelectorAll('[unwrap="true"]').forEach((element=>{const parent=element.parentNode;for(;element.firstChild;)parent?.insertBefore(element.firstChild,element);parent?.removeChild(element)}))}setupFormFields(){document.querySelectorAll(".cmp--tf.cmp").forEach((tf=>{updatePadding(tf);const preLabel=tf.querySelector(".lbl--tf-pre");if(preLabel){new MutationObserver((mutations=>{mutations.forEach((mutation=>{"childList"!==mutation.type&&"characterData"!==mutation.type||updatePadding(tf)}))})).observe(preLabel,{childList:!0,characterData:!0})}tf.querySelectorAll(".cmp--tf-pre.cmp, .cmp--tf-main.cmp, .cmp--tf-suf.cmp").forEach((parent=>{const input=parent.querySelector("input");input&&(input.placeholder&&parent.classList.add("filled"),parent.addEventListener("click",(()=>{parent.classList.add("focused"),input.focus()})),input.addEventListener("focus",(()=>{parent.classList.add("focused")})),input.addEventListener("blur",(()=>{input.placeholder&&parent.classList.add("filled"),""===input.value?(parent.classList.remove("focused"),parent.classList.remove("filled")):parent.classList.add("filled"),parent.querySelector(".cmp--tf-md.cmp")&&!tf.querySelector(".cmp--tf-md.cmp.hidden")||(validateTextInput({type:input.type,required:input.required,value:input.value,name:input.name,label:input?.labels?.[0]?.textContent??"",item:input})?(parent.classList.remove("error"),parent.classList.add("success")):(parent.classList.add("error"),parent.classList.remove("success")))})))}))})),document.querySelectorAll(".cmp--cb.cmp").forEach((cb=>{const input=cb.querySelector("input");input&&cb.addEventListener("click",(e=>{e.target!==input&&(input.checked=!input.checked),input.checked?cb.classList.add("checked"):cb.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox=>{checkbox.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--rb.cmp").forEach((rb=>{const input=rb.querySelector("input");input&&rb.addEventListener("click",(()=>{this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((rb=>{const parent=rb.closest(".cmp--rb.cmp");parent&&parent.classList.remove("checked")})),input.checked=!0,this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((radioGroupBtn=>{radioGroupBtn.dispatchEvent(new Event("change"))})),rb.classList.add("checked")}))})),document.querySelectorAll(".cmp--sw.cmp").forEach((sw=>{const input=sw.querySelector("input");input&&sw.addEventListener("click",(e=>{e.target!==input&&(input.checked=!input.checked),input.checked?sw.classList.add("checked"):sw.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((switchBtns=>{switchBtns.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--ct.cmp").forEach((ct=>{const input=ct.querySelector("input");input&&ct.addEventListener("click",(e=>{e.target!==input&&(input.checked=!input.checked),input.checked?ct.classList.add("checked"):ct.classList.remove("checked"),this.form?.querySelectorAll(`input[name="${input.name}"]`).forEach((checkbox=>{checkbox.dispatchEvent(new Event("change"))}))}))})),document.querySelectorAll(".cmp--ta.cmp").forEach((ta=>{const input=ta.querySelector("textarea");input&&(ta.addEventListener("click",(()=>{ta.classList.add("focused"),input.focus()})),input.addEventListener("focus",(()=>{ta.classList.add("focused")})),input.addEventListener("blur",(()=>{""===input.value?(ta.classList.remove("focused"),ta.classList.remove("filled")):ta.classList.add("filled"),validateTextInput({type:input.type,required:input.required,value:input.value,name:input.name,label:input?.labels?.[0]?.textContent??"",item:input})?(ta.classList.remove("error"),ta.classList.add("success")):(ta.classList.add("error"),ta.classList.remove("success"))})))})),this.setupSelectAndDatepicker(),this.setupDragAndDrop()}setupSelectAndDatepicker(){document.querySelectorAll(".cmp--tf-md.cmp").forEach((tf=>{let parent=tf.closest(".cmp--tf.cmp");if(!parent)return;const pre=parent.querySelector(".cmp.cmp--tf-pre"),suf=parent.querySelector(".cmp.cmp--tf-suf");parent=pre??suf??parent;const input=parent?.querySelector("input")??parent?.querySelector(".lbl--tf-pre.lbl")??parent?.querySelector(".lbl--tf-suf.lbl"),options=Array.from(parent?.querySelectorAll(".cmp--tf-md-option.cmp")||[]);input&&(0===options.length||"true"===tf.getAttribute("generate")?"country-code"===tf.getAttribute("data-type")?this.setupCountryCodePicker(input,tf,options):this.setupDatePicker(input,parent):this.setupOptions(input,parent,options),parent.addEventListener("click",(()=>{parent.querySelector(".el--tf-md-overlay.el")?.classList.remove("hidden"),parent.querySelector(".cmp--tf-md.cmp")?.classList.remove("hidden")})),parent.querySelector(".el--tf-md-overlay.el")?.addEventListener("click",(e=>{e.stopPropagation(),parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),input.dispatchEvent(new Event("blur"))})))}))}setupCountryCodePicker(input,tf,existingOptions){const overlay=tf.querySelector(".el--tf-md-overlay.el");fetch("https://cloudflare-test-7u4.pages.dev/tools/form-tool/country-codes.json").then((response=>response.json())).then((data=>{const parent=tf.lastChild?.lastChild;if(!parent)return;parent.innerHTML="";const filteredData=data.filter((country=>!existingOptions.find((option=>option.textContent?.trim()===`${country.emoji} ${country.code} ${country.dial_code}`))));let options=existingOptions.map((option=>({item:option,seperator:!1})));if(options.length>0){const seperator=document.createElement("div");seperator.className="el--tf-md-sep el",options.push({item:seperator,seperator:!0})}options=options.concat(filteredData.map((country=>{const option=document.createElement("div");return option.className="cmp--tf-md-option cmp",option.innerHTML=`\n              <div class="lyt--tf-md-option lyt">\n                <div class="wr_ico--tf-md-option wr_ico">\n                ${country.emoji}\n                </div>\n                <div class="wr_lbl--tf-md-option wr_lbl">\n                  <label class="lbl--tf-md-option lbl"> ${country.code} ${country.dial_code}</label>\n                </div>\n              </div>\n            `,{item:option,seperator:!1}}))),options.forEach((option=>{option.seperator||option.item.addEventListener("click",(e=>{e.stopPropagation();const text=function cleanString(input){return input.replace(/\s+/g," ").trim()}(option.item.textContent||"");input.value=text,input.innerHTML=text,parent.classList.add("filled"),overlay?.classList.add("hidden"),tf.classList.add("hidden"),parent.classList.add("success"),parent.classList.remove("error"),options.forEach((option=>{option.item.classList.remove("hidden"),option.item.classList.remove("checked")})),option.item.classList.add("checked"),input.dispatchEvent(new Event("blur"))})),parent.appendChild(option.item)})),parent.addEventListener("click",(()=>{overlay?.classList.remove("hidden"),tf.classList.remove("hidden")})),overlay?.addEventListener("click",(e=>{e.stopPropagation(),overlay.classList.add("hidden"),tf.classList.add("hidden"),input.dispatchEvent(new Event("blur"))}))}))}setupDatePicker(input,parent){const months=[{short:"JAN",long:"Januar",index:0},{short:"FEB",long:"Februar",index:1},{short:"MAR",long:"März",index:2},{short:"APR",long:"April",index:3},{short:"MAY",long:"Mai",index:4},{short:"JUN",long:"Juni",index:5},{short:"JUL",long:"Juli",index:6},{short:"AUG",long:"August",index:7},{short:"SEP",long:"September",index:8},{short:"OCT",long:"Oktober",index:9},{short:"NOV",long:"November",index:10},{short:"DEC",long:"Dezember",index:11}],getDaysInMonth=(month,year)=>new Date(year,month+1,0).getDate();input.addEventListener("input",(e=>{e.stopPropagation(),input.value=""}));let currentYear=(new Date).getFullYear(),currentMonth=(new Date).getMonth(),selectedDay="";if(input.value){const[day,month,year]=input.value.split(".");currentYear=parseInt(year),currentMonth=parseInt(month)-1,selectedDay=`${day}-${months[currentMonth].short}-${currentYear}`}let currentView="dp";const getNumberDisplay=number=>number<10?"0"+number:number.toString(),updateCalendar=()=>{const dayPickerCmp=parent.querySelector(".cmp--dp.cmp");if(!dayPickerCmp)return;dayPickerCmp.innerHTML="";const dayPicker=document.createElement("div");dayPicker.className="lyt--dp lyt",dayPickerCmp.appendChild(dayPicker);const firstDay=((month,year)=>{const day=new Date(year,month,1).getDay();return 0===day?6:day-1})(currentMonth,currentYear),daysInMonth=getDaysInMonth(currentMonth,currentYear),daysInPrevMonth=getDaysInMonth(currentMonth-1,currentYear);let daysUntilSundayAtEnd=(7-(firstDay+daysInMonth)%7)%7,day=1,nextMonthDay=1;for(let i=0;i<42;i++){const dayElement=document.createElement("div");if(dayElement.className="cmp--dp-day cmp",i<firstDay)dayElement.classList.add("dif-month"),dayElement.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${daysInPrevMonth-(firstDay-i-1)}</p></div></div>`;else if(day>daysInMonth){if(daysUntilSundayAtEnd<=0)break;daysUntilSundayAtEnd--,dayElement.classList.add("dif-month"),dayElement.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${nextMonthDay++}</p></div></div>`}else`${getNumberDisplay(day)}-${months[currentMonth].short}-${currentYear}`===selectedDay&&dayElement.classList.add("selected"),(i+1)%7!=6&&(i+1)%7!=0||dayElement.classList.add("weekend"),dayElement.innerHTML=`<div class="lyt--dp-day lyt"><div class="wr_p--dp-day wr_p"><p class="p--m">${getNumberDisplay(day)}</p></div></div>`,dayElement.addEventListener("click",(e=>{e.stopPropagation(),selectedDay=`${e.target.innerText.trim()}-${months[currentMonth].short}-${currentYear}`,updateCalendar(),input.value=`${e.target.innerText.trim()}.${getNumberDisplay(months[currentMonth].index+1)}.${currentYear}`,parent.classList.add("filled"),parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),input.dispatchEvent(new Event("blur"))})),day++;dayPicker.appendChild(dayElement)}const navBtn=parent.querySelector(".cmp--dtp-nav-btn p");navBtn&&(navBtn.textContent=`${months[currentMonth].long} ${currentYear}`)},updateMonthPicker=()=>{const monthPickerCmp=parent.querySelector(".cmp--mp.cmp");if(!monthPickerCmp)return;monthPickerCmp.innerHTML="";const monthPicker=document.createElement("div");monthPicker.className="lyt--mp lyt",monthPickerCmp.appendChild(monthPicker),months.forEach(((month,index)=>{const monthElement=document.createElement("div");monthElement.className="cmp--mp-month cmp",index===currentMonth&&monthElement.classList.add("selected"),monthElement.innerHTML=`<div class="lyt--mp-month lyt"><div class="wr_p--mp-month wr_p"><p class="p--m">${month.short}</p></div></div>`,monthElement.addEventListener("click",(()=>{currentMonth=index,currentView="dp",switchView()})),monthPicker.appendChild(monthElement)}))},updateYearPicker=()=>{const yearPickerCmp=parent.querySelector(".cmp--yp.cmp");if(!yearPickerCmp)return;yearPickerCmp.innerHTML="";const yearPicker=document.createElement("div");yearPicker.className="lyt--yp lyt",yearPickerCmp.appendChild(yearPicker);for(let year=(new Date).getFullYear()+1;year>=1900;year--){const yearElement=document.createElement("div");yearElement.className="cmp--yp-year cmp",year===currentYear&&yearElement.classList.add("selected"),yearElement.innerHTML=`<div class="lyt--yp-year lyt"><div class="wr_p--yp-year wr_p"><p class="p--m">${year}</p></div></div>`,yearElement.addEventListener("click",(()=>{currentYear=year,currentView="mp",switchView()})),yearPicker.appendChild(yearElement)}},switchView=()=>{const dayPickerCmp=parent.querySelector(".cmp--dp.cmp"),monthPickerCmp=parent.querySelector(".cmp--mp.cmp"),yearPickerCmp=parent.querySelector(".cmp--yp.cmp");if(!dayPickerCmp||!monthPickerCmp||!yearPickerCmp)return;dayPickerCmp.classList.add("hidden"),monthPickerCmp.classList.add("hidden"),yearPickerCmp.classList.add("hidden"),"dp"===currentView?(dayPickerCmp.classList.remove("hidden"),updateCalendar()):"mp"===currentView?(monthPickerCmp.classList.remove("hidden"),updateMonthPicker()):"yp"===currentView&&(yearPickerCmp.classList.remove("hidden"),updateYearPicker());const navBtn=parent.querySelector(".cmp--dtp-nav-btn p");navBtn&&(navBtn.textContent=`${months[currentMonth].long} ${currentYear}`)},dtpCmp=parent.querySelector(".cmp--dtp.cmp");if(!dtpCmp)return;dtpCmp.innerHTML='\n      <div class="lyt--dtp lyt"></div>\n      <div class="cmp--dp cmp hidden"></div>\n      <div class="cmp--mp cmp hidden"></div>\n      <div class="cmp--yp cmp hidden"></div>\n    ';const container=parent.querySelector(".lyt--dtp.lyt");if(!container)return;const navElement=`\n      <div class="cmp--dtp-nav cmp">\n        <div class="lyt--dtp-nav lyt">\n          <div class="cmp--dtp-nav-prevnext cmp prev">\n            <div class="lyt--dtp-nav-prevnext lyt">\n              <div class="wr_ico--dtp-nav-prevnext wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M560-240 320-480l240-240 56 56-184 184 184 184z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div class="cmp--dtp-nav-btn cmp">\n            <div class="lyt--dtp-nav-btn lyt">\n              <div class="wr_p--date-nav-btn wr_p">\n                <p class="p--m">${months[currentMonth].long} ${currentYear}</p>\n              </div>\n              <div class="wr_ico--dtp-nav-btn wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M480-345 240-585l56-56 184 184 184-184 56 56z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div class="cmp--dtp-nav-prevnext cmp next">\n            <div class="lyt--dtp-nav-prevnext lyt">\n              <div class="wr_ico--dtp-nav-prevnext wr_ico">\n                <div class="w-embed">\n                  <svg display="block" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960">\n                    <path d="M504-480 320-664l56-56 240 240-240 240-56-56z"></path>\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>`;container.innerHTML=navElement;const dayPicker=document.createElement("div");dayPicker.className="cmp--dp cmp hidden",container.appendChild(dayPicker);const monthPicker=document.createElement("div");monthPicker.className="cmp--mp cmp hidden",container.appendChild(monthPicker);const yearPicker=document.createElement("div");yearPicker.className="cmp--yp cmp hidden",container.appendChild(yearPicker);const handlePrev=()=>{"dp"===currentView?(currentMonth--,currentMonth<0&&(currentMonth=11,currentYear--),updateCalendar()):"mp"===currentView?(currentYear--,updateMonthPicker()):"yp"===currentView&&(currentYear-=10,updateYearPicker())},handleNext=()=>{"dp"===currentView?(currentMonth++,currentMonth>11&&(currentMonth=0,currentYear++),updateCalendar()):"mp"===currentView?(currentYear++,updateMonthPicker()):"yp"===currentView&&(currentYear+=10,updateYearPicker())},prevBtn=parent.querySelector(".cmp--dtp-nav-prevnext.prev"),nextBtn=parent.querySelector(".cmp--dtp-nav-prevnext.next"),navBtn=parent.querySelector(".cmp--dtp-nav-btn.cmp");prevBtn&&prevBtn.addEventListener("click",handlePrev),nextBtn&&nextBtn.addEventListener("click",handleNext),navBtn&&navBtn.addEventListener("click",(()=>{"dp"===currentView?currentView="mp":"mp"===currentView?currentView="yp":"yp"===currentView&&(currentView="mp"),switchView()})),currentView="dp",switchView()}setupOptions(input,parent,options){options.forEach((option=>{option.addEventListener("click",(e=>{e.stopPropagation(),input.value=option.textContent?.trim()||"",parent.classList.add("filled"),parent.querySelector(".el--tf-md-overlay.el")?.classList.add("hidden"),parent.querySelector(".cmp--tf-md.cmp")?.classList.add("hidden"),parent.classList.add("success"),parent.classList.remove("error"),options.forEach((option=>{option.classList.remove("hidden"),option.classList.remove("checked")})),input.dispatchEvent(new Event("blur")),option.classList.add("checked")}))})),input.addEventListener("input",(e=>{const value=e.target.value.toLowerCase(),found=options.find((option=>option.textContent?.trim().toLowerCase()===value));options.forEach((option=>{option.textContent?.trim().toLowerCase().includes(value)||found?option.classList.remove("hidden"):option.classList.add("hidden")}))}))}setupDragAndDrop(){const parent=this.form?.querySelector(".cmp--fu.cmp");if(!parent)return;const dragDropElement=parent.querySelector(".cmp--fu-drag.cmp"),input=parent.querySelector("input"),uploadsContainer=parent.querySelector(".lyt--fu-uploads.lyt");if(!dragDropElement||!input||!uploadsContainer)return;const fileHandler=new FileHandler(input,(files=>{if(files&&0!==files.length){uploadsContainer.parentElement?.classList.remove("hidden"),uploadsContainer.innerHTML="";for(let i=0;i<files.length;i++){const file=files[i],uploadElement=document.createElement("div");uploadElement.className="cmp--fu-upload cmp",uploadElement.innerHTML=`\n          <div class="lyt--fu-upload lyt">\n            ${file.type.startsWith("image/")?`<div class="cmp--fu-upload-preview cmp">\n                  <div class="lyt--fu-upload-preview lyt">\n                    <div class="wr_img--fu-upload-preview wr_img">\n                      <img src="${URL.createObjectURL(file)}" alt="${file.name}" />\n                    </div>\n                  </div>\n                </div>`:`<div class="cmp--fu-upload-name cmp">\n                  <div class="lyt--fu-upload-name lyt">\n                    <div class="wr_p--fu-upload-name wr_p">\n                      <p class="p--m">${file.name}</p>\n                    </div>\n                  </div>\n                </div>`}\n            <div class="cmp--fu-upload-delete cmp">\n              <div class="lyt--fu-upload-delete lyt">\n                <div class="wr_ico--fu-upload-delete wr_ico">\n                  <div class="ico--fu-upload-delete w-embed">\n                    <svg viewBox="0 0 9 9" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n                      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.57684 8.9231L8.93713 7.56274L5.86017 4.48853L8.93713 1.41797L7.57812 0.0563965L4.49994 3.12939L1.42303 0.0539551L0.0627441 1.41406L3.13843 4.48853L0.0627441 7.55908L1.42175 8.91919L4.49866 5.84741L7.57684 8.9231Z"></path>\n                    </svg>\n                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n        `;const deleteButton=uploadElement.querySelector(".cmp--fu-upload-delete.cmp");deleteButton&&deleteButton.addEventListener("click",(e=>{e.stopPropagation(),fileHandler.removeFile(i)})),uploadsContainer.appendChild(uploadElement)}}else uploadsContainer.parentElement?.classList.add("hidden")}));parent.addEventListener("click",(()=>{input.click()})),input.addEventListener("change",(e=>{const fileInput=e.target;if(fileInput.files&&fileInput.files.length>0){fileHandler.addFiles(fileInput.files)?dragDropElement.classList.remove("error"):dragDropElement.classList.add("error")}})),document.body.addEventListener("dragover",(e=>{e.preventDefault(),dragDropElement.classList.add("dragging"),dragDropElement.classList.remove("hidden")})),document.body.addEventListener("dragleave",(e=>{e.preventDefault();const relatedTarget=e.relatedTarget;dragDropElement.contains(relatedTarget)||(dragDropElement.classList.remove("dragging"),dragDropElement.classList.add("hidden"))})),document.body.addEventListener("drop",(e=>{if(e.preventDefault(),dragDropElement.classList.remove("dragging"),dragDropElement.classList.add("hidden"),e.dataTransfer?.files&&e.dataTransfer.files.length>0){fileHandler.addFiles(e.dataTransfer.files)?dragDropElement.classList.remove("error"):dragDropElement.classList.add("error")}}))}init(){if(!this.form)return;this.unwrapElements(),this.setupFormFields(),this.form.querySelector(".cmp--form-steps.cmp")&&(this.formSteps=new FormSteps(this.form,this.accessKey),this.formSteps.init(),this.formSteps.addEventListeners()),this.formSubmission=new FormSubmission(this.form,this.accessKey,this.captchaKey);const submitButton=this.form.querySelector(".wr_btn--form-control-submit.wr_btn");submitButton&&submitButton.addEventListener("click",(e=>this.formSubmission?.handleSubmit(e)))}}).init(),{}})()));