let xml2js = require("xml2js");

function xmlflow__vec1(vector) {
    return {
        vector1: vector, vector2: null, vector3: null, vector4: null
    };
}

function xmlflow__handleconnector(name, node, vectors, connectors) {
    let isConnector = (/^[A-Z][0-9]?$/i.test(name));
    if (isConnector) {
        connectors[name] = node;
        let isPhase2Connector = (/^[A-Z]$/i.test(name));
        if (!isPhase2Connector) {
            if (connectors[name] == '') connectors[name] = {};
            connectors[name].vector1 = vectors.vector1;
        }
        return true;
    } // end connector check
    return false;
}

function xmlflow__handlenonflow(funcNm, funcNode, vectors, env) {
    if (funcNm == "_") {
        console.warn("WARNING: skipping non-flowing input xml content " +
            `(name: ${funcNm})`);
        return true; // early-return for text content and leaf input nodes
    } // end non-node check
    return false;
}

function xmlflow__recurse(funcNm, funcNode, vectors, connectors, env) {

    if (xmlflow__handleconnector(funcNm, funcNode, vectors, connectors)) {
        return; // early-return for a connector node
    } // end handled conn check
    if (xmlflow__handlenonflow(funcNm, funcNode, vectors, env)) {
        return;
    }

    //console.log(`funcNm = (${funcNm}), funcNode=${funcNode}`,funcNode);
    //console.log('will run func ' + funcNm, funcNode, typeof funcNode, funcNode == '', vectors);

    let vector1 = env[funcNm](vectors.vector1, vectors.vector2,
        vectors.vector3, vectors.vector4);

    if (typeof funcNode == "string") {
        // leaf node
        return;
    }

    let subvectors = xmlflow__vec1(vector1);

    Object.keys(funcNode).forEach((subname) => {

        // console.log(`subname = (${subname})`,funcNode[subname]);
        xmlflow__recurse(subname, funcNode[subname], subvectors, connectors, env);
    });
}
function xmlflow(xml, env) {
    env = env || window;
    let parsed = false;
    let innerXmlObj = null;
    (new xml2js.Parser({explicitArray: false})).parseString(xml, (err,res) => {
        if (err) { console.warn(err); return; }
        console.log("Running xml flow: " + res.xmlflow["$"].id);
        delete res.xmlflow["$"];
        innerXmlObj = res.xmlflow;
        parsed = true;
    });
    // todo: append to env, ie: last()
    if (!parsed) { console.error("Parsing failed"); return; }

    let connectors = {};
    // let inpVecs = {};
    // let flows = {};
    let vectors = xmlflow__vec1([]);
    let rootFn = "xmlflow--root";
    env[rootFn] = (vector1)=>{return vector1};
    xmlflow__recurse(rootFn, innerXmlObj, vectors, connectors, env);

    let connkeys = Object.keys(connectors).filter((k) => /^[A-Z]$/i.test(k));
    connkeys.forEach((k) => {
        let connVectors = {
            vector1: connectors?.[k+'1']?.vector1,
            vector2: connectors?.[k+'2']?.vector1,
            vector3: connectors?.[k+'3']?.vector1,
            vector4: connectors?.[k+'4']?.vector1
        };
        Object.keys(connectors[k]).forEach((subk) => {
            xmlflow__recurse(subk, connectors[k][subk], connVectors, connectors, env);
        });
    });
}

let env = {};
env.nds = function(){console.log('nds()'); return [{id:1},{id:2},{id:3}];}
env.ids = function(){console.log('ids()'); return [2,1];}
env.sort = (inp) => {console.log('sort()'); return inp.sort();}
env.leaf = (inp) => {console.log('leaf()'); return inp;}
env.leaf2 = (inp) => {console.log('leaf2()'); return inp;}
env.load = (inp) => {console.log('load()');return inp;};
env['delete-ids'] = (nodes, ids) => {
    console.log('(pre) delete-ids', ids, nodes);
    nodes = nodes.filter((nd) => ids.indexOf(nd.id) == -1);
    console.log('(post) delete-ids', ids, nodes);
    return nodes;
};
env['del2'] = (nodes, ids) => console.log('del2', nodes, ids);
xmlflow(`<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<xmlflow id="update">
foobar
<leaf></leaf>
<leaf2>test</leaf2>
<nds><A1></A1></nds>
<ids>
    <sort>
        <load><A2></A2></load>
    </sort>
</ids>
<A><delete-ids></delete-ids><del2></del2></A>
foo
</xmlflow>`, env);

module.exports = xmlflow;
