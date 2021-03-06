/*
 * The Twitter request code is based on the jquery tweet extension by http://tweet.seaofclouds.com/
 *
 * */
var LAST_UPDATE;
var MSG_ID;
var PAGE = 1;

//Reverse collection
jQuery.fn.reverse = function() {
  return this.pushStack(this.get().reverse(), arguments);
}; 


(function($) {
 $.fn.gettweets = function(){
  return this.each(function(){
     var list = $('ul.tweet_list').prependTo(this);
     var url = 'http://twitter.com/statuses/friends_timeline.json?page=' + PAGE + getSinceParameter();
     
     $.getJSON(url, function(data){
       $.each(data.reverse(), function(i, item) { 
        if($("#msg-" + item.id).length == 0) { // <- fix for twitter caching which sometimes have problems with the "since" parameter
          if (item.in_reply_to_status_id == null) {
            inReplyText = '';
            }
          else {
            inReplyText = ' in reply to <a href="http://twitter.com/' + item.in_reply_to_screen_name + '/status/' + item.in_reply_to_status_id + '">' + item.in_reply_to_screen_name + '</a>';
          }
          list.prepend('<li id="msg-' + item.id + '">' +
          '<a href="http://twitter.com/account/profile_image/' +
          item.user.screen_name +
          '"><img class="profile_image" height="48" width="48" src="' + 
          item.user.profile_image_url +
          '" alt="' + item.user.name + '" /></a>' +
          '<span class="time" title="' + item.created_at + '">' +
            relative_time(item.created_at) + '</span> '+
          '<a class="user" href="http://twitter.com/' + 
            item.user.screen_name + '">' +
          item.user.screen_name + '</a> ' +
          '<a class="retweet" title="Retweet" ' +
            'href="javascript:retweet(' + item.id + ')">&#9850;</a>' +
          '<a class="favorite" title="Toggle favorite status" '+
            'href="javascript:toggleFavorite(' + 
            item.id + ')">&#10029;</a>' +
          '<a class="reply" title="Reply to this" ' +
            'href="javascript:replyTo(\'' +
            item.user.screen_name + '\',' + item.id +
            ')">@</a>' +
          '<div class="tweet_text">' +
          item.text.replace(/((https?|ftp):\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+)/g, '<a href="$1">$1</a>').replace(/[\@]+([A-Za-z0-9-_]+)/g, '<a href="http://twitter.com/$1">@$1</a>') +
          '<span class="info">' + inReplyText + ' via ' + item.source + '</span>' +
           '</div></li>');

          // Change the class if it's a favorite.
          if (item.favorited) {
            $('#msg-' + item.id + ' a.favorite').css('color', 'red');
          }
          
          // Hide the Newer link if we're on the first page.
          if (PAGE == 1) {
            $("#newer").css("visibility", "hidden");
          }
          else {
            $("#newer").css("visibility", "visible");
          }
          
          // The Older link is always visible after the tweets are shown.
          $("#older").css("visibility", "visible");
            
          // Don't want Growl notifications? Comment out the following method call
          fluid.showGrowlNotification({
            title: item.user.name + " @" + item.user.screen_name,
            description: item.text,
            priority: 2,
            icon: item.user.profile_image_url
          });

          }  // if
         }); // each
       }); // getJSON
     }); // this.each
 };  // gettweets
})(jQuery);


function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);
  if (delta < 60) {
    return 'less than a minute ago';
  } else if(delta < 120) {
    return 'a minute ago';
  } else if(delta < (45*60)) {
    return (parseInt(delta / 60)).toString() + ' minutes ago';
  } else if(delta < (75*60)) {
    return 'an hour ago';
  } else if(delta < (120*60)) {
    return 'over an hour ago';
  } else if(delta < (24*60*60)) {
    return '' + (parseInt(delta / 3600)).toString() + ' hours ago';
  } else if(delta < (48*60*60)) {
    return '1 day ago';
  } else {
    return (parseInt(delta / 86400)).toString() + ' days ago';
  }
};


//get all span.time and recalc from title attribute
function recalcTime() {
  $('span.time').each( 
      function() {
        $(this).text(relative_time($(this).attr("title")));
      }
  )
}


function getSinceParameter() {
  if(LAST_UPDATE == null) {
    return "";
  } else {
    return "&since=" + LAST_UPDATE;
  }
}

function showAlert(message) {
  $("#alert p").text(message);
  $("#alert").fadeIn("fast");
  return;
}


