$(document).ready(function() {

/* ==========================================================================
 	stuff that needs to run asap
	========================================================================== */

	/* =========== matches hint bar to search bar ===========  */

	$('#game_hint').css("height", $('#game_search').outerHeight());
	$('#game_hint').css("width", $('#game_search').outerWidth());
	$('#games').removeClass('notvisible');
	$('#games').addClass('hidden');

	$('#streamer_hint').css("height", $('#streamer_search').outerHeight());
	$('#streamer_hint').css("width", $('#streamer_search').outerWidth());
	$('#streamerSearch').removeClass('notvisible');
	$('#streamerSearch').addClass('hidden');


/* ==========================================================================

 	options menu

	========================================================================== */

	/* =========== open/close options ===========  */
	
	var oo; /* options open */

	$('#options').on('click', function() {
		oo = $('#options-open');
		if (oo.is(':visible')) {
			oo.addClass('hidden');
		} else {
			oo.removeClass('hidden');
		}
	});
/* =========== labels ===========  */

	/* makes labels pop up when active/vice versa */
	$('options-open').on('focus', '.main-text', function() {
		$(this).find('label').addClass('active');
	});

	$('options-open').on('blur', '.main-text', function() {
		$(this).find('label').removeClass('active');
	});


	/* ==========================================================================
 		add favorite streamers
	========================================================================== */

	var timer;
	var typingTimeout = 1500; /* in milliseconds */
	var usernameVal;
	
	/*** 
	 * 
	 * 
	 * timeout -> pullUserAndFavortes -> processUser ->
	 * getFavoriteStreamers
	 *
	 * 
	 *													***/

	$('#options-twitch-name').on('keyup', function() {
		/* only run if the streams bar is already visible. otherwise, have the general loading function load this afterwards */
		if ( $('#streams').is(':visible') ) {
			clearPreviousFavoriteStreams();
			clearTimeout(timer);
			usernameVal = $(this).val();
			if (usernameVal) {
				timer = setTimeout(pullUserAndFavorites, typingTimeout);
			}
		}
	});
	
	
	/* =========== ajax calls ===========  */
	
	var pullUserAndFavorites = function() {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/users/' + usernameVal,
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			processUser(data);
		});
	};

	var getFavoriteStreamers = function(user) {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/users/' + user['name'] + '/follows/channels?limit=300',
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			$.each(data['follows'], function(i, channel) {
				determineIfStreamOnline(channel);
			});
		});
	};
	
	var determineIfStreamOnline = function(channel) {

		var channelName = channel['channel']['name'];

		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams/'+channelName,
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			if (data['stream'] !== null) {
				assignPlace(data['stream']);
			}
		});
	};

	/* =========== helper functions ===========  */

	/* pullUserAndFavorites */
	var validateUser = function(user) {
		return (user['error'] == 'Not Found');
	};

	var processUser = function(user) {
		(validateUser(user)) ? $.noop() : getFavoriteStreamers(user);
	};
	
	/* =========== view functions ===========  */

	var clearPreviousFavoriteStreams = function() {
		$('.favorited').each(function(i, stream) {
			stream.remove();
		});
	};


	var assignPlace = function(streamObject) { 
		/* sorts incoming streams by viewercount */
		var view = streamView(streamObject, true, globalFilter);
 		var currentViewers = streamObject['viewers'];
		var streamContainer = $('#streams').find('ul');
		var thisStreamViewers;
		var inserted = false;
		var hasFavorites;
		var last;

		hasFavorites = ($('.favorited').length > 0 ? true : false);
		$(view).imagesLoaded(function() {
			$(view).removeClass('hidden');
		});

		if (hasFavorites) {
			$('.favorited').each(function(i, stream) {
				thisStreamViewers = $(stream).find('.viewercount').text();

				if (!inserted) {
					if (currentViewers > thisStreamViewers) {
						$(stream).before(view);
						inserted = true;
					}
				}
			});

			/* only happens if the stream has the lowest number of viewers out of all .favorited streams */
			if (!inserted) { 
				last = $('.favorited').last();
				last.after(view);
			}

		} else {
			streamContainer.prepend(view);
		}
	};

	/* ==========================================================================
 		disable chat
	========================================================================== */
	
	var disableChat = false;

	$('#options-chat-box').on('click', function() {
		var streamIframe = $('#streamPlayer').find('iframe');
		var containterWidth = $('.stream-container').width();

		if (this.checked) {
			$('#streamChat').addClass('hidden');
			streamIframe.attr('width', containterWidth);
			disableChat = true;
		} else {
			$('#streamChat').removeClass('hidden');
			var newWidth = containterWidth*.79 - 10; /* margin between chat and strean */
			streamIframe.attr('width', newWidth);
			disableChat = false;
		}
	});


