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



end
