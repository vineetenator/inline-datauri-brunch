# inline-datauri-brunch

Convert image path to data uri in to url() in CSS

Then, configure `inline-datauri-brunch` in the `plugins` section of your `brunch-config` file, like so:

```javascript
plugins: {
    inlineDataUri: {
        maxSizeLimitInKb: 4, // Max size of image file to be converted
        altImageDir: 'static/css', // Alternate image directory relative to css files.
        verbose: 0,
        hideErrors: false,
        urlQuotes: false // Controls keeping quoting inside `url()`, incase of svg it will always keep quotes
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
