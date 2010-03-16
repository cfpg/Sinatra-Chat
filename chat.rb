require 'rubygems'
require 'sinatra'
require 'json'
gem 'mongo', '= 0.18.3'
require 'mongo_mapper'

MongoMapper.connection = Mongo::Connection.new('localhost')
MongoMapper.database = 'chat'	

class Message
	include MongoMapper::Document
	
	key :username, String, :required => true
	key :text, String, :required => true
	key :time, Integer
	key :room, String, :required => true
end

class Online
	include MongoMapper::Document
	
	key :username, String, :required => true
	key :room, String, :required => true
	key :time, Integer, :required => true
	
	before_save :delete_old_entries
	
	private
	def delete_old_entries
		time = Time.new.to_i
		limit = 15 # Seconds
		online = Online.delete_all(:room => room, :time => {"$lt" => time-limit})
	end
end

class Chat
	def add_online(room, username)
		# Add/update new online user
		person = Online.first(:room => room, :username => username)
		if person.to_s.empty?
			online = Online.create({
				:username => username,
				:room => room,
				:time => Time.new.to_i
			})
			online.save
		else
			person.time = Time.new.to_i
			person.save
		end
	end

	def count_online(room)
		people = Online.count({:room => room})
		return people
	end
	
	def list_online(room)
		people = Online.all({:room => room, :order => "username asc"})
		return people.to_json
	end
end

post '/:room/login/?' do
	expire_date = Time.now + (86400*7)
	cookie = request.cookies["enable_chat"]
	if !cookie || cookie == "false"
		set_cookie("enable_chat", {:value => "true", :expires => expire_date})
	end
	
	username = params[:username]
	username = "admin" if username == "adminazo"
	if request.cookies["username"] != "" && username
		set_cookie("username", {:value => username, :expires => expire_date})
	end
	
	redirect '/'+params[:room]
end

get '/:room/logout/?' do
	delete_cookie("enable_chat")
	delete_cookie("username")
	redirect '/'+params[:room]
end

get '/:room?' do	
	locals = Hash.new
	locals['room'] = params[:room]
	if locals['room'].to_s.empty?
		locals['room'] = "default" # Default room
	end
	
	username_cookie = request.cookies["username"] || "no_user_logged_in"
	if username_cookie != "no_user_logged_in"
		locals['username'] = username_cookie
	elsif params[:username]
		locals['username'] = params[:username]
	elsif locals['username'].to_s.empty?
		locals['username'] = "invitado_"+rand(99999).to_s
	end
	
	# Chat enabled?
	cookie = request.cookies["enable_chat"]
	if !cookie || cookie == "false"
		if !params[:skip_login]
			return erb :splash, :locals => locals	
		end
	end
	
	# If user logged in, main chat
	chat = Chat.new
	chat.add_online(locals['room'], locals['username'])
	locals['online'] = chat.count_online("s2").to_i
	
  	erb :index, :locals => locals
end

post '/*/messages/get_*' do
	room = params[:splat][0]
	limit = params[:splat][1]
	chat = Chat.new
	messages = Message.all(:room => room, :order => "time desc", :limit => limit).to_a
	
	result = Hash.new
	result['online'] = chat.count_online(room)
	result['messages'] = messages.reverse!
	result.to_json
end

post '/:room/messages/new' do
	message = Message.create({
		:text => params[:message],
		:username => params[:username],
		:time => Time.new.to_i,
		:room => params[:room]
	})
	message.save
	message.to_json
end

post '/:room/messages/:time' do
	room = params[:room]
	last_time = params[:time]
	
	# Add to online users
	chat = Chat.new
	chat.add_online(room, params[:username])
	
	result = Hash.new
	result_a = Array.new
	result['online'] = chat.count_online(room)
	messages = Message.all(:room => room, :order => "time desc")
	messages.each do |m|
		break if m.time == last_time.to_i
		result_a.push(m)
	end
	result['messages'] = result_a
	result.to_json
end

get '/:room/online_users/?' do
	chat = Chat.new
	chat.list_online(params[:room])
end