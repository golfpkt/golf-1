
$.golf.controller = [

  { route: ".*",
    action: function(container, params) {
      container.append(new Component.Test());
    }
  }

];
