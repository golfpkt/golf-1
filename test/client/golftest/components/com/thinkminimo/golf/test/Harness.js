function() {

  //----------------- public methods, instance variables -------------------//

  this.test = function(name, assertion) {
    var ret;

    if (!name.match(/</) && !name.nodeType && !name.jquery && !name._dom)
      name = $("<span/>").text(name);

    $(".current").removeClass("current");

    $("table.tests > tbody").append(
        $("<tr/>").append(
          $("<td/>").addClass("testnum").text(++tests)
        ).append(
          $("<td/>").addClass("testcase").append(name)
        ).append(
          ret = $("<td/>").addClass("current")
        )
    );

    this.none(ret);

    if (assertion !== undefined)
      this.assert(assertion);

    $("table.tests").trigger('sort');

    return ret;
  };

  this.assert = function(assertion, elem) {
    var result;

    if (typeof(assertion) === "function") {
      try {
        result = assertion();
      } catch (e) {
        this.error(elem);
        return;
      }
    } else if (assertion !== undefined) {
      result = !!assertion;
    }

    this[(result === undefined ? "none" : (result ? "pass" : "fail"))](elem);
  };

  var comp = this;

  var stats = [
    { name: "none",   mesg: "SKIPPED" },
    { name: "pass",   mesg: "PASSED"  },
    { name: "fail",   mesg: "FAILED"  },
    { name: "error",  mesg: "ERROR"   },
    { name: "wait",   mesg: "WAITING" }
  ];

  $.each(stats, function(i_stat, v_stat) {
    var mesg = v_stat.mesg;
    comp[v_stat.name] = function(e) {
      e = $(!!e ? e : ".current");
      $.each(stats, function(k,v) { e.removeClass(v.name) });
      e.addClass(v_stat.name).text(v_stat.mesg);
    };
  });

  //----------------- private methods, instance variables ------------------//

  var tests = 0;

  //----------------- initialization ---------------------------------------//

  $("table.tests").bind('sort', function() {
    $("tbody > tr", this).not($("td table *", this)).each(function(k,v) {
      $(this).removeClass(["odd","even"][k%2]).addClass(["even","odd"][k%2]);
    });
  }).makeSortable();

}
