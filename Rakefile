require 'bundler'
require 'rake/testtask'

Bundler::GemHelper.install_tasks

task :default => [:test]

Rake::TestTask.new("test") do |t|
  t.test_files = FileList['test/test*.rb']
  t.libs << "test/"
  t.verbose = false
end
