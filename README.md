system-less?
============

A [systemjs](https://github.com/systemjs/systemjs)/[builder](https://github.com/systemjs/builder) plugin to load/render [LESS](https://github.com/less/less.js) in browser on the fly and bundle rendered CSS during build time.

Usage
=====

Install system-less like this:

```jspm install github:jack4it/system-less```

Also install LESS (this step will create the right map entry that the plugin expects for LESS):

```jspm install npm:less```

In order to make systemjs builder bundle work, also install less and clean-css via npm:

```npm install less clean-css```

Configuration
=============

To load less files in browser on the fly during development time, create **meta** for your less files in jspm/systemjs config.js file:

```javascript
packages: {
  "example": {
    "meta": {
      "./*.less": {
        "loader": "jack4it/system-less"
      }
    }
  }
}
```

To minify/optimize the generated CSS in the bundle file, add these options when calling bundle method of systemjs builder:

```javascript
builder.bundle('example/app.js', 'example/app-bundle.js', { minify: true, cssOptimize: true })
```

Example
=======

**example.html**: An example of how to load LESS in *browser* on the fly during development time

**example-bundle.js**: An example of how to generate css from LESS in *node* during build time for production

License
=======

MIT
