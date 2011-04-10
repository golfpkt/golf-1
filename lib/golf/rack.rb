module Golf
  class Rack
    
    def initialize(app = nil)
      @app = app if app
    end

    def call(env)
      #compile it before we pass it to static
      #Golf::Compiler.compile!(env)
      ['200', { 'Content-Type' => 'application/javascript', 'Content-Length' => '5'}, ['asasd']]
      #@app.call(env) if @app
    end
    
  end
end

