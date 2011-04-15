module Golf

  module Filter
    class Upcase
      def self.transform(data)
        data.upcase
      end
    end

  end

  
  class Compiler

    require 'find'

    attr_accessor :golfpath

    def initialize(golfpath = '.')
      self.golfpath = "#{golfpath}/golfapp"
      puts "golf #{Golf::VERSION}: starting compiler in #{@golfpath}..."
      puts "golf #{Golf::VERSION}: is valid golfapp?: #{Golf::Compiler.valid?(@golfpath)}"
      puts "golf #{Golf::VERSION}: loading filters in #{golfpath}/filters"
      Dir["#{golfpath}/filters/*.rb"].each do |path|
        require path
      end
    end

    def self.valid?(dir)
      File.exists?("#{dir}/golfapp/components")
    end


    def generate_componentsjs
      "jQuery.golf.components=#{component_json};;jQuery.golf.res=#{res_json};;jQuery.golf.plugins=#{plugin_json};;jQuery.golf.scripts=#{script_json};;jQuery.golf.styles=#{style_json};;jQuery.golf.setupComponents();"
    end

    def component_json
      traverse_components
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
      if File.exists?(mypath)
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

    def traverse_components
      results = {}
      Dir["#{@golfpath}/components/**/*"].each do |path|
        name = package_name(path)
        valid_arr = path_valid_for_filtering?(path)
        next if FileTest.directory?(path) or !path.include?('.html')
        data = filtered_read(path)
        data_arr = extract_parts(data, path)
        results = results.merge({ name => { "name" => name, "html" => data_arr["html"], "css" => data_arr["css"], "js" => data_arr["js"] }})
      end
      JSON.dump(results)
    end


    def traverse(dir, type)
      results = {}
      if File.exists?(dir) and File.directory?(dir)
        Dir["#{dir}/**/*.#{type}"].sort.reverse.each do |path|
          name = path.split('/').last.gsub(".#{type}",'')
          data = filtered_read(path)
          results = results.merge({ name => { "name" => name, "#{type}" => data }})
        end
      end
      JSON.dump(results)
    end
    
    def extract_parts(data, path)
      component_name = path.split('/').last
      component_dir = path.gsub(component_name, '')
      #load from file
      doc = Hpricot(data)
      arr = {}
      css = (doc/'//style').first
      if css
        arr["css"] = css
      end
      js = (doc/'//script').first
      if js
        arr["js"] = js
      end
      (doc/'//style').remove
      (doc/'//script').remove


      arr["html"] = doc.to_s

      #load from files, ".js.coffee", etc
      Dir["#{component_dir}/*"].each do |file_path|
        valid_arr = path_valid_for_filtering?(file_path)
        if valid_arr
          filter_name = valid_arr[1]
          output_type = valid_arr[0]
          arr[output_type] = filtered_read(file_path)
        else
          extension = file_path.split('/').last.split('.').last
          arr[extension] = File.read(file_path)
        end
      end
      arr
    end
    
    def filtered_read(path)
      data = File.read(path)
      if path.split('.').last == 'html'
        data = filter_by_block(data)
      end
      data = filter_by_extension(data, path)
      data
    end
    
    def filter_by_block(data)
      doc = Hpricot(data)
      if doc
        unfiltered_elements = doc.search('//*[@filter]')
        if unfiltered_elements.count == 0
          data
        else
          unfiltered_elements.each do |element|
            filter = element.attributes["filter"]
            filter_name = filter.capitalize.to_sym
            if Golf::Filter.constants.include?(filter_name)
              element.remove_attribute('filter')
              res = Golf::Filter.const_get(filter_name).transform(element.to_s)
              element.swap(res)
            end
          end
          return doc.to_s
        end
      else
        data
      end
    end

    def path_valid_for_filtering?(path)
      path_arr = path.split('/').last.split('.')
      if path_arr.count > 2
        last_two = path_arr[path_arr.length - 2..path_arr.length]
        if last_two[0] == "js" or last_two[0] == "css" or last_two[0] == "html"
          last_two
        end
      end
    end

    def filter_by_extension(data, path)
      valid_arr = path_valid_for_filtering?(path)
      if valid_arr
        filter_name = valid_arr[1].capitalize.to_sym
        if Golf::Filter.constants.include?(filter_name)
          Golf::Filter.const_get(filter_name).transform(data)
        else
          data
        end
      else
        data
      end
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
