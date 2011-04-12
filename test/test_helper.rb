$:.push File.expand_path("../../lib", __FILE__)

require 'rubygems'
require 'simplecov'

SimpleCov.start


require 'test/unit'
require 'rack/test'
require 'golf'
