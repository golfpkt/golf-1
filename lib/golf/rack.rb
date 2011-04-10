module Golf
  class Rack
    
    def initialize(app = nil)
      @app = app if app
    end

    def call(env)
      if env["REQUEST_METHOD"] == "GET" and env["PATH_INFO"] == "/component.js"
        ['200', { 'Content-Type' => 'application/javascript', 'Content-Length' => '5'}, ['asasd']]
      else
        @app.call(env) if @app
      end
    end
  end
end

