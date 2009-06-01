// this is the default action name, in case no action was specified
$.golf.defaultRoute = "/test/golfers/";

// this defines the golf controller
$.golf.controller = [

  // action for the /test/something/ routes
  { route:  "^/test/(([^/]+)/)+$",
    action: (function() {
      var client  = 
        new Component.com.thinkminimo.golf.test.client("foo", "bar");

      return function(b, match) {
        b.empty().append(client);
        match[2];
        return false;
      };
    })()
  },

  // the default action
  { route:  ".*",
    action: function(b, match) {
      $.golf.location($.golf.defaultRoute);
    }
  }

];
