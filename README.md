# acme-labs
prototype digital reading system

See it in action at https://dauwhe.github.io/acme-labs/

This is an experiment to see how web application manifests and service workers might be used for digital books. It's essentially an implementation of [BFF](https://github.com/dauwhe/epub31-bff), and aims to explore some of the ideas of [(P)WP](https://github.com/w3c/dpub-pwp-ucr). 




## Goals

1. Provide a reading experience much like common dedicated e-readers like iBooks, and Readium. This includes user control over font size, a night mode, easy access to navigation, pagination, etc.

2. The publications themselves should not need any scripts to function. 

3. The publications should work offline.

4. It should be possible to save the publication to a local filesystem.

## Publications

Each book is in a folder. The folder contains a manifest.json file. The manifest is a web application manifest, but with two additional members:

1. The `spine` member. This is the order of content documents in the publication, as in EPUB.

```json
"spine": [{
    "href": "html/c001.html",
    "type": "text/html"
  }, {
    "href": "html/c002.html",
    "type": "text/html"
  }],
```

2. The `resources` member. This is all the other stuff in the publication—images, fonts, css, js, and so on.


```json
"resources": [{
    "href": "images/moby-dick-book-cover.jpg",
    "type": "image/jpeg"
  },{
    "href": "css/mobydick.css",
    "type": "text/css"
  },{
    "href": "index.html",
    "type": "text/html",
    "properties": "nav"
  }]

```

## Reading System

The reading system is the main.html page. Book content is displayed in an iframe. Navigation between files is based on reading the manifest.

The service worker caches files listed in the manifest when the "save" button is clicked. The "download" button downloads a zip of the publication. 

## Warning

Warning: the code is really rough, as I don't know what I'm doing.

## Acknowledgments

[Jake Archibald](https://jakearchibald.github.io/ebook-demo/publisher-site/readme/) wrote the original service worker (`kroner.js`) and `page.js` files. The manifest format was hashed out with Hadrien Gardeur. All of this is really the work of the entire DPUB/EPUB community. 

