module Golf
  class Compiler

    def initialize(golfpath = ".")
      puts "starting up in #{golfpath}"
      @golfpath = golfpath
    end

    def generate_componentsjs
      "jQuery.golf.components=#{component_json};jQuery.golf.res=#{res_json};jQuery.golf.plugins=#{plugin_json};jQuery.golf.scripts=#{script_json};jQuery.golf.styles=#{style_json};jQuery.golf.setupComponents();"
    end

    def component_json
      traverse("#{@golfpath}/components", "html")
    end

    def res_json
      results = { "Gemfile" => "Gemfile", "plugins" => {},"config.ru" => "config.ru", "404.txt" => "404.txt" }
      Dir["#{@golfpath}/plugins/*.js"].each do |path|
        results["plugins"] = results["plugins"].merge({ File.basename(path) => "plugins/#{File.basename(path)}"})
      end
      JSON.dump(results)
    end
    
    def plugin_json
      traverse("#{@golfpath}/plugins", "js")
    end

    def script_json
      traverse("#{@golfpath}/scripts", "js")
    end

    def style_json
      traverse("#{@golfpath}/styles", "css")
    end

    def traverse(dir, type)
      results = {}
      if File.exists?(dir) and File.directory?(dir)
        Dir["#{dir}/**/*.#{type}"].each do |path|
          if type == "html"
            name = package_name(path)
          else
            name = path.split('/').last.gsub(".#{type}",'')
          end
          data = File.read(path)
          results = results.merge({ name => { "name" => name, "#{type}" => data }})
        end
      end
      JSON.dump(results)
    end

    def package_name(path)
      path_arr = path.split('/')
      i = path_arr.index('components')
      name_segment = (path_arr.length - 1) - i
      path_arr.slice(i + 1, name_segment - 1).join('.')
    end


  end
end