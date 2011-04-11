require 'test_helper'

class CompilerTest < Test::Unit::TestCase

  def setup
    @compiler = Golf::Compiler.new(File.expand_path("../data", __FILE__))
  end


  def test_componentsjs_generation
    componentjs = @compiler.generate_componentsjs
    known_good = 'jQuery.golf.components={"HelloWorld":{"name":"HelloWorld","html":"<div><styletype=\"text/golf\">div.container{border:1pxsolidred;}</style><scripttype=\"text/golf\">function(){$(\".container\").append(\"<h1>Hello,world!</h1>\");}</script><divclass=\"container\"></div></div>"}};jQuery.golf.res={};jQuery.golf.plugins={};jQuery.golf.scripts={};jQuery.golf.styles={};jQuery.golf.setupComponents();'

    assert_equal componentjs.gsub(' ','').gsub('\n',''), known_good.gsub(' ','').gsub('\n','')
    
  end

end
