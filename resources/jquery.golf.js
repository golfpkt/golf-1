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

window.d = Debug("GOLF");
window.Debug = Component;
window.Component = Component;

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
            $.golf.prepare(e);
            var ret = orig.call($(this), e);
            $(e.parent()).each(function() {
              $(this).removeData("_golf_prepared");
            });
            if (a instanceof Component && a.onAppend)
              a.onAppend();
            return $(this);
          }; 
        })($.fn[v]);
      }
    );

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
      if (cmp.css.replace(/^\s+|\s+$/g, '').length > 3)
        $("head").append(
            "<style type='text/css'>"+cmp.css+"</style>");

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
      location.href = servletUrl + "#" + urlHash;

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
    $("a", p.parent()).each(function() { 
        var jself = $(this);
        if (jself.data("_golf_prepared"))
          return;
        jself.data("_golf_prepared", true);
        jself.href(this.href);
    });
    return p;
  },

  componentConstructor: function(name) {
    var result = function() {
      var argv = Array.prototype.slice.call(arguments);
      var obj  = this;

      d("Instantiating component '"+$.golf.components[name].name+"'");

      // the component-localized jQuery engine
      var $fake = function( selector, context ) {
        return new $fake.fn.init( selector, context );
      };

      $.extend($fake.prototype, $.fn);
      $fake.fn = $fake.prototype;
      $fake.fn.init.prototype = $fake.fn;

      (function(orig) {
        $fake.fn.init = function(selector) {
          var isHtml = /^[^<]*(<(.|\s)+>)[^>]*$/;

          // if it's not a selector then passthru to jQ
          if (typeof(selector) != "string" || selector.match(isHtml))
            return new orig(selector);

          return new orig(obj._dom)
                    .find(selector)
                    .not($(".component *", obj._dom).get())
                    .not(".component");
        };
      })($fake.fn.init);

      var cmp = $.golf.components[name];
      
      $fake.component = cmp;

      $fake.include = function(module) {
        var js = module.js;
        var d  = Debug(module.name);
        var argv = Array.prototype.slice.call(arguments, 1);
        if (js.length > 10)
          $.golf.doCall(obj, $fake, $fake, argv, js, d);
      }

      $fake.require = function(name) {
        var js = $.golf.plugins[name].js;
        try {
          (function(jQuery,$,js) { eval(js) }).call(window,$fake,$fake,js);
        } catch (x) {
          d("can't require("+name+"): "+x);
        }
      };

      if (cmp) {
        obj._dom = $(cmp.html);
        obj._$   = $fake;
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
