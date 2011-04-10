(function() {

  function MyThing() {
    this.foo = "bar";
    this.baz = function() {
      console.log("hio");
    };
  }

  exports.MyThing = MyThing;

})();
