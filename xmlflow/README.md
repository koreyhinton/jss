# General Idea

Execute JavaScript function call trees by specifying how the functions connect in the xml[1]. Xmlflow can connect streams (up to 4 at the moment) of (vectored or single instance) data (or user interface element(s)) and load to a UI or data target.

## Input Flows

Input flows are provided by giving a function name that matches the same name as the root <xmlflow> tag's children nodes (in the XML).
  
## Connector Flows

Connector flows come out from the same level in the hierarchy as Input Flows except they are just tags with a capital letter A-Z (e.g., &lt;A&gt;). Connectors will take the indpendent vectors that have branched out into their own flows and combine up to four of them to pass in as separate function arguments to that connector's child elements.

&lt;A1&gt; will become parameter position 1 for all child nodes under &lt;A&gt;, &lt;A2&gt; will become parameter position 2 for all child nodes under &lt;A&gt;, and so forth.

(You could think of A-Z Connectors as the wireless connectors you see in UML)

## DOM flows

Limited dom element retrieval is possible by using &lt;dom-stream&gt; as an input flow and giving it an id attribute that can be queried from the DOM. You could provide your own input node function to use selectors until something like that gets added.

# How To Use

## Installation

xmlflow depends on xml2js. First build xmlfow.js with xml2js (npm).

Something like this could be done:

```sh
npm install browserify
echo 'window.xmlflow = (require('xmlflow'));' >lib/xmlflow.js
npm install ../jss/xmlflow && node_modules/browserify/bin/cmd.js lib/xmlflow.js -o lib/dist/xmlflow.js
```

## Usage

```js
// xmlFlowString is the xml content in the form of a string that is specifying the call tree
// env will have any custom function names for input functions (xmlflow tag's children), load functions (leaf nodes that aren't connector flows), or transformation functions (middle flows)
xmlflow(xmlFlowString, env);
```

# Example: Split-pane SVG editor (&lt;text&gt; nodes)

## Editor Screen User Interface
<table><tr><td>
  &lt;svg id="svgId"&gt;

  &lt;/svg&gt;
  <br/><i>(Left: Svg editor)</i>
</td><td>update --&gt;</td><td>&nbsp;&nbsp;<br/>&nbsp;&nbsp; <br/><i>(Right: Svg display)</i></td></tr>
<tr><td colspan="3"></td></tr>
<tr><td colspan="2">some text</td><td>Add Text</td></tr></table>

### Id (Html element attr) Legend

* **xmlId** - Left: Svg editor
* **svgId** - Right: Svg display
* **textId** - bottom-left text input

## Xml Flow 1: 'load svg display' flow
Event: [update --&gt;] button was clicked (after xml in left-pane was changed)

[1]
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<xmlflow id="load-svg-flow">
    <dom-stream id="svgId">
        <A1/>
    </dom-stream>
    <dom-stream id="xmlId">
        <get-value>
            <A2/>
        </get-value>
    </dom-stream>
    <A>
        <load-svg/>
    </A>
</xmlflow>
```

## Xml Flow 2: 'load new text (svg editor+display)' flow
Event: [Add Text] button clicked (after bottom-left text input was changed)

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<xmlflow id="text-load-xml-and-svg">
    <dom-stream id="svgId">
        <get-html>
            <parse>
                <get-max-y>
                    <A1/>
                </get-max-y>
            </parse>
        </get-html>
    </dom-stream>
    <dom-stream id="textId">
        <A2/>
    </dom-stream>
    <dom-stream id="xmlId">
        <A3/>
    </dom-stream>
    <dom-stream id="svgId">
        <B1/>
    </dom-stream>
    <A>
        <load-new-text>
            <B2/>
        </load-new-text>
    </A>
    <B>
        <load-svg/>
    </B>
</xmlflow>
```

## Single HTML File (Full) Code

```html
<!DOCTYPE html>
<html>
<head>
    <script src="xmlflow.js"></script>
    <script>
        window.xf = {xmlflows:{}};
        window.xf['get-html'] = (el) => {return el.innerHTML;}
        window.xf['get-value'] = (el) => {return el.value;}
        window.xf['get-max-y'] = (xmlDoc) => {
            let els = [...xmlDoc.getElementsByTagName('text')];
            let max = 10;
            els.forEach((el) => {
                let y = parseInt(el.getAttribute("y"));
                if (y > max) max = y;
            });
            return max;
        };
        window.xf['parse'] = function(xml) {
            return new DOMParser().parseFromString(xml, 'text/html');
        };
        window.xf['load-new-text'] = function(maxY, textInp, textArea) {
            textArea.value = textArea.value.replace('</svg>', `
<text y="${maxY+20}" x="10">${textInp.value}</text>
</svg>`);
            return textArea.value
                .substring(0, textArea.value.lastIndexOf("\n"))
                .substring(textArea.value.indexOf("\n"));
        };
        window.xf['load-svg'] = function(svg, value) {svg.innerHTML = value;}
        window.xf.xmlflows['load-svg-flow'] = `
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<xmlflow id="load-svg-flow">
    <dom-stream id="svgId">
        <A1/>
    </dom-stream>
    <dom-stream id="xmlId">
        <get-value>
            <A2/>
        </get-value>
    </dom-stream>
    <A>
        <load-svg/>
    </A>
</xmlflow>`;


        window.xf.xmlflows['load-new-text-flow'] = `
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<xmlflow id="text-load-xml-and-svg">
    <dom-stream id="svgId">
        <get-html>
            <parse>
                <get-max-y>
                    <A1/>
                </get-max-y>
            </parse>
        </get-html>
    </dom-stream>
    <dom-stream id="textId">
        <A2/>
    </dom-stream>
    <dom-stream id="xmlId">
        <A3/>
    </dom-stream>
    <dom-stream id="svgId">
        <B1/>
    </dom-stream>
    <A>
        <load-new-text>
            <B2/>
        </load-new-text>
    </A>
    <B>
        <load-svg/>
    </B>
</xmlflow>
`;
    </script>
</head>
<body>

    <textarea id="xmlId" style="width:400px;height:100px;">&lt;svg id="svgId"&gt;

&lt;/svg&gt;</textarea>

    <button onclick="xmlflow(xf.xmlflows['load-svg-flow'],xf)">
        update
        --&gt;
    </button>

    <svg id="svgId" style="border: 1px solid black">

    </svg>

<div>
    <input type="text" id="textId" value="some text">
    <button onclick="xmlflow(xf.xmlflows['load-new-text-flow'],xf)">Add Text</button>
</div>



</body>

</html>

```

