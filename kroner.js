/* global importScripts self caches clients JSZip */
/* eslint comma-dangle:0 */
/* eslint-env browser */
importScripts('jszip.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('pub-static-v1').then(c => c.addAll([
      './',
      'main.html',
      'page.js',
      'jszip.js'
    ]))
  );
});

self.addEventListener('activate', () => {
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === location.origin;

  if (sameOrigin && url.pathname.endsWith('/download-publication')) {
    event.respondWith(packagePublication(event.request));
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(response => response || fetch(event.request))
  );
});

function packagePublication(request) {
  // more hacky url stuff that can probably be done better
  const urlRE = /\/([^\/]*)\/download-publication/.exec(request.url);

  const publicationBaseURL = `${location.origin}/epub-zero/acme/`;
  const publicationName = urlRE[1];

  return caches
    .has(publicationName)
    .then(isCached => (isCached ? caches.open(publicationName).then(c => c.match.bind(c)) : fetch))
    .then(fetchingMethod =>
      fetchingMethod(`${publicationBaseURL}${publicationName}/manifest.json`)
        .then(r => r.json())
        .then((data) => {
          const zip = new JSZip();
          const types = {};
          const manifestContent = JSON.stringify(data);

          //  zip.file('manifest.json', manifestContent);

          // I should reuse the asset I just downloaded but I'm lazy
          data.spine
            .map(el => el.href)
            .push(`${publicationName}/manifest.json`);

          return Promise.all(data.resources
            .map(el => el.href)
            .map(path =>
              fetchingMethod(`${publicationBaseURL}${publicationName}/${path}`)
                .then((response) => {
                  if (!path || path.endsWith('/')) path += 'index.html';
                  types[path] = response.headers.get('Content-Type');
                  return response.arrayBuffer();
                })
                .then((arrayBuffer) => {
                  zip.file(path, arrayBuffer, { createFolders: true });
                })
            )
          )
          .then(data.spine
            .map(el => el.href)
            .map(path =>
              fetchingMethod(`${publicationBaseURL}${publicationName}/${path}`)
                .then(response => response.arrayBuffer())
                .then((arrayBuffer) => {
                  zip.file(path, arrayBuffer, { createFolders: true });
                })
            )
          )
          .then(() => {
            zip.file('manifest.json', manifestContent);
            //  console.log(manifestContent);

            const zipArray = new Uint8Array(zip.generate({
              type: 'uint8array',
              compression: 'STORE'
            }));
            const resultArray = new Uint8Array(zipArray.length + 1);

            // don't 'encode' the archive
            for (let i = 0; i < zipArray.length; i++) {
              resultArray[i + 1] = zipArray[i + 1];
            }

            return new Response(resultArray.buffer, {
              headers: {
                'Content-Disposition': `attachment; filename="${publicationName}.zip"`
              }
            });
          });
        })
  );
}