/* ==========================================================================

 	search bars
 	
	========================================================================== */


	/* =========== labels ===========  */

	/* makes labels pop up when active/vice versa */
	$('.main-text').on('focus', function() {
   		$(this)
   		.parent()
   		.parent()
   		.find('label')
   		.addClass('active');
   	});

   	$('.main-text').on('blur', function() {
   		if ($(this).val() == '') {
   			$(this).parent().parent().find('label').removeClass('active');
   		}
   	});

	/* =========== game search ===========  */

	/* removes any hints in the search box on focus/blur*/
	$('#game_search').on('focus', function() {
   		$('#game_hint').val('');
   	});

	$('#game_search').on('blur', function() {
   		$('#game_hint').val('');
   	});


/* ==========================================================================
 	filtering
	========================================================================== */

	var globalFilter = {
		active: false,
		game: null,
		streamer: null,
		activeOn: null,
		
		clear: function() {
			this.active = false;
			this.game = null;
			this.streamer = null;
			this.activeOn = null;
		}
	};	
	
	var getMoreOfGame = function(game) {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/search/streams?q=' + game +'&limit=100',
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			showStreams(data, globalFilter);
		});
	};

	var clearFilter = function() {
		
		$('.streamer').each(function() { 
			$(this).removeClass('hidden');
		});
		
		globalFilter.clear();
	};

	var updateFilter = function(filteredItem, dataType) {

		$('.streamer').each(function() { 
			
			/* filter for game UNLESS filteredItem is empty (means there's no game being searched for) */
			
			if ($(this).attr(dataType) != filteredItem && filteredItem != '') { 
				$(this).addClass('hidden');
			} else {
				$(this).removeClass('hidden');
			}
		});
	};

	var detectSelection = function(parent) {

		var defaultSelection;
		var overrideSelection;
		var currentSelection;

		defaultSelection = $(parent)
							.find('.xdsoft_autocomplete_dropdown')
							.children()
							.first()
							.attr('data-value');

		overrideSelection = $(parent)
							.find('.xdsoft_autocomplete_dropdown')
							.find('.active')
							.attr('data-value');

		currentSelection = (typeof overrideSelection === 'undefined' ? 
							defaultSelection : overrideSelection);

		return currentSelection;

	};
	
	var lastGame;

	var applyFilter = function(parent, inputBox, dataType) {

		var currentGame;

		if ($(parent).val() != '') {
			currentGame = detectSelection(inputBox);
			currentGame = decodeURIComponent(currentGame);
			updateFilter(currentGame, dataType);
			if (lastGame != currentGame) {
				getMoreOfGame(currentGame);
			}
			globalFilter.active = true;
			globalFilter.game = currentGame;
			globalFilter.activeOn = 'game';
			lastGame = currentGame;
		} else {
			clearFilter();
		}
	};

	/* =========== application of filter ===========  */

	/* todo: on click part of this doesn't work well. need a better way after
	   to search after value changes */

	/* games */
	$('#game_search').on('keyup', function() {
		applyFilter($(this), $('#games'), 'data-game');
	});

	$('#game_search').on('click', function() {
		applyFilter($(this), $('#games'), 'data-game');
	});


	/* streamer  */
	$('#streamer_search').on('keyup', function() {
		applyFilter($(this), $('#streamerSearch'), 'data-name');
	});

	$('#streamer_search').on('click', function() {
		applyFilter($(this), $('#streamerSearch'), 'data-name');
	});


/* ==========================================================================

 	hoverscroll

	========================================================================== */

   	var interval;
   	var position;

   	$('#streams-left').on('mouseover', function() {
   		var streams = $('#streams');

   		interval = setInterval(function() {
   			position = streams.scrollLeft();
   			streams.scrollLeft(position - 2.5);
   		}, 5);
   	}).on('mouseout', function() {
   		clearInterval(interval);
   	});

   	$('#streams-right').on('mouseover', function() {
   		var streams = $('#streams');

   		interval = setInterval(function() {
   			position = streams.scrollLeft();
   			streams.scrollLeft(position + 2.5);
   		}, 5);
   	}).on('mouseout', function() {
   		clearInterval(interval);
   	});


