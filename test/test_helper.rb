$:.push File.expand_path("../../lib", __FILE__)

require 'rubygems'
require 'test/unit'
require 'rack/test'
require 'simplecov'

SimpleCov.start

require 'golf'
