function(arg1, arg2) {

  function test(name, assertion) {
    $(".current").removeClass("current");

    $("table").append(
        $("<tr/>").append(
          $("<td/>").addClass("testcase").text(name)
        ).append(
          $("<td/>").addClass("none").addClass("current").text("SKIPPED")
        )
    );

    if (assertion !== undefined)
      assert(assertion);
  }

  function assert(assertion) {
    var result;
    if (typeof(assertion) === "function") {
      try {
        result = assertion();
      } catch (e) {
        error();
        return;
      }
    } else if (assertion !== undefined) {
      result = !!assertion;
    }

    if (result === undefined)
      none();
    else if (result)
      pass();
    else
      fail();
  }

  function pass(e) {
    $(!!e ? e : ".current").removeClass("none").removeClass("pass")
      .removeClass("fail").removeClass("error").removeClass("current")
      .addClass("pass").text("PASSED");
  }

  function fail(e) {
    $(!!e ? e : ".current").removeClass("none").removeClass("pass")
      .removeClass("fail").removeClass("error").removeClass("current")
      .addClass("fail").text("FAILED");
  }

  function error(e) {
    $(!!e ? e : ".current").removeClass("none").removeClass("pass")
      .removeClass("fail").removeClass("error").removeClass("current")
      .addClass("error").text("ERROR");
  }

  function none(e) {
    $(!!e ? e : ".current").removeClass("current").removeClass("pass")
      .removeClass("fail").removeClass("error")
      .addClass("none").text("SKIP");
  }

  $.ajaxSetup({async:false});

//----------------------------------------------------------------------------//

  test("head.html");

  test("constructor argv", function() { 
      return arg1 == "foo" && arg2 == "bar";
  });

  test("AJAX GET");
  $.get("?path=controller.js", function(data) {
    assert(data.length > 10);
  });

  test("AJAX POST", function() { throw "omg" });

  test("AJAX PUT");

  test("AJAX DELETE");

  test("JSONP GET");
  (function() {
    // flickr.com api url
    var url = "http://api.flickr.com/services/feeds/photos_public.gne"+
                "?tags=dogs&tagmode=any&format=json&jsoncallback=?";
    var e = $(".current");
    fail(e);
    $.getJSON(url, function(data) {
      if (!data.items || data.items.length == 0)
        error(e);
      else
        pass(e);
    });
  })();

  test("$.golf.res object");
  $.get($.golf.res.test["test.html"], function(data) {
    assert(data == "PASS\n");
  });

  test("$.component.res object");
  $.get($.component.res.test["test.html"], function(data) {
    assert(data == "PASS\n");
  });

}
