require 'test_helper'

class RackTest < Test::Unit::TestCase
  include Rack::Test::Methods
  
  def app
    Golf::Rack.new
  end

  def test_component_regeneration
    get "/components.js"
    assert last_response.ok?
  end

  def test_resource_serving
    get "/jquery.js"
    assert last_response.ok?

    get "/jquery.golf.js"
    assert last_response.ok?

    get "/"
    assert last_response.ok?
  end

end
