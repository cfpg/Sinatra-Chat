ssh_servers = {"root@204.232.194.90" => "/home/chat"} # Hash: server => directory
remote_root = "/home/chat" # for rsync deployment

desc "Start/Restart/Stop Thin server locally"
namespace :thin do
	task :start do
		puts "*** Starting Thin server and Sinatra **"
		system("thin -C #{remote_root}/config.yml -R #{remote_root}/config.ru start")
	end
	
	task :restart do
		puts "*** Restarting Thin ***"
		system("thin -C #{remote_root}/config.yml restart")
	end
	
	task :stop do
		puts "*** Stopping Thin ***"
		system("thin -C #{remote_root}/config.yml stop")
	end
end

desc "Deploys the application to each server using rsync"
task :deploy do
	ssh_servers.each do |ssh|
  	puts "*** Deploying to: #{ssh[0]} ***"
		system("rsync -avz --delete --exclude 'tmp' --exclude 'log' . #{ssh[0]}:#{ssh[1]}")
		puts "*** Restarting Thin Server on #{ssh[0]} **"
		system("ssh #{ssh[0]} 'rake -f #{ssh[1]}/rakefile.rb thin:restart'")
	end
end