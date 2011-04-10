module Golf
  class Rack
    
    def initialize(app)
      @app = app
    end

    def call(env)
      #compile it before we pass it to static
      Golf::Compiler.compile!(env)
      @app.call(env)
    end
    
  end
end

