# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "golf/version"

Gem::Specification.new do |s|
  s.name        = "golf"
  s.version     = Golf::VERSION
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["Micha Niskin, Alan Dipert, Julio Capote"]
  s.email       = ["michaniskin@gmail.com"]
  s.homepage    = "http://golf.github.com"
  s.summary     = %q{Component based front end JS Framework}
  s.description = %q{Golf lets you write your interface in terms of reusable, simple components.}

  s.add_dependency('thor')
  s.add_dependency('json')
  s.add_dependency('rack')
  s.add_dependency('hpricot')
  s.add_dependency('haml')
  s.add_dependency('compass')

  s.bindir = 'bin'
  s.executables = ['golf']
  s.rubyforge_project = "golf"

  s.files         = `git ls-files`.split("\n").select { |x| !x.include?('golf-java') }
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]
end
