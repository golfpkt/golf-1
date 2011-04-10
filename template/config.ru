require 'bundler'
require 'golf'
require 'rack'
require 'rack/contrib'

use Golf::Rack
run Rack::Static, :urls => ["/"], :root => "golfapp"