$.golf.defaultRoute = "/store/";
$.golf.devmode = true;

var store;

$.golf.controller = [

  { route: "/admin/",
    action: function(container, params) {
      container.append(new Component.golf.cart.Admin());
    }
  },

  { route: "/store/",
    action: function(container, params) {
      if (!store)
        store = new Component.golf.cart.Store();
      container.append(store);
    }
  },

  { route: ".*",
    action: function(container, params) {
      container.append("<h3>Not found :(</h3>");
    }
  }

];
