// This code will not run if jQuery is not loaded
if (!window.jQuery) console.log("jQuery is not loaded and so the Universal Nav bar cannot initialize!");

// Make object available globally
var CU_navbar;

this.jQuery && (function ($) {

	var dev_urls = {
		'wwwtest.chapman.edu'          : 'www.chapman.edu',
		'eventsdev.chapman.edu'        : 'events.chapman.edu',
		'dev-blogs.chapman.edu'        : 'blogs.chapman.edu',
		'socialdev.chapman.edu'        : 'social.chapman.edu',
		'socialdev.chapman.edu/inside' : 'inside.chapman.edu',
		'localhost'                    : '206.211.143.174'
	}

	var CU_search = {
		isScrollLocked : false,

		initialize : function() {
			if (!google) {
				console.log("CU_search cannot initialize because the GSE javascript library has not yet loaded. ");
				return;
			}

			// Setup
			CU_search.$container     = $('#cu_search_results');
			CU_search.$containerCell = $('#cu_search_results_cell');

			CU_search.enableAjaxSearches();

		},

		/***************************************************
		* Initializses GCSE elements, and lightbox scripts
		***************************************************/
		enableAjaxSearches : function() {

			if (CU_search.gse) return;

			$("#cu_search_box").empty();

			google.search.cse.element.render(
			{
				// SEARCH BOX
				div: 'cu_search_box',
				tag: 'searchbox',
				attributes: {
					// gname: 'two-column',
					enableAutoComplete: true,
					autoCompleteMatchType: 'any',
					resultSetSize: 6,
					enableHistory: false
				}
			},
			{
				// RESULTS BOX
				div: 'cu_search_results_ui',
				tag: 'searchresults',
				attributes: {
					// gname: 'two-column',
					linkTarget: '_self',
					enableOrderBy: true
				}
			});

			// CU_search.cleanHash();
			CU_search.gse = google.search.cse.element.getElement('two-column');

			// Show results lightbox on search
			$("input.gsc-search-button").on('click',function() {
				if (CU_search.gse.getInputQuery().length <= 0){
					$('.gsc-input').focus();
					return;
				}
				CU_search.show();
			});

			// Show results lightbox on search
			$(".gsc-input").on('keyup', function(e) {
				if(e.keyCode == 13) CU_search.show();
				CU_search.bindAutocompleteTasks();
			});

			// Close lightbox on click
			CU_search.$container.click(function(e) {
				if (!$(e.target).parents('.gsc-control-cse').length && !$(e.target).hasClass('gsc-control-cse')) CU_search.hide();

				// GCS scrolls the window on pagination... Let's hotfix that!
				var scrollPosition = jQuery('html').data('scroll-position');
				window.scrollTo(scrollPosition[0], scrollPosition[1]);
			});

			// Close lightbox on esc key
			$('body').keyup(function(e) {
				if (e.which == 27) CU_search.hide();
			});

		},

		cleanHash : function() {
			var h = window.location.hash;
			if (h == '#gsc.tab=0' || h == '#gsc.tab=0&gsc.sort=') {

				var
				loc = window.location.href,
				index = loc.indexOf('#');

				if (index > 0) history.replaceState("", document.title, loc.substring(0, index));
			}
		},

		// Show the results lightbox when autocomplete is clicked.
		bindAutocompleteTasks : function() {
			if (CU_search.isAutocompleteBound) return;

			setTimeout(function() {
				// Do not bind if nothing to bind
				if (!$(".gsc-completion-container").length) return;

				$(".gsc-completion-container").on('click', function() {
					CU_search.show();
				});
				CU_search.isAutocompleteBound = true;
			}, 100); // Waits for autocomplete to add to DOM

		},

		show : function() {

			var term = CU_search.gse.getInputQuery();

			$('.gsc-control-cse').find('.more-results').remove();
			$('.gsc-control-cse').append('<a href="//www.chapman.edu/search-results/index.aspx?q='+encodeURIComponent(term)+'" class="more-results">See more results for "'+term+'"</a>');

			if (CU_search.visible) return;

			$('.gsc-input').blur();
			CU_search.$containerCell.css('height',$(window).height()+"px").css('width',$(window).width()+"px");
			CU_search.$container.fadeIn(80);
			CU_search.lockScroll();
			CU_search.visible = true;

		},

		hide : function() {
			if (!CU_search.visible) return;

			CU_search.$container.fadeOut(40);
			CU_search.unlockScroll();
			CU_search.visible = false;

			CU_search.gse.clearAllResults();
			// CU_search.cleanHash();
		},

		lockScroll : function() {
			// lock scroll position, but retain settings for later
			var scrollPosition = [
				self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
				self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
			];
			var html = jQuery('html'); // it would make more sense to apply this to body, but IE7 won't have that
			html.data('scroll-position', scrollPosition);
			html.data('previous-overflow', html.css('overflow'));
			html.css('overflow', 'hidden');
			window.scrollTo(scrollPosition[0], scrollPosition[1]);
			this.isScrollLocked = true;
		}, // end lockScroll

		unlockScroll : function() {
			if (!this.isScrollLocked) return false;

			var html = jQuery('html');
			var scrollPosition = html.data('scroll-position');
			html.css('overflow', 'visible');
			window.scrollTo(scrollPosition[0], scrollPosition[1]);
		}
	}

	// CU_navbar is made available to the global scope
	CU_navbar = {

		scrollTimeout : null,
		nav_visible : true,
		watchers_running : false,

		initialize: function () {

			// setup
			this.$container = $('#cu_nav');
			this.$menus = this.$container.find('.cu_nav_menu');
			this.nav_bar_height = this.$container.outerHeight();

			this.adjustEnvironment();
			this.selectDomain(CU_navbar.getCurrentDomain(), window.location.pathname);
			this.setupSecondaryNav(CU_navbar.getCurrentDomain(), window.location.pathname);
			this.initializeCompanionBar();

			// Click action
			this.$menus.on('click', CU_navbar.menuClick);

			// Mouse Hover FX
			this.$menus.lazybind('mouseenter', function (e) {
				CU_navbar.showMenu($(e.target).parents('.cu_nav_menu'));
			}, 150, 'mouseleave');

			// Mouse Hover FX
			this.$menus.lazybind('mouseleave', function (e) {
				CU_navbar.hideMenu($(e.target).parents('.cu_nav_menu'));
			}, 350, 'mousemove click');

			CU_navbar.initializeWatchers();

			setTimeout(function() {
				CU_navbar.$container.addClass('use-transitions');
			}, 250);

		},

		initializeCompanionBar: function() {
			CU_navbar.$companion_bar = $('#cu_companion_bar');

			if (CU_navbar.$companion_bar.length) {
				$('html').addClass('cu-companion-bar');
				CU_navbar.autohide_companion_bar = CU_navbar.$companion_bar.hasClass('autohide');
			} else {
				$('html').removeClass('cu-companion-bar');
			}
		},

		initializeWatchers: function() {
			if (CU_navbar.watchers_running) return;

			// Resizer
			if (window.addEventListener) {
				window.addEventListener('resize', CU_navbar.resizer, false);
			} else if (window.attachEvent) {
				window.attachEvent('onresize', CU_navbar.resizer);
			}

			// Scroll
			if (window.addEventListener) {
				window.addEventListener('scroll', CU_navbar.scroller, false);
			} else if (window.attachEvent) {
				window.attachEvent('onscroll', CU_navbar.scroller);
			}

			if (CU_navbar.autohide_companion_bar) {
				setInterval(function() {
					if (!CU_navbar.did_scroll) return;
					CU_navbar.checkNavBar();
					CU_navbar.did_scroll = false;
				}, 250);
			}

			CU_navbar.resizer();

			CU_navbar.watchers_running = true;
		},

		// Replace production URLs with Dev URLs
		adjustEnvironment: function() {

			if (!dev_urls[window.location.hostname]) return;

			// Make a prod_urls array
			var prod_urls = {};
			for (var prop in dev_urls) {
				if (dev_urls.hasOwnProperty(prop)) prod_urls[dev_urls[prop]] = prop;
			}

			CU_navbar.$container.find('#cu_nav_domain').find('a').each(function(index, item) {
				var item_href         = item.getAttribute('href');
				var production_domain = CU_navbar.getBaseDomain(item_href);
				var staging_domain    = prod_urls[production_domain];

				if (staging_domain) item.setAttribute('href', item_href.replace(production_domain, staging_domain));
			});

			CU_navbar.$menus.filter('[data-show-domain]').each(function(index, item) {
				var staging_domain = prod_urls[item.getAttribute('data-show-domain')];
				if (staging_domain) item.setAttribute('data-show-domain', staging_domain);
			});

		},

		// Return domain and port for given URL
		getBaseDomain: function(url) {
			var url = $.trim(url);
			if (url.search(/^https?\:\/\//) != -1) {
				url = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, "");
			} else {
				url = url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, "");
			}
			return url[1];
		},

		scroller: function() {
			CU_navbar.did_scroll = true;
		},

		resizer: function() {
			CU_navbar.window_height   = $(window).height();
			CU_navbar.document_height = $(document).height();
		},

		getCurrentDomain: function() {
			return (window.location.hostname == 'chapman.edu') ? 'wwww.chapman.edu' : window.location.hostname;
		},

		// Change the domain picker to the specified domain
		selectDomain: function(domain, path) {

			// Set domain picker
			$("#cu_nav_domain").find('.cu_nav_button').each(function(index, item) {

				if (item.getAttribute('href').indexOf(domain) >= 0) {
					$(item.parentNode).addClass('selected').siblings().removeClass('selected');
					return false; // break
				}
			});

			// Login
			$('#cu_login_container').find('.cu_dropdown_menu[data-show-domain]').each(function(index, item) {
				if (item.getAttribute('data-show-domain').indexOf(domain) >= 0) $(item).show();
			});

		},

		setupSecondaryNav: function(domain, path) {

			// Set secondary nav
			$('.cu_nav_secondary').each(function(index, item) {
				if (item.getAttribute('data-show-domain').indexOf(domain) >= 0) {

					$(item).show();

					// Select item from nav
					$(item).find('li').each(function(index, item) {

						var item_path = $(item).find('a').attr('href');
						var show_when = $(item).attr('data-show-path') || false;
						var hide_when = $(item).attr('data-hide-path') || false;

						// Visible items
						if (path.indexOf(show_when) === 0) {
							$(item).show();
						}

						// Hidden items
						if (path.indexOf(hide_when) === 0 || (show_when && path.indexOf(show_when) !== 0)) {
							$(item).hide();
						}

						// Currently selected items
						if (item_path != '/' && path.indexOf(item_path) >= 0) {
							$(item).addClass('selected').siblings().removeClass('selected');
						}
					});

					return false; // break (there is only one domain)
				}
			});
		},

		menuClick: function(e) {
			var modifierKey = (e.metaKey || e.ctrlKey);
			if (!modifierKey) CU_navbar.menuSelect(e);
		},

		menuSelect: function(e) {

			var $target = $(e.target);
			var $menu = ($target.hasClass('cu_nav_menu')) ? $target : $target.parents('.cu_nav_menu');

			// Ignore login form clicks
			if ($target.parents('#cu_login_form').length) return true;

			// Show menu if not yet expanded
			if (!$menu.hasClass('expanded')) {

				CU_navbar.showMenu($menu);
				e.preventDefault();
				return false;

			} else if ($target.parent('li').hasClass('selected')) {

				CU_navbar.hideMenu($menu);

			} else {

				CU_navbar.hideMenu($menu);
				$target.parent('li').addClass('selected').siblings().removeClass('selected'); // Rotate Select Element

				return true;
			}

		},

		hideMenu: function ($menu) {
			// Do nothing if there is a form being filled out
			if ($menu.find(':focus').length > 0) {
				return;
			}

			CU_navbar.menu_is_open = false;
			$menu.removeClass('expanded');
		},

		showMenu: function ($menu) {
			CU_navbar.menu_is_open = true;
			$menu.siblings().removeClass('expanded');
			$menu.addClass('expanded');
		},

		checkNavBar: function() {

			// Only run this if we have a companion bar
			if (CU_navbar.$companion_bar.length == 0) return;

			// Only autohide if enabled
			if (!CU_navbar.autohide_companion_bar) return;

			var st = $(window).scrollTop();

			// Minimum distance to trigger a change
			if (Math.abs(CU_navbar.lastScrollTop - st) <= 5) return;


			// When scrolling down, move nav up (hide)
			if (CU_navbar.nav_visible && st > CU_navbar.lastScrollTop && st > (this.nav_bar_height * 6)){

				CU_navbar.hideNavBar();
			}

			// When scrolling up, move nav down (show)
			if (!CU_navbar.nav_visible && (st < this.nav_bar_height || st < CU_navbar.lastScrollTop )) {

				// Ignore if past document height
				if ((st + CU_navbar.window_height >= CU_navbar.document_height) && CU_navbar.window_height != CU_navbar.document_height) return;

				CU_navbar.showNavBar();
			}

			CU_navbar.lastScrollTop = st;
		},

		showNavBar: function() {
			CU_navbar.$companion_bar.removeClass('nav-up').addClass('nav-down');
			CU_navbar.nav_visible = true;
		},

		hideNavBar: function() {
			CU_navbar.$companion_bar.removeClass('nav-down').addClass('nav-up');
			CU_navbar.nav_visible = false;
		}

	}


	var linkAnalytics = {

		initialize : function() {
			$('#cu_nav').on('click', '.cu_nav_button', linkAnalytics.trackAction);
		}, // end initialize

		trackAction : function(e) {

			/***************************************************
			* Event attributes:
			*
			* Category (required), Action (required), Label (optional), value (optional)
			*
			* More information: https://developers.google.com/analytics/devguides/collection/analyticsjs/events
			***************************************************/

			// Figure out what section we are in
			if ($(e.currentTarget).parents('#cu_nav_domain').length) {
				var action = "Domain Dropdown";
			} else if ($(e.currentTarget).parents('.cu_nav_secondary').length) {
				var action = "Secondary Dropdown";
			} else if ($(e.currentTarget).parents('#cu_login_container').length) {
				var action = "Login Dropdown";
			} else {
				var action = "Unknown";
			}

			var href_url 	= $(e.currentTarget).attr('href') || false;
			var modifierKey = (e.metaKey || e.ctrlKey);

			var ga_category = 'Omni Nav Interaction';
			var ga_action 	= action;
			var ga_label 	= $(e.currentTarget).text() ||'Click';

			// Check for Google Universal Analytics
			if (typeof(ga) !== 'undefined') {

				// Send event to Google Analytics
				ga('send', 'event', ga_category, ga_action, ga_label);

			// Check for ga.js
			} else if (typeof(_gaq) !== 'undefined') {

				// Send event to Google Analytics
				_gaq.push(['_trackEvent', ga_category, ga_action, ga_label]);

				// Navigate browser to the URL
				if (href_url && !modifierKey) {
					setTimeout(function() {
						window.location.href = href_url;
					}, 250);

					e.preventDefault();
					return false;
				}

			} else {
				console.log("Google Analytics is not running, so no Google Analytics tracking data could be sent.")
			}

		} // end trackAction()
	} // end linkAnalytics



	// Define Lazybind
	$.fn.lazybind = function (event, fn, timeout, abort) {
		var timer = null;

		$(this).bind(event, function (e) {
			timer = setTimeout(function () {
				fn(e);
			}, timeout);
		});

		if (abort === undefined) {
			return;
		}

		$(this).bind(abort, function () {
			if (timer !== null) {
				clearTimeout(timer);
			}
		});
	};


	$(document).ready(function () {
		CU_navbar.initialize();
		// CU_user.initialize();
		linkAnalytics.initialize();

		// SVG 4 Everybody
		(function(e,t,n,r,i){function s(t,n){if(n){var r=n.getAttribute("viewBox"),i=e.createDocumentFragment(),s=n.cloneNode(true);if(r){t.setAttribute("viewBox",r)}while(s.childNodes.length){i.appendChild(s.childNodes[0])}t.appendChild(i)}}function o(){var t=this,n=e.createElement("x"),r=t.s;n.innerHTML=t.responseText;t.onload=function(){r.splice(0).map(function(e){s(e[0],n.querySelector("#"+e[1].replace(/(\W)/g,"\\$1")))})};t.onload()}function u(){var i;while(i=t[0]){var a=i.parentNode,f=i.getAttribute("xlink:href").split("#"),l=f[0],c=f[1];a.removeChild(i);if(l.length){var h=r[l]=r[l]||new XMLHttpRequest;if(!h.s){h.s=[];h.open("GET",l);h.onload=o;h.send()}h.s.push([a,c]);if(h.readyState===4){h.onload()}}else{s(a,e.getElementById(c))}}n(u)}if(i){u()}})(document,document.getElementsByTagName("use"),window.requestAnimationFrame||window.setTimeout,{},/Trident\/[567]\b/.test(navigator.userAgent))



		// Insert it before the CSE code snippet so that cse.js can take the script
		// parameters, like parsetags, callbacks.
		window.__gcse = {
			parsetags: 'explicit',
			callback: CU_search.initialize
		};


		// Google Custom Search Script
		// Must load after window.__gsce is defined
		(function() {
		  var cx = '015856566681218627934:2ndbiubovo4';
		  var gcse = document.createElement('script');
		  gcse.type = 'text/javascript';
		  gcse.async = true;
		  gcse.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') +
		      '//www.google.com/cse/cse.js?cx=' + cx;
		  var s = document.getElementsByTagName('script')[0];
		  s.parentNode.insertBefore(gcse, s);
		})();


	});

})(jQuery);
