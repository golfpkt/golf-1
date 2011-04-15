require 'bundler'
require 'rake/testtask'

Bundler::GemHelper.install_tasks

task :default => [:test]

Rake::TestTask.new("test") do |t|
  t.test_files = FileList['test/test*.rb']
  t.libs << "test/"
  t.verbose = false
end

task 'push' do
  puts `gem build golf.gemspec |awk '$1 ~ / *File:/ {print $2}' |xargs gem push &&  gem build golf.gemspec |awk '$1 ~ / *File:/ {printf($2)}' | curl -u $(git config user.convore) -F message="<-" https://convore.com/api/topics/19590/messages/create.json`
end
