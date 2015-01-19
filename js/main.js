$(document).ready(function() {

/* ==========================================================================
 	search bars
	========================================================================== */

	/* =========== general search bar ===========  */


   	$('.main-text').on('focus', function() {
   		$(this).parent().parent().find('label').addClass('active')

   	})

   	$('.main-text').on('blur', function() {
   		if ($(this).val() == '') {
   			$(this).parent().parent().find('label').removeClass('active')
   		}
   	})

	/* =========== game search ===========  */

	$('#game_search').on('focus', function() {
   		$('#game_hint').val('')
   	})

	$('#game_search').on('blur', function() {
   		$('#game_hint').val('')
   	})


/* ==========================================================================
 	filtering
	========================================================================== */

	/* =========== games ===========  */

	var clearFilter = function() {

		$('.streamer').each(function() { 
			$(this).removeClass('hidden')

		})

	}


	var updateFilter = function(filteredItem, dataType) {

		filteredItem = unescape(filteredItem)

		$('.streamer').each(function() { 
			/* filter for game UNLESS filteredItem is empty (means there's no game being searched for) */
			if ($(this).attr(dataType) != filteredItem && filteredItem != '') { 
				$(this).addClass('hidden')
			} else {
				$(this).removeClass('hidden')
			}
		})

	}

	var detectSelection = function(parent) {

		var defaultSelection
		var overrideSelection
		var currentSelection

		defaultSelection = $(parent)
							.find('.xdsoft_autocomplete_dropdown')
							.children()
							.first()
							.attr('data-value')


		overrideSelection = $(parent)
							.find('.xdsoft_autocomplete_dropdown')
							.find('.active')
							.attr('data-value')

		currentSelection = (typeof overrideSelection === 'undefined' ? defaultSelection : overrideSelection)

		return currentSelection

	}

	$('#game_search').on('keyup', function() {

		if ($(this).val() != '') {

			currentGame = detectSelection('#games');
				
			updateFilter(currentGame, 'data-game');

		} else {

			clearFilter()
		}

	})

	$('#game_search').on('click', function() {

		if ($(this).val() != '') {

			currentGame = detectSelection('#games');
				
			updateFilter(currentGame, 'data-game');

		} else {

			clearFilter()
		}


	})


	/* =========== general ===========  */

	$('#streamer_search').on('keyup', function() {

		if ($(this).val() != '') {

			currentStreamer = detectSelection('#streamerSearch');

			updateFilter(currentStreamer, 'data-name')

		} else {

			clearFilter()
		}

	})

	$('#streamer_search').on('click', function() {

		if ($(this).val() != '') {

			currentStreamer = detectSelection('#streamerSearch');

			updateFilter(currentStreamer, 'data-name')

		} else {

			clearFilter()
		}

	})


/* ==========================================================================
 	hoverscroll
	========================================================================== */

   	var interval

   	$('#streams-left').on('mouseover', function() {
   		var streams = $('#streams');

   		interval = setInterval(function() {
   			position = streams.scrollLeft();
   			streams.scrollLeft(position - 2.5);
   		}, 5);
   	}).on('mouseout', function() {
   		clearInterval(interval)
   	})

   	$('#streams-right').on('mouseover', function() {
   		var streams = $('#streams');

   		interval = setInterval(function() {
   			position = streams.scrollLeft();
   			streams.scrollLeft(position + 2.5);
   		}, 5);
   	}).on('mouseout', function() {
   		clearInterval(interval)
   	})



/* ==========================================================================
   load stream
   ========================================================================== */

    var streamHeight = $(window).height()*.75
    var streamWidth = $(window).width()*.73
    var chatWidth = $(window).width()*.196
    var id
	var viewerRefresh

	//STREAMER CLICKED

	$(document).on('click', '.streamer', function() {
		id = $(this).attr('data-name');
		populateStream(id)
		$('#streams').find('ul').empty()
		$('#streams').hide()
		$('#game_search').val('')
		$('#streamer_search').val('')
		$('#games').find('label').removeClass('active')
		$('#streamerSearch').find('label').removeClass('active')
		$('#games').addClass('hidden')
		$('#streamerSearch').addClass('hidden')
		$('#search').addClass('attach-right')
	})

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
	}

	var updatePageForStreamer = function(streamer) {
		$('.stream-container').removeClass('hidden')
		$('.info-container').removeClass('hidden')
		$('#streamerName').append(streamer['display_name']);
		$('#title').append(streamer['status'])
		$('#streamPlayer').append('<iframe height="'+streamHeight+'" width="'+streamWidth+'" frameborder="0" scrolling="no" src="http://www.twitch.tv/'+id+'/embed"></iframe>')
		$('#streamChat').append('<iframe frameborder="0" scrolling="no" id="chat_embed" src="http://twitch.tv/chat/embed?channel='+id+'&amp;popout_chat=true" height="'+streamHeight+'" width="'+chatWidth+'"></iframe>')
		$('#viewsCount').find('span').append(streamer['views'])
		$('#followerCount').find('span').append(streamer['followers'])
		$('#viewerCount').find('i').removeClass('hidden')
		$('#viewsCount').find('i').removeClass('hidden')
		$('#followerCount').find('i').removeClass('hidden')
		updateViewerCount()
		viewerRefresh = setInterval(function() {
			updateViewerCount()
		}, 18000)
	}

	var updateViewerCount = function() {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams/' + id,
			type: 'GET',
			dataType: 'jsonp',
			crossDomain: true,
		})
		.done(function(data) {
			updatePageWithViewers(data)
		})
	}

	var updatePageWithViewers = function(stream) {
		$('#viewerCount').find('span').empty()
		$('#viewerCount').find('span').append(stream['stream']['viewers'])
	}

	var emptyPage = function() {
		$('#streamerName').empty()
		$('#title').empty()
		$('#streamPlayer').empty()
		$('#streamChat').empty()
		$('#viewerCount').find('span').empty()
		$('#viewsCount').find('span').empty()
		$('#followerCount').find('span').empty()
		clearInterval(viewerRefresh)
	}


