require 'thor'
require 'thor/group'
require 'erb'

module Golf

  class CLI < Thor
    include Thor::Actions
    
    def self.source_root
      File.expand_path("../../../", __FILE__)
    end

    desc "new [NAME] (optional)[TEMPLATE]", "Creates new, rack-based golf app, takes NAME and optionally TEMPLATE [twitter, sinatra, rails]"
    def new(name, template = false)
      unless template
        directory("templates/new", name)
      else
        directory("templates/#{template}", name)
      end
    end
    
    desc "raw", "Dumps a raw hello world golfapp into current dir"
    def raw
      directory("templates/raw", "golfapp")
    end
    
    desc "generate [TYPE] [NAME]", "Generate stub code of TYPE for your already existing golfapp [component, plugin, script]"
    def generate(type, name)
      case type
        when "component"
        if name.include?('.')
          component_name = name.split('.').last
          package_name = name.gsub('.','/').split('/')[0...-1].join('/')
          create_file "golfapp/components/#{package_name}/#{component_name}/#{component_name}.html" do
            File.read(File.expand_path("../../../templates/component/Component.html", __FILE__))
          end
        else
          create_file "golfapp/components/#{name}/#{name}.html" do
            File.read(File.expand_path("../../../templates/component/Component.html", __FILE__))
          end
        end
      end
    end

    desc "server", "Run the golf app"
    def server
      `rackup`
    end
    
    desc "compile [DESTINATION]", "Compile the app into a directory"
    # move resources into destination from gem
    # move golfapp/ over destination
    # drop component.js into destination
    
    def compile(dir)
      if Golf::Compiler.valid?('.')
        compiler = Golf::Compiler.new
        gem_resources = File.expand_path("../../../resources", __FILE__)
        directory(gem_resources, dir)
        directory('golfapp/', dir)
        create_file "#{dir}/components.js" do
          compiler.generate_componentsjs
        end
      else
        puts "golfapp/components not found"
      end
    end    


    desc "version", "Output the version number"
    def version
      puts Golf::VERSION
    end


  end
  
end

