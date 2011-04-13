module Golf

  class Compiler

    require 'find'

    def initialize(golfpath = ".")
      @golfpath = "#{golfpath}/golfapp"
      puts "golf #{Golf::VERSION}: starting compiler in #{@golfpath}..."
      puts "golf #{Golf::VERSION}: is valid golfapp?: #{Golf::Compiler.valid?(@golfpath)}"
    end

    def self.valid?(dir)
      File.exists?("#{dir}/golfapp/components")
    end


    def generate_componentsjs
      "jQuery.golf.components=#{component_json};;jQuery.golf.res=#{res_json};;jQuery.golf.plugins=#{plugin_json};;jQuery.golf.scripts=#{script_json};;jQuery.golf.styles=#{style_json};;jQuery.golf.setupComponents();"
    end

    def component_json
      traverse("#{@golfpath}/components", "html")
    end

    def res_json
      JSON.dump(compile_res(@golfpath))
    end

    # compile_res: This function creates a hash representation of
    # the file structure relative to <dir>. The values are either
    # hashes (for directories) or strings (for files). The string
    # values are the path to the file relative to @golfpath.
    # 
    # Example: compile_res("#{@golfpath}/dir1")
    #
    # @golfpath/
    #   |--dir1/
    #   |    |--file1
    #   |    |--file2
    #   |    +--dir2/
    #   |         |--file3
    #   |         |--file4
    #   |         +--dir3/
    #   |              |--file5
    #   |              +--file6
    #   +--dir4/
    #
    # { 
    #   file1 => "dir1/file1",
    #   file2 => "dir1/file2",
    #   dir2  => {
    #     file3 => "dir1/dir2/file3",
    #     file4 => "dir1/dir2/file4"
    #     dir3  => {
    #       file5 => "dir1/dir2/dir3/file5",
    #       file6 => "dir1/dir2/dir3/file6"
    #     }
    #   }
    # }
    #
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
