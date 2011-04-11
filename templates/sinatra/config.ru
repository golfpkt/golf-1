require 'rubygems'
require 'golf'
require 'sinatra'
require './demo'

use DemoBackend
run Golf::Rack.new

