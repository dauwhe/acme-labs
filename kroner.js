/* global importScripts self caches clients JSZip */
/* eslint comma-dangle:0 */
/* eslint-env browser */
importScripts('jszip.js');
importScripts('sha512.js');

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}




self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('pub-static-v1').then(c => c.addAll([
      './',
      'main.html',
      'main.js',
      'main.css',
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
  } else if (sameOrigin && url.pathname.endsWith('/download-package')) {
    event.respondWith(webPackage(event.request));
    return;
  }  
    else if (sameOrigin && url.pathname.endsWith('/download-EPUB')) {
    event.respondWith(epubPackage(event.request));
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

  const publicationName = urlRE[1];

  return caches
    .has(publicationName)
    .then(isCached => (isCached ? caches.open(publicationName).then(c => c.match.bind(c)) : fetch))
    .then(fetchingMethod =>
      fetchingMethod(`${publicationName}/manifest.json`)
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
              fetchingMethod(`${publicationName}/${path}`)
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
              fetchingMethod(`${publicationName}/${path}`)
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

// TRY TO CREATE WEB PACKAGE FORMAT
function webPackage(request) {
const urlRE = /\/([^\/]*)\/download-package/.exec(request.url);
const publicationName = urlRE[1];
var id = generateUUID();
var indexID = generateUUID();

// 2D array for indexing data for package
var index = [];
var contents = "";

// need header in a separate variable so we can digitally sign header + index
var packageHeader = `Content-Type: application/package
Content-Location: https://dauwhe.github.io/acme-labs/` +
publicationName + `.pod
` + `Link: </manifest.json>; rel=describedby
Link: <cid:` + indexID +  `>; rel=index;

`;

return caches
    .has(publicationName)
    .then(isCached => (isCached ? caches.open(publicationName).then(c => c.match.bind(c)) : fetch))
    .then(fetchingMethod =>
      fetchingMethod(`${publicationName}/manifest.json`)
        .then(r => r.json())
        .then((data) => {
    
          const manifestContent = JSON.stringify(data);
  
          contents += `--` + id + `
Content-Location: manifest.json
Content-type: application/json

` + manifestContent

          data.spine
            .map(el => el.href)
            .push(`${publicationName}/manifest.json`);

          return Promise.all(data.spine
            .map(el => el.href)
            .map(path =>
              fetchingMethod(`${publicationName}/${path}`)
                .then((response) => {
                  return response.arrayBuffer();
                })
                .then((arrayBuffer) => {
                var decoder = new TextDecoder();

// I want the href and type values of the manifest, but I don't know how
// to get them. What's the current index of the map?
                
                 contents += `

--` +  id + `
Content-Location: /` + path + `
Content-Type: ` + data.spine[0].type + `

` + decoder.decode(arrayBuffer);

// so hashing...
// do i have to calculate the hash of each arrayBuffer, and remember it?
// and then build the content index at the end of the package file
// how the hell do we calculate the offsets?

var shaObj = new jsSHA("SHA-384", "TEXT");
shaObj.update(decoder.decode(arrayBuffer));
var hash = "sha384-" + shaObj.getHash("HEX");

//saving all this useful information for the index later
index.push([path, hash, arrayBuffer.byteLength]);

// end hashing             
                })
            )
          )
        //skipping resources for now
          .then(() => {
          
// OK. We're doing the content index.
// First the separator, ID, and content type.
          
           var packageIndex = "--" +  id + `
Content-Location: cid:` + indexID + `
Content-Type: application/index

`

// Now we loop through the index array which holds the path, hash, and content length
// we have no idea how to calculate the offset.
          
        for (var i = 0; i < index.length; i++) { 
        packageIndex += "/" + index[i][0] + " " + index[i][1] + " " + index[i][2] + " offset tk" + `
`
        }
        
        
  // write everything to file
  
  finalContents = packageHeader + contents + packageIndex;   
         var textFile = new Blob([finalContents], {type: 'text/plain'});
            return new Response(textFile, {
              headers: {
                'Content-Disposition': `attachment; filename="${publicationName}.pod"`
              }
            });
          });
        })
  );
};

//epub

function epubPackage(request) {
  // more hacky url stuff that can probably be done better
  const urlRE = /\/([^\/]*)\/download-EPUB/.exec(request.url);

  const publicationName = urlRE[1];
  
  // array to hold file info
  var packageData = [];
  var spineData = [];

  return caches
    .has(publicationName)
    .then(isCached => (isCached ? caches.open(publicationName).then(c => c.match.bind(c)) : fetch))
    .then(fetchingMethod =>
      fetchingMethod(`${publicationName}/manifest.json`)
        .then(r => r.json())
        .then((data) => {
        
        var bookTitle = data.name;
        
          var zip = new JSZip();
                    zip.file("mimetype", "application/epub+zip");

        
            
          return Promise.all(data.resources
            .map(path =>
              fetchingMethod(`${publicationName}/${path.href}`)
            .then(response => response.arrayBuffer())
                .then((arrayBuffer) => {
                  var spineId = path.href.replace(/\/|\./g, '-');

                 packageData.push([path.href, path.type, 'manifest', spineId, path.properties]);
                
                  zip.file('OPS/' + path.href, arrayBuffer, { createFolders: true });
                })
            )
          )
          .then(data.spine
            .map(path =>
              fetchingMethod(`${publicationName}/${path.href}`)
                .then(response => response.arrayBuffer())
                .then((arrayBuffer) => {
                    var spineId = path.href.replace(/\/|\./g, '-');
                    packageData.push([path.href, path.type, 'spine', spineId, path.properties]);
                    zip.file('OPS/' + path.href, arrayBuffer, { createFolders: true });
                })
            )
          )
          .then(() => {
          
          // container.xml
          var containerFile = `<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`
            zip.file('META-INF/container.xml', containerFile, { createFolders: true });
            
      var today = new Date();      
            // make the package file
            var opfFile = '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" xml:lang="en" unique-identifier="pub-id">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n<dc:title>' + bookTitle + '</dc:title>\n<dc:identifier id="pub-id">idtk</dc:identifier>\n<dc:language>en-US</dc:language>\n<meta property="dcterms:modified">' + today.toISOString() + '</meta>\n</metadata>\n<manifest>\n';
            
             for (var i = 0; i < packageData.length; i++) { 
        opfFile += "<item href='" + packageData[i][0] + "' media-type='" + packageData[i][1] + "' id='" + packageData[i][3] + "'";
        // if there are properties we need to add them to item element
        if (packageData[i][4]) {
        opfFile += " properties='" + packageData[i][4] + "'";
        };
        
        opfFile += "/>\n"
        };
        
opfFile += '</manifest>\n';
            
                opfFile += "<spine>\n";
                
                 for (var i = 0; i < packageData.length; i++) { 
                 
                  if (packageData[i][2] === 'spine') {
        opfFile += "<itemref idref='" + packageData[i][3] + "'/>\n"
        
        }
        };
        
        opfFile += "</spine>\n</package>";
        console.log(opfFile);
        
        zip.file('OPS/package.opf', opfFile)

      /*      const zipArray = new Uint8Array(zip.generate({
              type: 'uint8array',
              compression: 'STORE'
            }));
            */
       //     const resultArray = new Uint8Array(zipArray.length + 1);

            // don't 'encode' the archive
        //    for (let i = 0; i < zipArray.length; i++) {
        //     resultArray[i + 1] = zipArray[i + 1];
        //    }
        
        
     const zipArray = new Uint8Array(zip.generate({
     type:"uint8array",
     compression: 'STORE'}));


            return new Response(zipArray.buffer, {
              headers: {
                'Content-Disposition': `attachment; filename="${publicationName}.epub"`
              }
            });
          });
        })
  );
}







