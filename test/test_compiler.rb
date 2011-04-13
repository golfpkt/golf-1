require 'test_helper'

class CompilerTest < Test::Unit::TestCase

  def setup
    @compiler = Golf::Compiler.new(File.expand_path("../twitter_compiled", __FILE__))
    @reference_file = File.read(File.expand_path("../twitter_compiled/golfapp/components.js", __FILE__))
  end


  def test_componentsjs_generation
    componentjs = @compiler.generate_componentsjs
    known_good = File.read(File.expand_path("../twitter_compiled/golfapp/components.js", __FILE__))
    assert_equal componentjs.gsub(' ','').gsub('\n','').gsub('\\',''), known_good.gsub(' ','').gsub('\n','').gsub('\\','')
  end


  def test_package_name_resolution
    result = @compiler.package_name '/asd/asdasd/golfapp/components/golf/twitter/Tweet/Tweet.html'
    assert_equal 'golf.twitter.Tweet', result

  end


end
