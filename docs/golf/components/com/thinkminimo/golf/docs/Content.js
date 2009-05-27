(function() {

  var sd = new Showdown.converter();
  var cache = {};

  function doit(path) {
    $(".content").hide();
    $(".content").empty().append(cache[path]);
    $(".content").show().fadeTo(2000, 0.5);
  };

  return function() {
    this.setPath = function(path) {
      path = path.replace(/^\/+/, "");
      if (!!cache[path])
        doit(path);
      else
        $.get($.component.res[path+"index.markdown"], function(data) {
          cache[path] = sd.makeHtml(data);
          doit(path);
        });
    };
  };

})()
