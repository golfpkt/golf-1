require 'test_helper'

class CompilerTest < Test::Unit::TestCase

  def test_component_discovery
    components = Golf::Compiler.discover_components
    assert components
  end

end
