// Code taken and adapted from https://github.com/joshheyse/jsdocts

function publish(symbolSet) {

    var outPath = JSDOC.opt.o;
    
    var templatesDir = JSDOC.opt.t || SYS.pwd+"../templates/jsdoc/";
    var classTemplate = new JSDOC.JsPlate(templatesDir + "module.tmpl");

    function isaClass($) { return (($.is("CONSTRUCTOR") || $.isNamespace) && ($.alias != "_global_")); }
    
    function mapEvent($) {
        return {
            name: $.name,
            isPrivate: $.isPrivate,
            isStatic: $.isStatic
        };
    }
    
    function mapMethod($) {
        return {
            name: $.name,
            isPrivate: $.isPrivate,
            isStatic: $.isStatic,
            params: $.params.map(function (_) { return { name: _.name, type: _.type }; }),
            returnType: $.type || $.returns[0] || "any"
        };
    }

    function mapProperty($) {
        return {
            name: $.name,
            isPrivate: $.isPrivate,
            isStatic: $.isStatic,
            type: $.type || $.returns[0] || "any"
        };
    }

    var symbols = symbolSet.toArray().sort(makeSortby("alias"));
    var classes = symbols.filter(isaClass).sort(makeSortby("alias"));

    var modules = {};

    for (var i = 0; i < classes.length; i++) {
        var symbol = classes[i];
        if (!symbol.isVisible())
            continue;
        var moduleName = symbol.memberOf || "{GLOBAL}";
        var module = modules[moduleName] = modules[moduleName] || { "classes" : []};
        module.name = moduleName;
        var cls = {
            name: symbol.name,
            inheritsFrom: symbol.inheritsFrom.getUnique(),
            events: symbol.getEvents().filter(function ($) { return $.memberOf == symbol.alias && !$.isNamespace; }).map(mapEvent),
            methods: symbol.getMethods().filter(function ($) { return $.memberOf == symbol.alias && !$.isNamespace; }).map(mapMethod),
            properties: symbol.properties.filter(function ($) { return $.memberOf == symbol.alias && !$.isNamespace; }).map(mapProperty)
        };
        module.classes.push(cls);
    }
    var output = classTemplate.process(modules);
    IO.saveFile(FilePath.dir(outPath), FilePath.fileName(outPath), output);
}

Array.prototype.getUnique = function () {
    var u = {}, a = [];
    for (var i = 0, l = this.length; i < l; ++i) {
        if (u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a.length > 0 ? a : null;
};

function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    }
}

function makeSignature(params) {
    if (!params) return "()";
    return "(" + params.map(function ($) { return $.name + ($.type ? ": " + $.type : ""); }).join(", ") + ")";
}
