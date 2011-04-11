require 'test_helper'

class RackTest < Test::Unit::TestCase
  include Rack::Test::Methods
  
  def app
    Golf::Rack.new
  end

  def test_component_regeneration
    get "/components.js"
    assert_equal last_response.original_headers["Content-Type"], "application/javascript"
    assert last_response.ok?
  end

  def test_js_serving
    get "/jquery.js"
    assert last_response.body.include?('John Resig')
    assert_equal last_response.original_headers["Content-Type"], "application/javascript"
    assert last_response.ok?

    get "/jquery.golf.js"
    assert last_response.body.include?('golf')
    assert_equal last_response.original_headers["Content-Type"], "application/javascript"
    assert last_response.ok?

  end

  def test_root
    get "/"
    assert last_response.body.include?('html')
    assert last_response.original_headers["Content-Type"] == "text/html"
    assert last_response.ok?
  end

  def test_not_found
    get "/asdasdasdsdsds"
    assert last_response.body.include?('not found')
    assert_equal last_response.status, 404
  end

end
