(function($) {

function toJson(obj) {
 switch (typeof obj) {
  case 'object':
   if (obj) {
    var list = [];
    if (obj instanceof Array) {
     for (var i=0;i < obj.length;i++) {
      list.push(toJson(obj[i]));
     }
     return '[' + list.join(',') + ']';
    } else {
     for (var prop in obj) {
      list.push('"' + prop + '":' + toJson(obj[prop]));
     }
     return '{' + list.join(',') + '}';
    }
   } else {
    return 'null';
   }
  case 'string':
   return '"' + obj.replace(/(["'])/g, '\\$1') + '"';
  case 'number':
  case 'boolean':
   return new String(obj);
 }
}

function Component() {
  this._dom = null;
  this._$   = null;
  this.hide = function() {
    this._dom.hide(Array.prototype.slice.call(arguments));
  };
  this.show = function() {
    this._dom.show(Array.prototype.slice.call(arguments));
  };
}

function Debug(prefix) {
  return function(text) {
    text = prefix+": "+text;
    window.devmode = true;
    if (window.devmode && window.console && window.console.log)
      console.log(text);
    else if (window.serverside)
      alert(text);
  };
}

function $local(selector, root) {
  return $(root)
            .find("*")
            .andSelf()
            .filter(selector)
            .not($(".component *", root).get())
            .not($("* .component", root).get());
}

function checkForReservedClass(elems, shutup) {
  if (! $.golf.reservedClassChecking || window.forcebot)
    return [];
  var RESERVED_CLASSES = [ "component", "golfbody", "golfproxylink" ];
  var badclass = (
    (typeof elems == "string") 
      ? $.map(RESERVED_CLASSES, function(c) { 
          return (c == elems) ? elems : null; 
        })
      : $.map(RESERVED_CLASSES, function(c) {
          return elems.hasClass(c) ? c : null;
        })
  );

  if (badclass.length && !shutup)
    d("WARN: using, adding, or removing reserved class names: "
      + badclass.join(","));
  return badclass;
}

function doCall(obj, jQuery, $, argv, js, d) {
  d = !!d ? d : window.d;
  if (js.length > 10) {
    var f;
    eval("f = "+js);
    f.apply(obj, argv);
  }
}
    
/* parseUri is based on work (c) 2007 Steven Levithan <stevenlevithan.com> */

function parseUri(str) {
  var o = {
    strictMode: true,
    key: ["source","protocol","authority","userInfo","user","password",
          "host","port","relative","path","directory","file","query","anchor"],
    q:   {
      name:   "queryKey",
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  };
  var m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

/* jss is based on: JSS - 0.4 by Andy Kent */

var jss = {
  
  mark: function(elem) {
    var cpdom;

    try {
      cpdom  = $(elem).parents(".component").eq(0);

      if (cpdom.size() == 0 || cpdom.data("_golf_constructing"))
        return;
    }
    catch (x) {
      d("WARN: can't do mark: "+x);
      return;
    }

    cpdom.data("_golf_jss_dirty", true);
    if ($.golf.jssTimeout >= 0)
      setTimeout(function() { jss.doit(elem) }, 10);
    else jss.doit(elem);
  },

  doit: function(elem, force) {
    var cpdom, cpname, data, parsed;

    if ((serverside && !force) || window.forcebot)
      return;

    try {
      cpdom  = $(elem).parents(".component").eq(0);

      if (cpdom.size() == 0 || cpdom.data("_golf_constructing")
          || !cpdom.data("_golf_jss_dirty"))
        return;

      cpdom.removeData("_golf_jss_dirty");

      cpname = cpdom.attr("class").split(" ")[1].replace(/-/g, ".");
      data   = $.golf.components[cpname].css;
      parsed = this.parse(data);
    } 
    catch (x) {
      d("WARN: can't do jss: "+x);
      return;
    }

    $local("*", cpdom).each(
      function() {
        var jself = $(this);
        for (var i in jself.data("_golf_jss_log"))
          jself._golf_css(i, "");
        jself.data("_golf_jss_log", {});
        jself.data("_golf_jss_spc", {});
        jself._golf_css(jself.data("_golf_css_log"));
      }
    );

    $.each(parsed, function() {
      var selectors = this.selector;
      var attrs     = this.attributes;

      $.each(
        selectors.split(/ *, */),
        function(k, selector) {
          var parser = /([a-z][a-z0-9]*|\*)|(#[_a-z][-_a-z0-9]*)|(\.[_a-z][-_a-z0-9]*|\[[^\]]+\])|(:[-a-z]+)|( *[>+~] *| +)/gi;
          var pseudo = /^:(first-(line|letter)|before|after)$/;
          var base=32,TAG=1,ID=2,ATTR=3,PSEUDO=4,COMBI=5,weight=0,m;

          parser.lastIndex = 0;

          while (m = parser.exec(selector)) {
            if (m[ID]) {
              weight += 32*32;
            } else if (m[ATTR]) {
              weight += 32;
            } else if (m[PSEUDO]) {
              weight += (m[PSEUDO].match(pseudo) ? 1 : 10);
            } else if (m[TAG]) {
              weight += 1;
            }
          }

          $local(selector, cpdom).each(
            function() {
              var jself=$(this), log, i;

              if (!jself.data("_golf_jss_log"))
                jself.data("_golf_jss_log", {});
              if (!jself.data("_golf_jss_spc"))
                jself.data("_golf_jss_spc", {});

              log = jself.data("_golf_jss_spc");
              for (i in attrs) {
                if (log[i] > weight)
                  delete attrs[i];
                else
                  log[i] = weight;
              }

              $.extend(jself.data("_golf_jss_spc"), log);
              $.extend(jself.data("_golf_jss_log"), attrs);

              jself._golf_css(attrs);
              
              log = jself.data("_golf_css_log");
              for (i in log)
                jself._golf_css(jself.data("_golf_css_log"));
            }
          );
        }
      );
    });
  },
  
  // ---
  // Ultra lightweight CSS parser, only works with 100% valid css 
  // files, no support for hacks etc.
  // ---
  
  sanitize: function(content) {
    if(!content) return '';
    var c = content.replace(/[\n\r]/gi,''); // remove newlines
    c = c.replace(/\/\*.+?\*\//gi,''); // remove comments
    return c;
  },
  
  parse: function(content) {
    var c = this.sanitize(content);
    var tree = []; // this is the css tree that is built up
    c = c.match(/.+?\{.+?\}/gi); // seperate out selectors
    if(!c) return [];
    for(var i=0;i<c.length;i++) // loop through selectors & parse attributes
      if(c[i]) 
        tree.push( { 
          selector: this.parseSelectorName(c[i]),
          attributes: this.parseAttributes(c[i]) 
        } );
    return tree;
  },
  
  parseSelectorName: function(content) { // extract the selector
    return $.trim(content.match(/^.+?\{/)[0].replace('{','')); 
  },
  
  parseAttributes: function(content) {
    var attributes = {};
    c = content.match(/\{.+?\}/)[0].replace(/[\{\}]/g,'').split(';').slice(0,-1);
    for(var i=0;i<c.length; i++){
      if(c[i]){
        c[i] = c[i].split(':');
        attributes[$.trim(c[i][0])] = $.trim(c[i][1]);
      }; 
    };
    return attributes;
  }

};

function makePkg(pkg, obj) {
  if (!obj)
    obj = Component;

  if (!pkg || !pkg.length)
    return obj;

  var r = /^([^.]+)((\.)([^.]+.*))?$/;
  var m = pkg.match(r);

  if (!m)
    throw "bad package: '"+pkg+"'";

  if (!obj[m[1]])
    obj[m[1]] = {};

  return makePkg(m[4], obj[m[1]]);
}

function onLoad() {
  if (serverside)
    $("noscript").remove();

  if (urlHash && !location.hash)
    window.location.replace(servletUrl + "#" + urlHash);

  $.address.change(function(evnt) {
      onHistoryChange(evnt.value);
  });
}

var onHistoryChange = (function() {
  var lastHash = "";
  return function(hash, b) {

    d("history change => '"+hash+"'");
    if (hash && hash == "/")
      return $.golf.location(String($.golf.defaultRoute));

    if (hash && hash.charAt(0) != "/")
      return $.golf.location("/"+hash);

    if (hash && hash != lastHash) {
      lastHash = hash;
      hash = hash.replace(/^\/+/, "/");
      $.golf.location.hash = String(hash+"/").replace(/\/+$/, "/");
      window.location.hash = "#"+$.golf.location.hash;
      $.golf.route(hash, b);
    }
  };
})();

function prepare(p) {
  $("*", p).add([ p ]).each(function() { 
    // FIXME: verify whether 'this' is jQuery obj or DOM elem?
    var jself = $(this);
    var eself = jself.get()[0];

    if (jself.data("_golf_prepared"))
      return;

    jself.data("_golf_prepared", true);

    // makes hrefs in links work in both client and proxy modes
    if (eself.tagName === "A")
      jself.href(eself.href);
  });
  return p;
}

function componentConstructor(name) {
  var result = function() {
    var argv = Array.prototype.slice.call(arguments);
    var obj  = this;
    var cmp  = $.golf.components[name];

    d("Instantiating component '"+$.golf.components[name].name+"'");

    // $fake: the component-localized jQuery

    var $fake = function( selector, context ) {
      var isHtml = /^[^<]*(<(.|\s)+>)[^>]*$/;

      // if it's a function then immediately execute it (DOM loading
      // is guaranteed to be complete by the time this runs)
      if ($.isFunction(selector)) {
        selector();
        return;
      }

      // if it's not a css selector then passthru to jQ
      if (typeof selector != "string" || selector.match(isHtml))
        return new $(selector);

      // it's a css selector
      if (context != null)
        return $(context)
                  .find(selector)
                  .not($(".component *", obj._dom).get())
                  .not($("* .component", obj._dom).get());
      else 
        return $(obj._dom)
                  .find("*")
                  .andSelf()
                  .filter(selector)
                  .not($(".component *", obj._dom).get())
                  .not($("* .component", obj._dom).get());
    };

    $.extend($fake, $);
    $fake.prototype = $fake.fn;

    $fake.component = cmp;

    $fake.require = $.golf.require($fake);

    if (cmp) {
      obj._dom = cmp.dom.clone();
      obj._dom.data("_golf_constructing", true);
      obj.require = $fake.require;
      checkForReservedClass(obj._dom.children().find("*"));
      doCall(obj, $fake, $fake, argv, cmp.js, Debug(name));
      obj._dom.removeData("_golf_constructing");
      jss.mark(obj._dom.children().eq(0));
      jss.doit(obj._dom.children().eq(0));
    } else {
      throw "can't find component: "+name;
    }
  };
  result.prototype = new Component();
  return result;
}

// globals

window.d          = Debug("GOLF");
window.Debug      = Debug;
window.Component  = Component;

// serverside mods to jQuery

if (serverside) {

  if (!window.forcebot) {
    $.fx.off = true;

    $.fn.fadeIn = $.fn.slideDown = function(speed, callback) {
      return $.fn.show.call(this, 0, callback);
    };

    $.fn.fadeOut = $.fn.slideUp = function(speed, callback) {
      return $.fn.hide.call(this, 0, callback);
    };

    // this is problematic because the js css manipulations are not carried
    // over in proxy mode; needs to be in a style tag maybe
    //(function(fadeTo) {
    //  jQuery.fn.fadeTo = function(speed, opacity, callback) {
    //    return fadeTo.call(this, 0, opacity, callback);
    //  };
    //})(jQuery.fn.fadeTo);

    $.fn.slideToggle = function(speed, callback) {
      return $.fn.toggle.call(this, 0, callback);
    };

    $.fn.show = (function(show) {
      return function(speed, callback) {
        return show.call(this, 0, callback);
      };
    })($.fn.show);

    $.fn.hide = (function(hide) {
      return function(speed, callback) {
        return hide.call(this, 0, callback);
      };
    })($.fn.hide);

    $.fn.bind = (function(bind) {
      var lastId = 0;
      return function(name, fn) {
        var jself   = $(this);
        var _href   = jself.attr("href");
        var _golfid = jself.attr("golfid");
        if (name == "click") {
          if (!_golfid) {
            ++lastId;
            jself.attr("golfid", lastId);
          }
          if (_href) {
            jself.data("_golf_oldfn", fn);

            if (_href && _href.charAt(0) != "#")
              jself.data("_golf_oldhref", 
                  "/"+_href.replace(/^(http:\/\/)?([^\/]\/?)*\/\//g, ""));
            else if (jself.attr("href"))
              jself.data("_golf_oldhref", _href.replace(/^#/, ""));

            jself.attr({
              rel:  "nofollow",
              href: "?target="+lastId+"&event=onclick"
            });
            fn = function() {
              var argv = Array.prototype.slice.call(arguments);
              if ($(this).data("_golf_oldfn").apply(jss, argv) !== false) {
                $(this).attr("href", servletUrl+$(this).data("_golf_oldhref"));
                $.golf.location($(this).data("_golf_oldhref"));
              }
            };
          } else {
            var a = "<a rel='nofollow' href='?target="+lastId+
              "&amp;event=onclick'></a>";
            jself.wrap(a);
            jself._golf_addClass("golfproxylink");
          }
        } else if (name == "submit") {
          if (!_golfid) {
            ++lastId;
            jself.attr("golfid", lastId);
            jself.append(
              "<input type='hidden' name='event' value='onsubmit'/>");
            jself.append(
              "<input type='hidden' name='target' value='"+lastId+"'/>");
            if (!$.golf.events[lastId])
              $.golf.events[lastId] = [];
          }
          $.golf.events[jself.attr("golfid")].push(fn);
        }
        return bind.call(jself, name, fn);
      };
    })($.fn.bind);

    $.fn.trigger = (function(trigger) {
      return function(type, data) {
        var jself = $(this);
        // FIXME: this is here because hunit stops firing js submit events
        if (type == "submit") {
          var tmp = $.golf.events[jself.attr("golfid")];
          return $.each(tmp, function(){
            this.call(jself, type, data);
          });
        } else {
          return trigger.call($(this), type, data);
        }
      };
    })($.fn.trigger);
  }

  $.fn.val = (function(val) {
    return function(newVal) {
      if (arguments.length == 0)
        return $.trim(val.call($(this)));
      else
        return val.call($(this), newVal);
    };
  })($.fn.val);

  $.ajax = (function(ajax) {
    return function(options) {
      options.async = false;
      return ajax(options);
    };
  })($.ajax);

} else {

  $.fn.bind = (function(bind) {
    var lastId = 0;
    return function(name, fn) {
      var jself = $(this);
      if (name == "submit") {
        var oldfn = fn;
        fn = function() {
          var argv = Array.prototype.slice.call(arguments);
          try {
            oldfn.apply(this, argv);
          } catch(e) {
            $.golf.errorPage("Oops!", "<code>"+e.toString()+"</code>");
          }
          return false;
        };
      }
      return bind.call(jself, name, fn);
    };
  })($.fn.bind);

}

// install overrides on jQ DOM manipulation methods to accomodate components

(function() {

    $.each(
      [
        "append",
        "prepend",
        "after",
        "before",
        "replaceWith"
      ],
      function(k,v) {
        $.fn["_golf_"+v] = $.fn[v];
        $.fn[v] = function(a) { 
          var e = $(a instanceof Component ? a._dom : a);
          if (! (a instanceof Component))
            checkForReservedClass(e);

          prepare(e);
          var ret = $.fn["_golf_"+v].call($(this), e);
          $(e.parent()).each(function() {
            $(this).removeData("_golf_prepared");
          });
          jss.mark(this);
          if (a instanceof Component && a.onAppend)
            a.onAppend();
          return $(this);
        }; 
      }
    );

    $.fn._golf_remove = $.fn.remove;
    $.fn.remove = function() { 
      $("*", this).add([this]).each(function() {
        if ($(this).attr("golfid"))
          $.golf.events[$(this).attr("golfid")] = [];
      });
      return $.fn._golf_remove.call(this);
    }; 

    $.each(
      [
        "addClass",
        "removeClass",
        "toggleClass"
      ],
      function(k,v) {
        $.fn["_golf_"+v] = $.fn[v];
        $.fn[v] = function() {
          // FIXME need to cover the case of $(thing).removeClass() with no
          // parameters and when `thing` _has_ a reserved class already
          var putback = {};
          var self = this;
          if (arguments.length) {
            checkForReservedClass(arguments[0]);
          } else if (v == "removeClass") {
            $.map(checkForReservedClass(this, true), function(c) {
              putback[c] = $.map(self, function(e) {
                return $(e).hasClass(c) ? e : null;
              });
            });
          }
          var ret = $.fn["_golf_"+v].apply(this, arguments);
          for (var i in putback)
            for (var j in putback[i])
              $(putback[i][j])._golf_addClass(i);
          jss.mark(this);
          return ret;
        };
      }
    );

    $.fn._golf_css = $.fn.css;
    $.fn.css = function() {
      var log = this.data("_golf_css_log") || {};

      if (arguments.length > 0) {
        if (typeof arguments[0] == "string") {
          if (arguments.length == 1)
            return this._golf_css(arguments[0]);
          else
            log[arguments[0]] = arguments[1];
        } else {
          $.extend(log, arguments[0]);
        }

        for (var i in log)
          if (log[i] == "")
            delete log[i];

        this.data("_golf_css_log", log);
        var ret = this._golf_css(arguments[0], arguments[1]);
        jss.mark(this);
        return ret;
      }
      return this;
    };

    $.fn.href = (function() {
      var uri2;
      return function(uri) {
        var uri1    = parseUri(uri);
        var curHash = window.location.hash.replace(/^#/, "");
        var anchor;

        if (!uri2)
          uri2 = parseUri(servletUrl);

        if (uri1.protocol == uri2.protocol 
            && uri1.authority == uri2.authority
            && uri1.directory.substr(0, uri2.directory.length) 
                == uri2.directory) {
          if (uri1.queryKey.path) {
            if (cloudfrontDomain.length)
              uri = cloudfrontDomain[0]+uri.queryKey.path;
          } else if (uri1.anchor) {
            if (!uri1.anchor.match(/^\//)) {
              anchor = (curHash ? curHash : "/") + uri1.anchor;
              uri = "#"+anchor;
            } else {
              anchor = uri1.anchor;
            }
            if (serverside)
              this.attr("href", servletUrl + anchor);
          }
        }
      }; 
    })();
})();

// main jQ golf object

$.golf = {

  jssTimeout: 10,

  controller: [],

  defaultRoute: "/home/",
  
  reservedClassChecking: true,

  loaded: false,

  events: [],

  singleton: {},

  toJson: toJson,

  jss: function() {
    var argv = Array.prototype.slice.call(arguments);
    jss.doit.apply(jss, argv);
  },

  location: function(hash) {
    if (!!hash)
      $.address.value(hash);
    else
      return $.golf.location.hash;
  },

  htmlEncode: function(text) {
    return text.replace(/&/g,   "&amp;")
               .replace(/</g,   "&lt;")
               .replace(/>/g,   "&gt;")
               .replace(/"/g,   "&quot;");
  },

  addComponent: function(data, name) {
    var orig = data;
    var js = 
      data
        .replace(/^(.|\n)*<script +type *= *("text\/golf"|'text\/golf')>/, "")
        .replace(/<\/script>(.|\n)*$/, "");
    var css = 
      data
        .replace(/^(.|\n)*<style +type *= *("text\/golf"|'text\/golf')>/, "")
        .replace(/<\/style>(.|\n)*$/, "");
    var html = $("<div/>")._golf_append(
      $(data)._golf_addClass("component")
             ._golf_addClass(name.replace(".", "-"))
    );
    html.find("style,script").remove();
    var cmp  = { 
      "orig"  : orig,
      "name"  : name,
      "html"  : html.html(),
      "dom"   : $(html.html()),
      "css"   : css,
      "js"    : js 
    };
    var m, pkg;

    $.golf.components[name] = cmp;

    if (!(m = name.match(/^(.*)\.([^.]+)$/)))
      m = [ "", "", name ];

    pkg = makePkg(m[1]);
    pkg[m[2]] = componentConstructor(name);
  },

  setupComponents: function() {
    var cmp, name, i, m, scripts=[];

    d("Setting up components now.");

    d("Loading scripts/ directory...");
    for (name in $.golf.scripts)
      scripts.push(name);

    // sort scripts by name
    scripts = scripts.sort();

    for (i=0, m=scripts.length; i<m; i++) {
      d("Evaling '"+scripts[i]+"'...");
      $.globalEval($.golf.scripts[scripts[i]].js);
    }

    d("Loading components/ directory...");
    for (name in $.golf.components)
      $.golf.addComponent($.golf.components[name].html, name);

    if (!window.forcebot) {
      d("Loading styles/ directory...");
      $("head style").remove();
      for (name in $.golf.styles)
        $("head").append(
          "<style type='text/css'>"+$.golf.styles[name].css+"</style>");
    } else {
      $("head style").remove();
    }

    d("Done loading directories.");
  },

  route: function(hash, b) {
    var theHash, theRoute, theAction, i, x, pat, match;
    if (!hash)
      hash = String($.golf.defaultRoute+"/").replace(/\/+$/, "/");

    theHash         = hash;
    theRoute        = null;
    theAction       = null;

    if (!b) b = $("body > div.golfbody").eq(0);
    b.empty();

    try {
      if ($.golf.controller.length > 0) {
        for (i=0; i<$.golf.controller.length && theAction===null; i++) {
          theRoute = "^"+$.golf.controller[i].route+"$";
          match = $.isFunction(theRoute) ? theRoute(theHash) 
                    : theHash.match(new RegExp(theRoute));
          if (match)
            (theAction = $.golf.controller[i].action)(b, match);
        }
        if (theAction === null)
          $.golf.errorPage("Not Found", "<span>There is no route "
            +"matching <code>"+theHash+"</code>.</span>");
      } else {
        $.golf.errorPage("Hi there!", "<span>Your Golf web application "
          +"server is up and running.</span>");
      }
    } catch (e) {
      $(document).trigger({
        type: "route_error",
        message: e.toString()
      });
      d(e.stack);
      $.golf.errorPage("Oops!", "<code>"+e.toString()+"</code>");
    }
  },

  errorPage: function(type, desc) {
    $.get("app_error.html", function(data) {
      $(".golfbody").empty().append(data);
      $(".golfbody .type").text(type);
      $(".golfbody .description").append(desc);
    });
  },

  require: function($fake) {

    return function(name, cache) {
      var js, exports, target;

      try {
        if (!$.golf.plugins[name])
          throw "not found";

        js        = $.golf.plugins[name].js;
        exports   = {};
        target    = this;

        if (!$.golf.singleton[name])
          $.golf.singleton[name] = {};

        if (cache && cache[name]) {
          d("require: loading '"+name+"' recursively from cache");
          return cache[name];
        }

        if (!cache) {
          cache = {};
          
          $fake.require = (function(orig) {
            return function(name) {
              return orig(name, cache);
            };
          })($fake.require);
        }

        cache[name] = exports;

        (function(jQuery,$,js,singleton) {
          if (!singleton._init) {
            d("require: loading '"+name+"'");
            eval("exports._init = function($,jQuery,exports,singleton) { "+
              js+"; "+
              "return exports; "+
            "}");
            $.extend(true, singleton, exports);
            delete exports._init;
          } else {
            d("require: loading '"+name+"' from cache");
          }
          singleton._init($,$,exports,singleton);
        }).call(target,$fake,$fake,js,$.golf.singleton[name]);
      } catch (x) {
        throw "require: "+name+".js: "+x;
      }

      return exports;
    };
  }

};

// Static jQuery methods

$.Import = function(name) {
  var ret="", obj, basename, dirname, i;

  basename = name.replace(/^.*\./, "");
  dirname  = name.replace(/\.[^.]*$/, "");

  if (basename == "*") {
    obj = eval(dirname);
    for (i in obj)
      ret += "var "+i+" = "+dirname+"['"+i+"'];";
  } else {
    ret = "var "+basename+" = "+name+";";
  }

  return ret;
};

$.require = $.golf.require($);

$.golf.location.params = function(i) {
  var p = String($.golf.location.hash).replace(/(^\/|\/$)/g,"").split("/");
  if (i == null)
    return p;
  else
    return p[(p.length + i) % p.length];
};

// jQuery onload handler

$(function() {
  onLoad();
});

})(jQuery);
