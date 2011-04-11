module Golf
  class Compiler

    def initialize(golfpath = "components")
      @golfpath = golfpath
    end

    def generate_componentsjs
      puts "compiling components in #{@golfpath}..."
      component_preamble = 'jQuery.golf.components='
      components = {}
      if File.exists?(@golfpath) and File.directory?(@golfpath)
        Dir["#{@golfpath}/**/*.html"].each do |path|
          name = path.split('/').last.gsub('.html','')
          html = File.read(path)
          components = components.merge({ name => { "name" => name, "html" => html }})
        end
      end
      component_preamble << JSON.dump(components) << ';' << 'jQuery.golf.res={};jQuery.golf.plugins={};jQuery.golf.scripts={};jQuery.golf.styles={};jQuery.golf.setupComponents();'
    end
    
  end
end
