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
    1 => Only skipped images greater than max size
    2 => Only HTTP/HTTPS images
    3 => Only Converted images to data-uri
    4 => All
```
## License

MIT License
Copyright (c) 2018 vineetenator
