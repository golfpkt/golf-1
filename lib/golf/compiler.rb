module Golf
  class Compiler

    def initialize(golfpath = "components")
      @golfpath = golfpath
    end

    def generate_componentsjs
      "jQuery.golf.components=#{component_json};jQuery.golf.res=#{res_json};jQuery.golf.plugins=#{plugin_json};jQuery.golf.scripts=#{script_json};jQuery.golf.styles=#{style_json};jQuery.golf.setupComponents();"
    end

    def component_json
      puts "compiling components in #{@golfpath}..."
      components = {}
      if File.exists?(@golfpath) and File.directory?(@golfpath)
        Dir["#{@golfpath}/**/*.html"].each do |path|
          name = path.split('/').last.gsub('.html','')
          html = File.read(path)
          components = components.merge({ name => { "name" => name, "html" => html }})
        end
      end
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



    
  end
end
