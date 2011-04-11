require 'bundler'
require 'golf'
require 'rack'
require 'rack/contrib'

use Golf::Rack
use Rack::Static, :urls => ["/"], :root => "golfapp"
run Rack::NotFound.new('404.txt')