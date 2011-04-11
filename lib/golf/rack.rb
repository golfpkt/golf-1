module Golf
  class Rack
    
    def initialize(app = nil)
      @app = app if app
      @compiler = Golf::Compiler.new
    end

    def call(env)
      if env["REQUEST_METHOD"] == "GET" and env["PATH_INFO"] == "/components.js"
        result = @compiler.generate_componentsjs
        ['200', { 'Content-Type' => 'application/javascript', 'Content-Length' => result.length.to_s}, [result]]
      else
        @app.call(env) if @app
      end
    end
  end
end

