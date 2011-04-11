module Golf
  class Compiler

    def initialize(golfpath = ".")
      @golfpath = golfpath
    end

    def generate_componentsjs
      "jQuery.golf.components=#{component_json};jQuery.golf.res=#{res_json};jQuery.golf.plugins=#{plugin_json};jQuery.golf.scripts=#{script_json};jQuery.golf.styles=#{style_json};jQuery.golf.setupComponents();"
    end

    def component_json
      puts "compiling components in #{@golfpath}..."
      components = traverse("#{@golfpath}/components", "html")
      JSON.dump(components)
    end

    def res_json
      JSON.dump({})
    end
    
    def plugin_json
      JSON.dump({})
    end

    def script_json
      JSON.dump({})
    end

    def style_json
      JSON.dump({})
    end

    def traverse(dir, type)
      results = {}
      if File.exists?(dir) and File.directory?(dir)
        Dir["#{dir}/**/*.#{type}"].each do |path|
          name = path.split('/').last.gsub(".#{type}",'')
          data = File.read(path)
          results = results.merge({ name => { "name" => name, "#{type}" => data }})
        end
      end
      results
    end

    
  end
end
