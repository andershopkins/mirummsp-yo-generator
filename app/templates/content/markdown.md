# Here's some markdown.
We imported this content from `./app/content/markdown.md` using simple, custom Assemble middleware.

The pages (`/templates/pages/`) use the `/templates/layout/default.hbs` layout.

Anything below the YAML front-matter in a page file (ex: `/templates/pages/index.hbs`)

```
---
title: MSP Assemble Boilerplate (Yeoman generated)
layout: default
activePage: Home
content: <%contentPath%>markdown.md
---
```

is injected into this default layout using `{% body %}`

---

The nav is created using a simple nav partial: `{{> nav nav }}`

```
1. Name of partial (/templates/partials/nav.hbs)
2. Data, using a JSON object, passed to the partial (/data/nav.json)

{{>
    nav /* 1 */
    nav /* 2 */
}}
```

### On the dummy pages:

### [Page 2](/page2.html)
A page with _slightly_ more advanced partials `card.hbs`, with JSON data and inline data:

`{{> card card--resources.assemble classModifier="--blue" }}`

```
1. Name of partial (/templates/partials/card.hbs)
2. Data, using a JSON object, passed to the partial (/data/card--resources.json)
3. In this case, '.assemble' references a child object inside the parent object
4. Inline data that can be injected using Handlebars (not required)

{{>
    card /* 1 */
    card--resources.assemble /* 2 */ /* 3 */
    classModifier="--blue" /* 4 */
}}
```

### [Page 3](/page3.html)
A page with some `handlebars-helpers` examples.
<br><br>
We even made a 404 page, tapping into browserSync: [This linked file doesn't really exist](/foo-bar.html)
