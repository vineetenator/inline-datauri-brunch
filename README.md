# inline-datauri-brunch

Convert image path to data uri in to url() in CSS

Then, configure `inline-datauri-brunch` in the `plugins` section of your `brunch-config` file, like so:

```javascript
plugins: {
    inlineDataUri: {
        maxSizeLimitInKb: 4,
        baseLessDir: 'static/css',
        verbose: 0,
        hideErrors: false
    }
}
```

Possible verbose values for Brunch config
```
    0 => No verbose (default)
    1 => Show only skipped images whose size is greater than "inlineDataUri.maxSizeLimitInKb" (default = 32KB)
    2 => Show only skipped HTTP/HTTPS images
    3 => Show only Converted images to data-uri
    4 => Show all
```
## License

MIT License
Copyright (c) 2018 vineetenator
