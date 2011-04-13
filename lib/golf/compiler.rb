module Golf

  class Compiler

    require 'find'

    def initialize(golfpath = ".")
      @golfpath = "#{golfpath}/golfapp"
      puts "golf #{Golf::VERSION}: starting compiler in #{@golfpath}..."
      components = "#{@golfpath}/components"
      puts "golf #{Golf::VERSION}: is valid golfapp?: #{File.exists?(components)}"
    end

    def generate_componentsjs
      "jQuery.golf.components=#{component_json};jQuery.golf.res=#{res_json};jQuery.golf.plugins=#{plugin_json};jQuery.golf.scripts=#{script_json};jQuery.golf.styles=#{style_json};jQuery.golf.setupComponents();"
    end

    def component_json
      traverse("#{@golfpath}/components", "html")
    end

    def res_json
      JSON.dump(compile_res(@golfpath))
    end

    def compile_res(dir)
      results = {}
      mypath  = dir.split('').last == "/" ? dir : dir+"/"
      myroot  = @golfpath.split('').last == "/" ? @golfpath : @golfpath+"/"
      Find.find(mypath) do |path|
        e = path.slice(mypath.length, path.length-mypath.length)
        r = path.slice(myroot.length, path.length-myroot.length)
        f = URI.escape(e)
        g = File.basename(e)
        h = File.dirname(r) == "." ? [] : File.dirname(r).split("/")
        if FileTest.directory?(path)
          next
        else
          r2 = results
          h.each { |i|
            if ! r2[i]
              r2[i] = {} 
            end
            r2 = r2[i]
          }
          r2[g] = f
        end
      end
      results
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
        Dir["#{dir}/**/*.#{type}"].sort.reverse.each do |path|
          if type == "html"
            name = package_name(path)
            arr = path.split('/')
            last_two = arr.slice(arr.length - 2 ,2)
            next if last_two[0] != last_two[1].gsub('.html','')
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
      if path.include?('golfapp/components')
        path.match(/golfapp\/components\/(.*)/)
        component_path = $1
        component_path.split('/')[0...-1].join('.')
      end
    end

  end
end
