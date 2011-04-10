require 'thor'
require 'thor/group'
require 'erb'

module Golf

  class CLI < Thor
    include Thor::Actions
    
    def self.source_root
      File.expand_path("../../../", __FILE__)
    end

    desc "new [NAME]", "Creates new golf app"
    def new(name)
      directory("template", name)
    end

    desc "server", "Run the golf app"
    def server
      `rackup`
    end
    
    desc "compile [DESTINATION]", "Compile the app into a directory"
    def compile(dir)
      Golf::Compiler.compile!
    end

  end
  
end

