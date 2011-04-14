module Golf
  module Filter
  end
end

Dir["#{File.expand_path('../../../lib/golf/filters', __FILE__)}/*.rb"].each do |path|
  puts "golf #{Golf::VERSION}: loading filter #{path}"
  require path
end

