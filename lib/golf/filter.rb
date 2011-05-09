require 'haml'
require 'sass'
require 'compass'
require 'fileutils'
require 'erb'

module Golf
  module Filter
    class Scss
      def self.transform(data)
        ::Sass::Engine.new(data, Compass.configuration.to_sass_engine_options.update(:syntax => :scss)).render
      end
    end
    class Sass
      def self.transform(data)
        ::Sass::Engine.new(data, Compass.configuration.to_sass_engine_options.update(:syntax => :sass)).render
      end
    end
    class Haml
      def self.transform(data)
        ::Haml::Engine.new(data).render
      end
    end
    class Erb
      def self.transform(data)
        ::ERB.new(data).result
      end
    end
  end
end

