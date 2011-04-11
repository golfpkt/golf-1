require 'bundler'
require 'golf'
require 'rack'
require 'rack/contrib'

use Golf::Rack
run Rack::NotFound.new('404.txt')