function refreshMessages() {
  showAlert("Getting new tweets...");
  $(".tweets").gettweets();
  LAST_UPDATE = new Date().toGMTString(); 
  $("#alert").fadeOut(2000);
  return;
}

function replyTo(screen_name, msg_id) {
  MSG_ID = msg_id;
  start = '@' + screen_name + ' ';
  $("#status").val(start);
  $("#status").focus();
  $("#status").caret(start.length, start.length);
  charCountdown();
}

function toggleFavorite(msg_id) {
  $.getJSON("http://twitter.com/statuses/show/" + msg_id + ".json", 
    function(data){
      if (data.favorited) {
        $.post('http://twitter.com/favorites/destroy/' + msg_id + '.json', {id:msg_id});
        $('#msg-' + msg_id + ' a.favorite').css('color', 'black');
      }
      else {
        $.post('http://twitter.com/favorites/create/' + msg_id + '.json', {id:msg_id});
        $('#msg-' + msg_id + ' a.favorite').css('color', 'red');
      }
    }
  );
}

function retweet(msg_id) {
  $.getJSON("http://twitter.com/statuses/show/" + msg_id + ".json", 
    function(data){
      start = 'RT @' + data.user.screen_name + ': ' + data.text;
      $("#status").val(start);
      $("#status").focus();
      $("#status").caret(start.length, start.length);
      charCountdown();
    }
  );
}

function olderPage() {
  PAGE = PAGE + 1;
  LAST_UPDATE = null;
  // Hide the paging links before removing the messages. They're made
  // visible again by gettweets().
  $("#older").css('visibility','hidden');
  $("#newer").css('visibility','hidden');
  $("ul.tweet_list li[id^=msg]").remove();
  refreshMessages();
}

function newerPage() {
  if (PAGE > 1) {
    PAGE = PAGE - 1;
    LAST_UPDATE = null;
    // Hide the paging links before removing the messages. They're made
    // visible again by gettweets().
    $("#older").css('visibility','hidden');
    $("#newer").css('visibility','hidden');
    $("ul.tweet_list li[id^=msg]").remove();
    refreshMessages();
  }
}

function setStatus(status_text) {
  if (status_text[0] == "@" && MSG_ID) {
    $.post("http://twitter.com/statuses/update.json", { status: status_text, source: "twoot", in_reply_to_status_id: MSG_ID }, function(data) { refreshStatusField(); }, "json" );
    MSG_ID = '';
  }
  else {
    $.post("http://twitter.com/statuses/update.json", { status: status_text, source: "twoot" }, function(data) { refreshStatusField(); }, "json" );
  }
  return;
}

function refreshStatusField() {
  //maybe show some text below field with last message sent?
  refreshMessages();
  $("#status").val("");
  $('html').animate({scrollTop:0}, 'fast'); 
  // added by Dr. Drang to reset char count
  $("#count").removeClass("warning");
  $("#count").addClass("normal");
  $("#count").html("140");
  return;
}

// Count down the number of characters left in the tweet.  Change the
// style to warn the user when there are only 20 characters left. Show
// "Twoosh!" when the tweet is exactly 140 characters long.
function charCountdown() {
  charsLeft = 140 - $("#status").val().length;
  if (charsLeft <= 20) {
    $("#count").removeClass("normal");
    $("#count").addClass("warning");
  }
  else {
    $("#count").removeClass("warning");
    $("#count").addClass("normal");
  }
  if (charsLeft == 0) {
    $("#count").html("Twoosh!");
  }
  else {
    $("#count").html(String(charsLeft));
  }
}

// set up basic stuff for first load
$(document).ready(function(){

    //get the user's messages
    refreshMessages();

    //add event capture to form submit
    $("#status_entry").submit(function() {
      setStatus($("#status").val());
      return false;
    });

    //set timer to reload messages every 3 minutes
    window.setInterval("refreshMessages()", 3*60*1000);

    //set timer to recalc timestamps every 60 secs
    window.setInterval("recalcTime()", 60000);

    //Bind r key to request new messages
    $(document).bind('keydown', {combi:'r', disableInInput: true}, refreshMessages);

});


// Reset the bottom margin of the tweet list so the status entry stuff
// doesn't cover the last tweet. This has to be done after the size of
// the #message_entry div is known (load) and whenever the text size is
// changed in the browser (scroll).

function setBottomMargin() {
  $("div.tweets").css("margin-bottom", $("#message_entry").height() + parseInt($("#message_entry").css("border-top-width")));
  $("#message_entry").css("bottom", "0");
}

$(window).load(setBottomMargin);
$(window).scroll(setBottomMargin);
