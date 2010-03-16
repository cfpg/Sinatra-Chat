// # Functions # //
function isArray(obj) {
   if (obj.constructor.toString().indexOf("Array") == -1)
      return false;
   else
      return true;
}
function htmlspecialchars (string, quote_style, charset, double_encode) {
    // Convert special characters to HTML entities  
    // 
    // version: 912.1315
    // discuss at: http://phpjs.org/functions/htmlspecialchars
    // +   original by: Mirek Slugen
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Nathan
    // +   bugfixed by: Arno
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Ratheous
    // +      input by: Mailfaker (http://www.weedem.fr/)
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +      input by: felix
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: charset argument not supported
    // *     example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
    // *     returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
    // *     example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
    // *     returns 2: 'ab"c&#039;d'
    // *     example 3: htmlspecialchars("my "&entity;" is still here", null, null, false);
    // *     returns 3: 'my &quot;&entity;&quot; is still here'
    var optTemp = 0, i = 0, noquotes= false;
    if (typeof quote_style === 'undefined' || quote_style === null) {
        quote_style = 2;
    }
    string = string.toString();
    if (double_encode !== false) { // Put this first to avoid double-encoding
        string = string.replace(/&/g, '&amp;');
    }
    string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
 
    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE' : 1,
        'ENT_HTML_QUOTE_DOUBLE' : 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE' : 4
    };
    if (quote_style === 0) {
        noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
        quote_style = [].concat(quote_style);
        for (i=0; i < quote_style.length; i++) {
            // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
            if (OPTS[quote_style[i]] === 0) {
                noquotes = true;
            }
            else if (OPTS[quote_style[i]]) {
                optTemp = optTemp | OPTS[quote_style[i]];
            }
        }
        quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
        string = string.replace(/'/g, '&#039;');
    }
    if (!noquotes) {
        string = string.replace(/"/g, '&quot;');
    }
 
    return string;
}
function scrollBottom() {
	height = $("#messages").height();
	$("html,body").animate({scrollTop: height}, 500);
}
function stylize() {
	$("#info").css({
		width: $(document).width()-10
	});
}

$(document).ready(function(){
	// Stylize the chat
	stylize();
	
	$("#form form").live("submit", function() {
		This = $(this);
		Chat.toggleLoading("show");
		Message = $("#message");
		Message_value = Message.val();
		Message.val(""); // Clear Text
		
		if (Message_value == "") return;
		$.ajax({
			type: 'POST',
			data: "message="+Message_value+"&username="+Chat.username,
			url: This.attr("action"),
			success: function(data) {
				if (data.id !== null) {
					$("#message").select(); // Select field
					Chat.createMessage($.parseJSON(data)); // Add message
				} else {
					alert("Error");
					Message.val(Message_value);
				}
				Chat.toggleLoading("hide");
			},
			datatype: "json"
		});
		return false;
	});
	
	$("#online a").live("click", function() {
		// Show online users list
		Chat.pause = true // Pause the chat
		This = $("#online a");
		Messages = $("#messages");
		
		User_list = $("#user_list");
		User_list_ul = $("#user_list ul");
		// If user_list is visible, hide it
		if (User_list.is(':visible')) {
			User_list.slideUp(500);
			Messages.slideDown(500);
			This.removeClass("close");
			Chat.pause = false;
			Chat.update(); // Start the chat again
			User_list_ul.html('<li><b>Usuarios en linea:</b></li>'); // Reset the user list content
			return;
		} else {
			User_list.slideDown(500);
			Messages.slideUp(350);
		}
		
		This.addClass("close");
		This.html("Volver al <b>Chat</b>");
		Chat.toggleLoading("show");
		
		$.getJSON("/"+Chat.room+"/online_users", function(data) {
			while (data.length > 0) {
				row = data.shift();
				User_list_ul.append('<li>'+row.username+'</li>');
				Chat.toggleLoading("hide");
			}
		});
		
		return false;
	});
	
	Chat.update();
});

Chat = {
	timer: 500,
	sleepTimer: 500,
	cursor: null,
	pause: false,
	room: "default",
	update: function() {
		url = '/'+Chat.room+'/messages/'+Chat.cursor;
		if (Chat.cursor == null) {
			url = '/'+Chat.room+'/messages/get_10';
		}
		$.ajax({
			type: 'POST',
			data: "username="+Chat.username,
			url: url,
			success: Chat.onSuccess,
			error: Chat.onError,
			datatype: 'json'
		});
	},
	onSuccess: function(data) {
		data = $.parseJSON(data);
		Chat.addMessage(data.messages);
		Chat.updateOnline(data.online);
		if (!Chat.pause) {
			window.setTimeout(Chat.update, Chat.timer);
		}
	},
	onError: function() {
		Chat.sleepTimer = Chat.sleepTimer * 2;
		if (!Chat.pause) {
			window.setTimeout(Chat.update, Chat.sleepTimer);
		}
	},
	addMessage: function(data) {
		if (data === null) return;
		if (isArray(data)) {
			while (data.length > 0) {
				new_data = data.shift();
				Chat.createMessage(new_data);
			}
		} else {
			Chat.createMessage(data);
		}
		stylize();
	},
	createMessage: function(data) {
		if ($('#msg_'+data.id).length > 0) return;
		layout = $('<li id="msg_'+data.id+'"><b>'+data.username+':</b> '+htmlspecialchars(data.text)+'</li>');
		layout.hide();
		$("#messages ul").append(layout);
		layout.slideDown();
		Chat.cursor = data.time; // Set cursor to last message time
		scrollBottom();
	},
	updateOnline: function(online) {
		if (online > 1) {
			str = online+" Personas online"
		} else {
			str = online+" Persona online"
		}
		$("#online a:not('.close')").html(str);
	},
	toggleLoading: function(to) {
		Loading = $("#loading");
		if (to == "show") {
			Loading.show();
		} else {
			Loading.hide();
		}
	}
}