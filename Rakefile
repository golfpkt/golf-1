require 'bundler'
require 'rake/testtask'
require 'convore-simple'

Bundler::GemHelper.install_tasks

task :default => [:test]

Rake::TestTask.new("test") do |t|
  t.test_files = FileList['test/test*.rb']
  t.libs << "test/"
  t.verbose = false
end

task 'push' do
  myversion = `gem build golf.gemspec |awk '$1 ~ / *File:/ {printf($2)}'`
  puts `gem push #{myversion}`
  ConvoreSimple::Topic.say(myversion)
end
