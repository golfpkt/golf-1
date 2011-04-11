class DemoBackend < Sinatra::Application

  get '/random-api-method' do
    rand(52430234).to_s
  end

end
