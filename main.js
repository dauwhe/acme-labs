// what's the path to the manifest?
function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return (match
    ? decodeURIComponent(match[1].replace(/\+/g, ' '))
    : null);
}

//what folder is the manifest in
function getPathByName() {
  //this is deeply flawed. fails on MobyDick/folder/manifest.json
  var path = RegExp('[?]manifest=' + '([^/]*)').exec(window.location.search);
  return path
    ? decodeURIComponent(path[1].replace(/\+/g, ' '))
    : null;
}


// will it help if there's a link to the manifest in the hosting page?
var manifestLink = document.createElement('link');
manifestLink.rel = 'manifest';
manifestLink.href = getParameterByName('manifest');
document.getElementsByTagName('head')[0].appendChild(manifestLink);


var manifest = getParameterByName('manifest');
var count = 0;
var NightLink = document.getElementById('night');
var iframe = document.getElementById('pub')
// at start, prev button should be disabled
document.getElementById("decrement").disabled = true;

// the manifest knows all
var content = $.getJSON(manifest)
  .done(function(data) {
    // set title of page to book title
    document.title = data.name;
    
    

    // display first "spine" item in iframe by default
    if (data.spine[0].type == 'image/jpeg') {
      var html = '<html><body style="margin: 0 auto; text-align: center;"><img style="max-height: 100vh;" src="'
        + getPathByName() + '/' + data.spine[0].href + '"/></body></html>';
      console.log(html);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(html);
      iframe.contentWindow.document.close();
    } else {
     
      
      
      
          iframe.setAttribute('src', getPathByName() + '/' + data.spine[0].href);
      
      

    
    }
    
    // so we're trying to deal with fixed layout, by setting the iframe to a nice size
     $("#pub").load(function(){
     
var viewport = $("#pub").contents().find('meta[name=viewport]').attr("content");

if ( viewport ) {

var reWidth = /width=(\d+),/;
var reHeight = /height=(\d+)/;

var width = viewport.match(reWidth, '$1')[1];

var height = viewport.match(reHeight, '$1')[1];


var intFrameWidth = window.innerWidth;



var horizonalScale = intFrameWidth/width;

var actualWidth = width * horizonalScale;

var actualHeight = height * horizonalScale;

console.log(horizonalScale);


iframe.setAttribute('style', 'transform: scale(' + horizonalScale + '); transform-origin: 0 0; width: ' + width + 'px; height: ' + height + 'px;'  );

} else {}



/* 

iframe size: 600 x 750
so we need to scale the iframe content. If iframe is 600 wide, and viewport from FXL is 1200, scale 50%
1200, 1577

750/1577 = 48%


*/
    });


    // on clicking "next" go to next spine item
    $('#increment').click(function (e) {
      e.preventDefault();
      count++;
    // remember how many spine items we have
      var length = Object.keys(data.spine).length;
      // well, if we just get an image, we need to wrap it in HTML so we can style it
      if (data.spine[count].type == 'image/jpeg') {
        var html = '<html><body style="margin: 0 auto; text-align: center;"><img style="max-height: 100vh;" src="'
          + getPathByName() + '/' + data.spine[count].href + '" alt="' + data.spine[count].alt +   '"/></body></html>';
        console.log(html);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
      } else {
        iframe.setAttribute('src', getPathByName() + '/' + data.spine[count].href);
        
        
       
      };
 
      // we don't want the next button to work if there's no next
      if (count == (length -1)) {
          document.getElementById("increment").disabled = true;
              } else {
                  document.getElementById("increment").disabled = false;
            };
            
      // we need to re-enable the previous button if we're not at the first item
            if (count != 0) {
                  document.getElementById("decrement").disabled = false;
            };
    });

    // on clicking "previous" go to previous spine item
    $('#decrement').click(function (e) {
      e.preventDefault();
      count--;
      if (data.spine[count].type == 'image/jpeg') {
        var html = '<html><body style="margin: 0 auto; text-align: center;"><img style="max-height: 100vh;" src="'
          + getPathByName() + '/' + data.spine[count].href + '"/></body></html>';
        console.log(html);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
      } else {
        iframe.setAttribute('src', getPathByName() + '/' + data.spine[count].href);
      }
      
      // need to enable previous button if not at end
       if (count != (length -1)) {
                  document.getElementById("increment").disabled = false;
            };
       // disable previous button if at start     
            if (count === 0) {
                  document.getElementById("decrement").disabled = true;
            };
    });

    // link to table of contents
    $('#toc').click(function (f) {
      f.preventDefault();
      for ( var i in data.resources ) {
        if (data.resources[i].properties === "nav") {
          iframe.setAttribute('src', getPathByName() + '/' + data.resources[i].href);
        }
      }
    });

    // "begin reading" link goes to start_url, which may not be first spine item
    // this screws up count, though
    $('#begin').click(function (g) {
      g.preventDefault();
      iframe.setAttribute('src', getPathByName() + '/' + data.start_url);
    });

    // to muck around inside the iframe, we need to wait for it to load

    /*
    iframe.addEventListener('unload', function(){
    console.log('unload');
    NightLink.removeEventListener('click', false);
    });
     */
  });

NightLink.addEventListener('click', function(){
  var inside = iframe.contentWindow.document;
  
  
 

  //NightLink.addEventListener('click', function() {

  if (NightLink.value==="Night") {
    inside.getElementsByTagName('html')[0].style.filter = 'invert(1) hue-rotate(180deg)';

    // need to check for img elements before altering styles
    // code TK... if there's no IMG then getElementsByTagName returns an empty array
    //inside.getElementsByTagName('img').style.filter = 'invert(1) hue-rotate(180deg)';

    inside.getElementsByTagName('html')[0].style.background = 'black';

    document.getElementsByTagName('main')[0].style.background = 'black';
    document.getElementById('pub').style.borderColor = 'black';

    NightLink.value = 'Day';
  } else {
    NightLink.value = 'Night';
    inside.getElementsByTagName('html')[0].style.background = 'white';
    inside.getElementsByTagName('html')[0].style.filter = 'invert(0) hue-rotate(0deg)';
    document.getElementsByTagName('main')[0].style.background = 'white';
    document.getElementById('pub').style.borderColor = 'white';
  }
}, false);

// want to increase/decrease font size inside iframe
fontPluslink = document.getElementById('bigger');
fontPluslink.addEventListener('click', function() {
  console.log('clicked bigger');
  var inside = iframe.contentWindow.document;

  var cur = window.getComputedStyle(inside.getElementsByTagName('body')[0]).fontSize;
  inside.getElementsByTagName('body')[0].style.fontSize = parseInt(cur) + 2 + "px"
}, false);

fontMinuslink = document.getElementById('smaller');
fontMinuslink.addEventListener('click', function() {
  var inside = iframe.contentWindow.document;
  var cur = window.getComputedStyle(inside.getElementsByTagName('body')[0]).fontSize;
  inside.getElementsByTagName('body')[0].style.fontSize = parseInt(cur) - 2 + "px"
}, false);

// night mode!!!!


    
