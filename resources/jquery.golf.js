(function($) {

function Component() {
  this._dom = null;
  this._$   = null;
}

function Debug(prefix) {
  return function(text) {
    text = prefix+": "+text;
    if (window.devmode && window.console && window.console.log)
      console.log(text);
  };
}

function $local(selector, root) {
  return $(selector, root).not($(".component *", root)).not(".component");
}

function checkForReservedClass(elems, shutup) {
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

window.d          = Debug("GOLF");
window.Debug      = Component;
window.Component  = Component;

if (serverside) {

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

  (function(show) {
    $.fn.show = function(speed, callback) {
      return show.call(this, 0, callback);
    };
  })($.fn.show);

  (function(hide) {
    $.fn.hide = function(speed, callback) {
      return hide.call(this, 0, callback);
    };
  })($.fn.hide);

  (function() {
    $.fn.bind = (function(bind) {
      var lastId = 0;
      return function(name, fn) {
        var jself = $(this);
        if (name == "click") {
          ++lastId;
          jself.attr("golfid", lastId);
          var e = "onclick";
          var a = "<a rel='nofollow' class='golfproxylink' href='?target="+
            lastId+"&amp;event=onclick'></a>";
          jself.wrap(a);
        } else if (name == "submit") {
          if (!jself.attr("golfid")) {
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
        return bind.call($(this), name, fn);
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

  })();
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
        $.fn[v] = (function(orig) {
          return function(a) { 
            var e = $(a instanceof Component ? a._dom : a);
            if (! (a instanceof Component))
              checkForReservedClass(e);
            $.golf.prepare(e);
            var ret = orig.call($(this), e);
            $(e.parent()).each(function() {
              $(this).removeData("_golf_prepared");
            });
            $.golf.jss.doit(this);
            if (a instanceof Component && a.onAppend)
              a.onAppend();
            return $(this);
          }; 
        })($.fn[v]);
      }
    );

    $.each(
      [
        "addClass",
        "removeClass",
        "toggleClass"
      ],
      function(k,v) {
        (function(orig) {
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
            var ret = orig.apply(this, arguments);
            for (var i in putback)
              for (var j in putback[i])
                $(putback[i][j]).addClass(i);
            $.golf.jss.doit(this);
            return ret;
          };
        })($.fn[v]);
      }
    );

    $.fn.golfcss = $.fn.css;
    $.fn.css = function() {
      var log = this.data("_golf_css_log") || {};

      if (arguments.length > 0) {
        if (typeof arguments[0] == "string") {
          if (arguments.length == 1)
            return this.golfcss(arguments[0]);
          else
            log[arguments[0]] = arguments[1];
        } else {
          $.extend(log, arguments[0]);
        }

        for (var i in log)
          if (log[i] == "")
            delete log[i];

        this.data("_golf_css_log", log);
        var ret = this.golfcss(arguments[0], arguments[1]);
        $.golf.jss.doit(this);
        return ret;
      }
      return this;
    };

    $.fn.href = (function() {
      var uri2;
      return function(uri) {
        var uri1  = $.golf.parseUri(uri);

        if (!uri2)
          uri2 = $.golf.parseUri(servletUrl);

        if (uri1.protocol == uri2.protocol 
            && uri1.authority == uri2.authority
            && uri1.directory.substr(0, uri2.directory.length) 
                == uri2.directory) {
          if (uri1.queryKey.path) {
            if (cloudfrontDomain.length)
              uri = cloudfrontDomain[0]+uri.queryKey.path;
          } else if (uri1.anchor) {
            if (serverside)
              uri = servletUrl + uri1.anchor;
            else
              $(this).click(function() {
                $.golf.location(uri1.anchor);
                return false;
              });
          }
        }
        this.attr("href", uri);
      }; 
    })();
})();

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

// jQuery.include = function(module) {
//   var js = module.js;
//   var d  = Debug(module.name);
//   var argv = Array.prototype.slice.call(arguments, 1);
//   if (js.length > 10)
//     jQuery.golf.doCall(window, jQuery, argv, js, d);
// };

// main jQ golf object

$.golf = {

  defaultRoute: "/home/",
  
  onRouteError: undefined,

  events: [],

  location: function(hash) {
    $.address.value(hash);
  },

  htmlEncode: function(text) {
    return text.replace(/&/g,   "&amp;")
               .replace(/</g,   "&lt;")
               .replace(/>/g,   "&gt;")
               .replace(/"/g,   "&quot;");
  },

  /* parseUri is based on work (c) 2007 Steven Levithan <stevenlevithan.com> */

  parseUri: (function() {
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
    return function(str) {
      var m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
          uri = {},
          i   = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });

      return uri;
    };
  })(),

  /* jss is based on: JSS - 0.4 by Andy Kent */

  jss: {
    
    doit: function(elem) {
      var cpdom, cpname, data, parsed;

      try {
        cpdom  = $(elem).parents(".component").eq(0);
        cpname = cpdom.attr("class").split(" ")[1].replace(/-/g, ".");
        data   = $.golf.components[cpname].css;
        parsed = this.parse(data);
      } 
      catch (x) {
        d("can't do jss--skipping it");
        return;
      }

      $local("*", cpdom).each(
        function() {
          var jself = $(this);
          for (var i in jself.data("_golf_jss_log"))
            jself.golfcss(i, "");
          jself.removeData("_golf_jss_log");
          jself.golfcss(jself.data("_golf_css_log"));
        }
      );

      $.each(parsed, function() {
        var selector = this.selector;
        var attrs    = this.attributes;
        $local(selector, cpdom).each(
          function() {
            var jself = $(this);
            if (!jself.data("_golf_jss_log"))
              jself.data("_golf_jss_log", {});
            $.extend(jself.data("_golf_jss_log"), attrs);
            jself.golfcss(attrs);
            var log = jself.data("_golf_css_log");
            for (i in log)
            jself.golfcss(jself.data("_golf_css_log"));
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

  },

  makePkg: function(pkg, obj) {
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

    return $.golf.makePkg(m[4], obj[m[1]]);
  },

  setupComponents: function() {
    var cmp, name, i, m, pkg, scripts=[];

    d("Setting up components now.");

    d("Loading styles/ directory...");
    for (name in $.golf.styles)
      $("head").append(
        "<style type='text/css'>"+$.golf.styles[name].css+"</style>");

    d("Loading components/ directory...");
    for (name in $.golf.components) {
      cmp = $.golf.components[name];
      // add css to <head>
      // if (cmp.css.replace(/^\s+|\s+$/g, '').length > 3)
      //   $("head").append(
      //       "<style type='text/css'>"+cmp.css+"</style>");

      if (!(m = name.match(/^(.*)\.([^.]+)$/)))
        m = [ "", "", name ];

      pkg = $.golf.makePkg(m[1]);
      pkg[m[2]] = $.golf.componentConstructor(name);
    }

    d("Loading scripts/ directory...");
    for (name in $.golf.scripts)
      scripts.push(name);

    // sort scripts by name
    scripts = scripts.sort();

    for (i=0, m=scripts.length; i<m; i++)
      $.globalEval($.golf.scripts[scripts[i]].js);

    d("Done loading directories...");
    // FIXME: hunit weirdness workaround
    $.golf.setupComponents = function() {};
  },

  doCall: function(obj, jQuery, $, argv, js, d) {
    d = !!d ? d : window.d;
    if (js.length > 10) {
      var f;
      eval("f = "+js);
      f.apply(obj, argv);
    }
  },
    
  onLoad: function() {
    if (serverside)
      $("noscript").remove();

    if (urlHash && !location.hash)
      window.location.replace(servletUrl + "#" + urlHash);

    $.address.change(function(evnt) {
        $.golf.onHistoryChange(evnt.value);
    });
  },

  onHistoryChange: (function() {
    var lastHash = "";
    return function(hash, b) {

      d("history change => '"+hash+"'");
      if (hash == "/") {
        $.golf.location(String($.golf.defaultRoute));
        return;
      }

      if (hash && hash != lastHash) {
        lastHash = hash;
        hash = hash.replace(/^\/+/, "/");
        $.golf.location.hash = String(hash+"/").replace(/\/+$/, "/");
        window.location.hash = "#"+$.golf.location.hash;
        $.golf.route(hash, b);
      }
    };
  })(),

  route: function(hash, b) {
    var theName, theAction, i, x, pat, match;
    if (!hash)
      hash = String($.golf.defaultRoute+"/").replace(/\/+$/, "/");

    theName         = hash;
    theAction       = null;

    if (!b) b = $("body > div.golfbody").eq(0);
    //b.empty();

    if ($.golf.controller) {
      for (i=0; i<$.golf.controller.length; i++) {
        pat   = new RegExp($.golf.controller[i].route);
        match = theName.match(pat);
        if (match) {
          theAction = $.golf.controller[i].action;
          if (theAction(b, match)===false)
            break;
          theAction = null;
        }
      }
    } else {
      alert("GOLF is installed! Congratulations. Now make yourself an app.");
    }
  },

  prepare: function(p) {
    $("*", p.parent()).each(function() { 
        var jself = $(this);

        if (jself.data("_golf_prepared"))
          return;

        jself.data("_golf_prepared", true);

        // makes hrefs in links work in both client and proxy modes
        if (this.tagName == "A")
          jself.href(this.href);

        // this is for the jss "transaction log"
        $.each([ "_golf_jss_log", "_golf_css_log", "_golf_att_log" ], 
          function(k,v) {
            if (!jself.data(v))
              jself.data(v, {});
          }
        );
    });
    return p;
  },

  componentConstructor: function(name) {
    var result = function() {
      var argv = Array.prototype.slice.call(arguments);
      var obj  = this;
      var cmp  = $.golf.components[name];

      d("Instantiating component '"+$.golf.components[name].name+"'");

      // the component-localized jQuery engine
      var $fake = function( selector, context ) {
        return new $fake.fn.init( selector, context );
      };

      $.extend(true, $fake, $);
      $fake.fn = $fake.prototype;
      $fake.fn.init.prototype = $fake.fn;
      $fake.Event.prototype = $.Event.prototype;

      (function(orig) {
        $fake.fn.init = function(selector) {
          var isHtml = /^[^<]*(<(.|\s)+>)[^>]*$/;

          // if it's not a selector then passthru to jQ
          if (typeof selector != "string" || selector.match(isHtml))
            return new orig(selector);

          return new orig(obj._dom)
                    .find(selector)
                    .not($(".component *", obj._dom).get())
                    .not(".component");
        };
      })($fake.fn.init);

      $fake.component = cmp;

      $fake.require = function(name, obj) {
        var js        = $.golf.plugins[name].js;
        var exports   = {};
        var target    = obj || window;
        try {
          (function(jQuery,$,js,exports) {
            eval(js)
          }).call(target,$fake,$fake,js,exports);
        } catch (x) {
          d("can't require("+name+"): "+x);
        }
        return exports;
      };

      if (cmp) {
        obj._dom = $(cmp.html);
        checkForReservedClass(obj._dom.children().find("*"));
        $.golf.doCall(obj, $fake, $fake, argv, cmp.js, Debug(name));
      } else {
        throw "can't find component: "+name;
      }
    };
    result.prototype = new Component();
    return result;
  }

};

$($.golf.onLoad);

})(jQuery);
