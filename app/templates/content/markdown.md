# Here's some markdown.
We imported the content from `./app/content/markdown.md` using simple, custom Assemble middleware.

The pages use the `/templates/layout/default.hbs` layout.

---

We also created a simple nav using the `/templates/partials/nav.hbs` partial and the `/data/nav.json` object to control active pages using YAML front-matter.

### On the dummy pages:

### [Page 2](/page2.html)
A page with _slightly_ more advanced partials `card.hbs`, with JSON data and inline data:
* `{{> partialName dataJSONname.object inlineData="foo"}}`
* aka `{{>card card--resources.foo classModifier="bar"}}`
### [Page 3](/page3.html)
A page with some `handlebars-helpers` examples.
<br><br>
We even made a 404 page, tapping into browserSync: [This linked file doesn't really exist](/foo-bar.html)