/* ==========================================================================

   load stream

   ========================================================================== */

    var streamHeight = $(window).height()*.75;
    var streamWidth = $(window).width()*.73;
    var chatWidth = $(window).width()*.196;
    var streamContainterWidth;
    var id;
	var viewerRefresh;
	var streamPreFill;
	var chatPreFill;
	
	/* functions to reset nav */
	
	var hideNav = function() {
		$('#streams').find('ul').empty();
		$('#streams').hide();
	};
	
	var clearSB = function() {
		$('#games').find('label').removeClass('active');
		$('#streamerSearch').find('label').removeClass('active');
		$('#game_search').val('');
		$('#streamer_search').val('');
		$('.xdsoft_autocomplete_hint').val('');
	};
	
	var hideSB = function() {
		$('#games').addClass('hidden');
		$('#streamerSearch').addClass('hidden');
	};
	
	var reattachNavButtons = function() {
		$('#buttons').addClass('attach-right');
	};
	
	var resetNav = function() {
		clearSB();
		hideSB();
		hideNav();
		reattachNavButtons();
		$('#buttons').addClass('attach-right');
		$('#options-open').addClass('hidden');
	};

	/* =========== streamer clicked on ===========  */

	$(document).on('click', '.streamer', function() {
		id = $(this).attr('data-name');
		populateStream(id);
		resetNav();
	});

	var populateStream = function(id) {
		emptyPage();
		$.ajax({
			url: 'https://api.twitch.tv/kraken/channels/' + id,
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			updatePageForStreamer(data);
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
	};

	var updatePageForStreamer = function(streamer) {
		
		/*    show containters   */
		$('.stream-container').removeClass('hidden');
		$('.info-container').removeClass('hidden');

		/* 	  set widths and heights for stream/chat    */

		streamContainterWidth = $('.stream-container').width();
		streamHeight = $(window).height()*.75;
		streamWidth = streamContainterWidth*.79 - 7; /*margin between chat and stream */
		chatWidth = streamContainterWidth*.20;
		
		if (disableChat) {
			streamWidth = streamContainterWidth;
		}
		
		/* twitch prebaked stuff */
		chatPreFill = '<iframe frameborder="0" scrolling="no" id="chat_embed" src="http://twitch.tv/chat/embed?channel='+id+'&amp;popout_chat=true" height="'+streamHeight+'" width="'+chatWidth+'"></iframe>';
		streamPreFill = '<iframe height="'+streamHeight+'" width="'+streamWidth+'" frameborder="0" scrolling="no" src="http://www.twitch.tv/'+id+'/embed"></iframe>';

		/*    populate all fields   */
		$('#streamerName').append(streamer['display_name']);
		$('#title').append(streamer['status']);
		$('#streamPlayer').append(streamPreFill);
		$('#streamChat').append(chatPreFill);
		(disableChat) ? $('#streamChat').addClass('hidden') : $.noop;
		$('#viewsCount').find('span').append(streamer['views']);
		$('#followerCount').find('span').append(streamer['followers']);

		/*    show misc stream info   */
		$('#viewerCount').find('i').removeClass('hidden');
		$('#viewsCount').find('i').removeClass('hidden');
		$('#followerCount').find('i').removeClass('hidden');

		/*    update misc info   */
		updateViewerCount();
		viewerRefresh = setInterval(function() {
			updateViewerCount();
		}, 18000);
	};

	var updateViewerCount = function() {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams/' + id,
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			updatePageWithViewers(data);
		});
	};

	var updatePageWithViewers = function(stream) {
		$('#viewerCount').find('span').empty();
		$('#viewerCount').find('span').append(stream['stream']['viewers']);
	};

	var emptyPage = function() {
		$('#streamerName').empty();
		$('#title').empty();
		$('#streamPlayer').empty();
		$('#streamChat').empty();
		$('#viewerCount').find('span').empty();
		$('#viewsCount').find('span').empty();
		$('#followerCount').find('span').empty();
		clearInterval(viewerRefresh);
	};


