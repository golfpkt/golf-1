(function() {

    exports.search = function(query, callback) {
      $.getJSON(
        "http://search.twitter.com/search.json?q="+escape(query)+"&callback=?",
        function(data) {
          $.each(data.results, function(i, tweet) {
            callback(i, tweet);
          });
        }
      );
    };

})();
