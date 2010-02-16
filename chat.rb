require 'rubygems'
require 'sinatra'
require 'json'
require 'mongo'
require 'mongo_mapper'

MongoMapper.connection = Mongo::Connection.new('localhost')
MongoMapper.database = 'chat'

class Message
	include MongoMapper::Document
	
	key :_id, Integer
	key :username, String, :required => true
	key :text, String, :required => true
	key :time, Time
	
	before_create :set_id
	
	private
	def set_id
		if Message.count > 0
			m = Message.last(:order => "time")
			id = m.id
		else
			id = 0
		end
		self._id = id.to_i+1
	end
end

get '/' do
  erb :index
end

get '/messages/get_*' do
	limit = params[:splat][0]
	offset = Message.count-limit.to_i
	Message.all(:order => "time asc", :skip => offset).to_json
end

get '/messages/:id' do
	last_id = params[:id]
	Message.all(:skip => last_id).to_json
end

post '/messages/new' do
	message = Message.create({
		:text => params[:message],
		:username => "admin",
		:time => Time.new
	})
	message.save
	message.to_json
end