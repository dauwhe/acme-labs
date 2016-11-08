# acme-labs
prototype digital reading system

This is an experiment to see how web application manifests and service workers might be used for digital books. It's essentially an implementation of BFF. 

## The Basic Idea

Each book is in a folder. The folder contains a manifest.json file.

The reading system is the main.html page. Book content is displayed in an iframe. Navigation between files is based on reading the manifest.

The service worker caches files listed in the manifest.

Warning: the code is really rough, as I don't know what I'm doing.

