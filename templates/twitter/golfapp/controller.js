$.golf.defaultRoute = "/golf/";

$.golf.controller = [
  { route: "/(.*)/",
    action: function(container, params) {
      container.append(new Component.golf.twitter.Search(params[1]));
    }
  }
];
