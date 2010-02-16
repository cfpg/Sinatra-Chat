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

$(document).ready(function(){
	$("#message").select();
	$("#form form").live("submit", function() {
		This = $(this);
		$.post(This.attr("action"), This.serialize(), function(data) {
			if (data.id !== null) {
				$("#message").val("").select(); // Clear Text
			} else {
				alert("Error");
			}
		}, 'json');
		return false;
	});
	Chat.update();
});

Chat = {
	sleepTimer: 500,
	cursor: null,
	stop: false,
	update: function() {
		url = '/messages/'+Chat.cursor;
		if (Chat.cursor == null) {
			url = '/messages/get_5';
		}
		$.ajax({ url: url, success: Chat.onSuccess, error: Chat.onError, datatype: 'json' });
	},
	onSuccess: function(data) {
		Chat.addMessage(eval(data));
		if (!Chat.stop) window.setTimeout(Chat.update, 500);
	},
	onError: function() {
		Chat.sleepTimer = Chat.sleepTimer * 2;
		if (!Chat.stop) window.setTimeout(Chat.update, Chat.sleepTimer);
	},
	addMessage: function(data) {
		if (data === null) return;
		if (isArray(data)) {
			while (data.length > 0) {
				Chat.createMessage(data.shift());
			}
		} else {
			Chat.createMessage(data);
		}
	},
	createMessage: function(data) {
		layout = '<li id="msg_'+data.id+'"><b>'+data.username+':</b> '+htmlspecialchars(data.text)+'</li>';
		$("#messages ul").append(layout);
		Chat.cursor = data.id; // Set cursor to last message id
	}
}