/* ==========================================================================
 	populate streamers
	========================================================================== */

	/* =========== stream view ===========  */

	/* todo: this needs to be made more robust */
	
	var determineIfFiltered = function(stream, filter) {
		
		var gameToFilter = stream['game'];
		var nameToFilter = stream['channel']['name'];
		
		if (globalFilter.active) {
			if (globalFilter.activeOn == 'game') {
				return (globalFilter.game === gameToFilter) ? '' : 'hidden';
			} else if (globalFilter.activeOn == 'streamer') {
				return (globalFilter.streamer === nameToFilter) ? '' : 'hidden';
			}
		} else {
			return 'hidden';
		}
	};
	
	var streamView = function(stream, favorited, filter) { 

		var isFavorited = (favorited) ? "favorited" : "";
		var options = determineIfFiltered(stream, filter);
		
		var preview_height = 125;
		var aspect_ratio = 1.777; /* twitch's aspect ratio for preview pictures */  
		var preview_image = templateReplace(stream['preview']['template'], preview_height, aspect_ratio);

		var name = '<div class="name">' + stream['channel']['display_name'] + '</div>';
		var status = '<div class="status">' + stream['channel']['status'] + '</div>';
		var viewerbar = '<div class="viewerbar"><i class="fa fa-user"><span class="viewercount">'+ stream['viewers'] +'</span></i></div>';
		var preview = '<div class="preview"><img src=' + preview_image +'></img>'+viewerbar+'</div>';
		var game = '<div class="game">' + stream['game'] + '</div>';

		var view = '<li class="streamer '+options+' '+isFavorited+'" data-name="' + stream['channel']['name'] + '" data-display="'+ stream['channel']['display_name'] + '" data-game="' + stream["game"] +'" class="stream">' + name + status + preview + game + '</li>';

		$(view).imagesLoaded(function () {
			$(view).removeClass('hidden');
		});

		return view;
	};

	var templateReplace = function(template, height, aspect_ratio) {
		template = template.replace('{height}', height);
		template = template.replace('{width}', Math.floor(height*aspect_ratio)); 
		return template;
	};

	/* =========== stream bar open ===========  */

	$('#search').on('click', function() {
		var streams = $('#streams');
		if (streams.is(':visible')) {
			resetNav();
		} else {
			getStreams();
			getGames();
			$('#streams-left').addClass('fixed');
			$('#streams-right').addClass('fixed');
			$('#games').removeClass('hidden');
			$('#streamerSearch').removeClass('hidden');
			$('#buttons').removeClass('attach-right');
			streams.show();
		}
	});
	
	/* =========== populate popular streams ===========  */
	
	var streamerAutoFill;
	var view;
	var autofill;

	var getStreams = function() {

		addLoadingIcon();

		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams?limit=100',
			type: 'GET',
			crossDomain: true,
			dataType: 'jsonp',
		})
		.done(function(data) {
			streamerAutoFill = streamerNameFill(data);
			$('#streamer_search').autocomplete({
				source: [streamerAutoFill],
				highlight: true,
				autoselect: true,
				limit: 3,
				visibleLimit: 3
			});
			loadAllStreams(data);
			if (usernameVal) {
				pullUserAndFavorites();
			}
			removeLoadingIcon();
		})
		.fail(function(data) {
			console.log(data);
		});
	};

	var streamerNameFill = function(streams) {
		var autofill = [];

		$.each(streams['streams'], function(i, stream) {
			autofill.push(stream['channel']['name']);
		});

		return autofill;
	};

	// loading bar and misc stuff
	

	var loadAllStreams = function(streams) {
		$('#loading').fadeOut(200, function() {
			showStreams(streams, globalFilter);
			$('.streamer').each(function(i, stream) {
				$(stream).imagesLoaded(function() {
					$(stream).removeClass('hidden');
				});
			});
		});
	};

	var addLoadingIcon = function() {
		$('#streams').append('<div id="loading"></div>');
		$('#loading').append('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-inverse"></i><br>');
		$('#loading').append('<span>Loading..</span>');
	};

	var removeLoadingIcon = function() {
		$('#loading').remove();
	};

	var showStreams = function(streams, filter) {
		$.each(streams['streams'], function(i, stream) {
			var streamerName = stream['channel']['name'];
			var dataName = '[data-name="'+streamerName+'"]';
			var streamFilter = $('.streamer').filter(dataName);
			if (streamFilter.length === 0) {
				view = streamView(stream, false, filter);
				$('#streams').find('ul').append(view);
				$('#streams').last().imagesLoaded(function() {
					if (!$(stream).is(':visible')) {
						$(stream).removeClass('hidden');
					}
				});
			}
		});
	};

	// end loading stuff

/* ==========================================================================
 	populate games and game input autofill/filter
	========================================================================== */

	/* =========== games and game bar autofill ===========  */

	var getGames = function() {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/games/top?limit=100',
			type: 'GET',
			crossDomain: true,
			dataType: 'jsonp',
		})
		.done(function(data) {
			autofill =  fillAutofill(data);
			$('#game_search').autocomplete({
				source: [autofill],
				highlight: true,
				autoselect: true,
				limit: 3,
				visibleLimit: 3
			});
		})
		.fail(function(data) {
			console.log(data);
		});
	};

	var fillAutofill = function(games) {
		var autofill = [];

		$.each(games['top'], function(i, game) {
			autofill.push(game['game']['name']);
		});

		return autofill;
	};

	/* ==========================================================================
 	pre query
	========================================================================== */

	getGames();

});