/* ==========================================================================
 	populate streamers
	========================================================================== */

	/* =========== stream view ===========  */

	var streamView = function(stream) { //needs stream object

		var preview_height = 125
		var aspect_ratio = 1.777 // twitch aspect ratio
		var preview_image = templateReplace(stream['preview']['template'], preview_height, aspect_ratio)

		var name = '<div class="name">' + stream['channel']['display_name'] + '</div>'
		var status = '<div class="status">' + stream['channel']['status'] + '</div>'
		var viewerbar = '<div class="viewerbar"><i class="fa fa-user"><span class="viewercount"> '+ stream['viewers'] +'</span></i></div>'
		var preview = '<div class="preview"><img src=' + preview_image +'></img>'+viewerbar+'</div>'
		var game = '<div class="game">' + stream['game'] + '</div>'

		var view = '<li class="streamer hidden" data-name="' + stream['channel']['name'] + '" data-display="'+ stream['channel']['display_name'] + '" data-game="' + stream["game"] +'" class="stream">' + name + status + preview + game + '</li>';

		return view;
	}

	var templateReplace = function(template, height, aspect_ratio) {
		template = template.replace('{height}', height)
		template = template.replace('{width}', Math.floor(height*aspect_ratio)) 
		return template
	}

	/* =========== stream bar open ===========  */

	$('#search').on('click', function() {
		var streams = $('#streams')
		if (streams.is(':visible')) {
			streams.find('ul').empty()
			streams.hide()
			$('#streams-left').removeClass('fixed')
			$('#streams-left').removeClass('fixed')
			$('#games').addClass('hidden')
			$('#streamerSearch').addClass('hidden')
			$('#search').addClass('attach-right')
		} else {
			getStreams();
			getGames();
			$('#streams-left').addClass('fixed')
			$('#streams-right').addClass('fixed')
			$('#games').removeClass('hidden')
			$('#streamerSearch').removeClass('hidden')
			$('#search').removeClass('attach-right')
			streams.show()
		}
	})
	
	/* =========== populate popular streams ===========  */

	var getStreams = function() {

		addLoadingIcon()

		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams?limit=100',
			type: 'GET',
			crossDomain: true,
			dataType: 'jsonp',
		})
		.done(function(data) {
			streamerAutoFill = streamerNameFill(data)
			$('#streamer_search').autocomplete({
				source: [streamerAutoFill],
				highlight: true,
				autoselect: true,
				limit: 3,
				visibleLimit: 3
			})
			loadAllStreams(data)
			removeLoadingIcon()
		})
		.fail(function(data) {
			console.log(data);
		})

	}

	var streamerNameFill = function(streams) {
		var autofill = []

		$.each(streams['streams'], function(i, stream) {
			autofill.push(stream['channel']['name'])
		})

		return autofill
	}

	// loading bar and misc stuff

	var loadAllStreams = function(streams) {
		$('#loading').fadeOut(200, function() {
			showStreams(streams)
			$('.streamer').each(function() {
				$(this).removeClass('hidden')
			})
		})
	}

	var addLoadingIcon = function() {
		$('#streams').append('<div id="loading"></div>')
		$('#loading').append('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-inverse"></i><br>')
		$('#loading').append('<span>Loading..</span>')
	}

	var removeLoadingIcon = function() {
		$('#loading').remove()

	}

	var showStreams = function(streams) {
		$.each(streams['streams'], function(i, stream) {
			view = streamView(stream)
			$('#streams').find('ul').append(view);
		})
	}

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
			autofill =  fillAutofill(data)
			$('#game_search').autocomplete({
				source: [autofill],
				highlight: true,
				autoselect: true,
				limit: 3,
				visibleLimit: 3
			})
		})
		.fail(function(data) {
			console.log(data);
		})
	}

	var fillAutofill = function(games) {
		var autofill = []

		$.each(games['top'], function(i, game) {
			autofill.push(game['game']['name'])
		})

		return autofill
	}


/* ==========================================================================
 	misc stuff
	========================================================================== */

	/* =========== matches hint bar to search bar ===========  */

	$('#game_hint').css("height", $('#game_search').outerHeight())
	$('#game_hint').css("width", $('#game_search').outerWidth())
	$('#games').addClass('hidden')

	$('#streamer_hint').css("height", $('#streamer_search').outerHeight())
	$('#streamer_hint').css("width", $('#streamer_search').outerWidth())
	$('#streamerSearch').addClass('hidden')

/* ==========================================================================
 	pre query
	========================================================================== */

	getGames();

});