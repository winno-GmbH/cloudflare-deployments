# Deplyoments

## Form Tool

### Getting Started

1. create a form in the [form tool](https://gecko-form-tool-be-new.vercel.app/)
2. copy the access key
3. go to your webflow project
4. create the form with the following structure:

```
.cmp--forms.cmp name=YOUR_FORM_NAME
  .lyt--forms.lyt
```

### Multi step

#### Step numbers

```
.cmp--form-steps.cmp
  .lyt--form-steps.lyt
    .cmp--form-step.cmp
      .lyt--form-step.lyt
        ...
```

This is the structure for the steps from the form. Without them, it won't recognize it as multi step form.

##### Classes to style for the .cmp--form-steps.cmp:

- .locked
- .active
- .completed

#### Step forms

```
.cmp--form.cmp name=YOUR_CATEGORY_NAME
  .lyt--form.lyt
    ...
```

each step has to have a name. This is the display name that appears in the form as category

#### Step controls

```
.cmp--btn-group.cmp
  .lyt--btn-group.lyt
    .wr_btn--form-control-prev.wr_btn
    .wr_btn--form-control-next.wr_btn
    .wr_btn--form-control-submit.wr_btn
```

this is to control the form. When you press next, the form will get validated and then moves on to the next step. If you press back it will go one step back. If you press submit the form will get submitted.

### One step

```
.cmp--form.cmp name=YOUR_CATEGORY_NAME
  .lyt--form.lyt
    ...
```

In the one step you only have one form component. It has to have also a name as category.

The `.wr_btn--form-control-submit.wr_btn` should be placed outside the `.cmp--forms.cmp`. The submit button also can have a parent wrapped around it but it has to appear as a child of the `.cmp--forms.cmp`

### Overall requirements

#### classes that have to be styled

- hidden
- every child of the `.lyt--form-item.lyt` with a .error class
- every child of the `.lyt--form-item.lyt` with a .success class
- `.cmp--tf.cmp`, `.cmp--ta.cmp` .focused
- `.cmp--tf.cmp`, `.cmp--ta.cmp` .filled
- `.cmp--cb.cmp`, `.cmp--ct.cmp`, `.cmp--rb.cmp`, `.cmp--sw.cmp`
- `.cmp--dp-day.cmp` .dif-month
- `.cmp--dp-day.cmp` .weekend
- `.cmp--dp-day.cmp` .selected
- `.cmp--mp-day.cmp` .selected
- `.cmp--yp-day.cmp` .selected

#### attributes for different input fields

- name \*
- required
- data-validator
- data-variable

##### explanation

###### `name`

the name of the input field. This is required in all input fields to seperate them. Each checkbox group and each radio input group has to have the same one

###### `required`

Whether or not an input field is required. If it is required, it will get validated

###### `data-variable`

A variable that is usable in the email template.

🚨 `lead_mail` has to be somewhere otherwise the form won't work🚨

⚠️ `lead_name` is recommended ⚠️

###### `data-validator`

A special validator. Here you can put a custom regex to validate

### include the form

To use the form script you have to have these three infos:

- access key
- name of the form (the one defined in the `.cmp--forms.cmp`)
- captcha key (not required but recommended)

Now you can combine it like this:
https://cloudflare-test-7u4.pages.dev/tools/form-tool/formtool.js?key=`ACCESS_KEY`&form=`FORM_NAME`&captcha-key=`CAPTCHA_KEY`

To implement it in webflow add this to your header code:

```
<script>
  function generateFormTool() {
    const script = document.createElement('script');
    script.onload = function() {};
    script.src = YOUR_URL
    document.body.appendChild(script);
  }
  document.addEventListener("DOMContentLoaded", function() {
		generateFormTool();
  })
</script>
```
