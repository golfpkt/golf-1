require 'test_helper'
require 'ostruct'



class CompilerTest < Test::Unit::TestCase

  def parse_file(js)
    file = File.read(js)
    arr = file.split(';;')
    result = OpenStruct.new
    result.components = JSON.parse arr[0].gsub('jQuery.golf.components=','')
    result.res = JSON.parse arr[1].gsub('jQuery.golf.res=','')
    result.res["components.js"] = "components.js"
    result.plugins = JSON.parse arr[2].gsub('jQuery.golf.plugins=','')
    result.scripts = JSON.parse arr[3].gsub('jQuery.golf.scripts=','')
    result.styles = JSON.parse arr[4].gsub('jQuery.golf.styles=','')
    result
  end

  def setup
    @compiler = Golf::Compiler.new(File.expand_path("../reference_app", __FILE__))
    @reference_file = File.expand_path("../reference_app/golfapp/components.js", __FILE__)
    @reference = parse_file(@reference_file)
    
  end

  def test_componentsjs_generation
    a = @reference.components
    b = JSON.parse @compiler.component_json
    assert_equal a.keys.sort,b.keys.sort
    assert_equal a,b
    puts a["HelloWorld"]["html"]
    puts b["HelloWorld"]["html"]
    a.keys.each do |key|
      puts "#{key} should be #{a[key].hash}, but was #{b[key].hash}"
    end
  end

  def test_res_generation
    a = @reference.res
    b = JSON.parse @compiler.res_json
    assert_equal a,b
  end

  def test_res_generation_components
    a = @reference.res
    b = JSON.parse @compiler.res_json

    assert_equal a["components"], b["components"]
  end

  def test_res_generation_plugins
    a = @reference.res
    b = JSON.parse @compiler.res_json

    assert_equal a["plugins"], b["plugins"]
  end

  def test_res_generation_img
    a = @reference.res
    b = JSON.parse @compiler.res_json

    assert_equal a["img"], b["img"]
  end

  def test_res_generation_styles
    a = @reference.res
    b = JSON.parse @compiler.res_json

    assert_equal a["styles"], b["styles"]
  end

  def test_res_generation_scripts
    a = @reference.res
    b = JSON.parse @compiler.res_json
    assert_equal a["scripts"], b["scripts"]
  end

  def test_plugin_generation
    a = @reference.plugins
    b = JSON.parse @compiler.plugin_json
    assert_equal a,b
  end

  def test_scripts_generation
    a = @reference.scripts
    b = JSON.parse @compiler.script_json
    assert_equal a,b
  end

  def test_styles_generation
    a = @reference.styles
    b = JSON.parse @compiler.style_json

    assert_equal a,b
  end

  def test_package_name_resolution
    result = @compiler.package_name '/asd/asdasd/golfapp/components/golf/twitter/Tweet/Tweet.html'
    assert_equal 'golf.twitter.Tweet', result
  end


end
