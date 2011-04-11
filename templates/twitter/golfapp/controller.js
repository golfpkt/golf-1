$.golf.defaultRoute = "/golf/";

$.golf.controller = [
  { route: "/(.*)/",
    action: function(container, params) {
      container.append(new Component.golf.twitter.Search(unescape(params[1])));
    }
  }
];
