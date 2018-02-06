
;( function( $, window, document, undefined ) {

    "use strict";

    var pluginName = "eventsTimeLine",
        seed = 0,
        defaults = {
            'start': 0,
            'finish': 24,
            'legendHeight': 'auto',
            'zoomLevel' : 1
        },
        zoomLevels = [
            100,
            100,
            110,
            120,
            130,
            140,
            150,
            160,
            170,
            185,
            200
        ],
        ruler24Labels = [
            '01:00',
            '02:00',
            '03:00',
            '04:00',
            '05:00',
            '06:00',
            '07:00',
            '08:00',
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
            '15:00',
            '16:00',
            '17:00',
            '18:00',
            '19:00',
            '20:00',
            '21:00',
            '22:00',
            '23:00',
            '24:00'
        ],
        dayLength = 86400000, // day duration in ms
        timeShift = (new Date).getTimezoneOffset() * 60 * 1000; // TimeZone offset in ms

    // plugin constructor
    function Plugin (element, dataArray, options) {
        var self = this;

        this.element = element;
        this.args = arguments;

        this._$pluginContainer = $(element);

        this._totalDuration = 0;

        this.timeShift = timeShift;
        this.settings = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend( Plugin.prototype, {
        init: function() {
            var eventsList = [],
                eventsHtml;
            seed += 1;

            if (this.args[1] && this.args[2]) {
                // data & options:
                if ( Array.isArray(this.args[1]) && (this.args[2] === Object(this.args[2])) ) {
                    // correct types
                    this.settings = $.extend( {}, this.settings, this.args[2] );
                    // sort data array by date
                    eventsList = this.args[1].sort(function(itemA, itemB) {
                        var dateA = new Date(itemA.date),
                            dateB = new Date(itemB.date);
                        return (dateA.getTime() - dateB.getTime());
                    });

                    eventsHtml = '';
                    for (var i = 0; i < eventsList.length; i++) {

                        eventsHtml += '<div data-date="' + eventsList[i].date + '" data-type="' + eventsList[i].type +
                            '" data-icon="' + eventsList[i].icon + '" data-title="' + eventsList[i].title +
                            '" data-text="' + eventsList[i].text + '" class="events-item">' + eventsList[i].text +
                            '</div> ';
                    }
                    this._$pluginContainer.html(eventsHtml);

                } else {
                    // invalid types
                    return;
                }
            } else if ((this.args[1] === Object(this.args[1])) && !Array.isArray(this.args[1])) {
                // options only
                this.settings = $.extend( {}, this.settings, this.args[1] );
            } else if (Array.isArray(this.args[1])) {
                // data array only
                eventsList = this.args[1].sort(function(itemA,itemB) {
                    var dateA = new Date(itemA.date),
                        dateB = new Date(itemB.date);
                    return (dateA.getTime() - dateB.getTime());
                });
                eventsHtml = '';
                for (var k = 0; k < eventsList.length; k++) {
                    eventsHtml += '<div data-date="' + eventsList[k].date + '" data-type="' + eventsList[k].type +
                        '" data-icon="' + eventsList[k].icon + '" data-title="' + eventsList[k].title +
                        '" data-text="' + eventsList[k].text + '" class="events-item">' + eventsList[k].text +
                        '</div> ';
                }
                this._$pluginContainer.html(eventsHtml);
            }

            // Сортируем коллекцию событий по датам, получаем массив событий
            if (!eventsList.length) {
                this.sortEventNodes(this._$pluginContainer);
                eventsList = this.getEventsListFromContainer(this._$pluginContainer);
            }
            this._firstEventDate = eventsList[0].date;
            this._lastEventDate = eventsList[eventsList.length - 1].date;
            this._totalDuration = this._lastEventDate - this._firstEventDate;
            this._zoomLevel = 1;

            this._$pluginContainer
                .addClass('time-line-plugin')
                .attr('id', 'time-line-plugin-' + seed)
                .children()
                .wrapAll('<div class="time-line"><div class="events"></div></div>');
            this._$pluginContainer
                .prepend('<div class="controls">' +
                    '<button type="button" class="control scroll-left"> < </button><button type="button" class="control scroll-right"> > </button>' +
                    '<button type="button" class="control zoom-in"> + </button><button type="button" class="control zoom-out"> - </button>' +
                    '</div>')
                .append('<div class="legend"></div>');

            this._$timeLine = this._$pluginContainer.find('.time-line');
            this._$timeLine.append('<div class="ruler"></div>');
            this._$events = this._$timeLine.find('.events');
            this._$ruler = this._$timeLine.find('.ruler');
            this._$controls = this._$pluginContainer.find('.controls');
            this._$legend = this._$pluginContainer.find('.legend');

            this._$pluginContainer.find('.legend').css('height', this.settings.legendHeight);

            this.redraw();
            this.drawRuler();
            this.initLegend();

            this.bind();
            this.groupEvents();
            this.refreshEventsLegend();
            this.redrawLegendCols();

        },

        sortEventNodes: function($container) {
            var $sortedData = $container.find('[data-type][data-date]').sort(function (itemA, itemB) {
                var dateA = new Date($(itemA).data('date')).getTime(),
                    dateB = new Date($(itemB).data('date')).getTime();
                return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
            });

            $container.html('').append($sortedData);

            return $container;
        },

        getEventsListFromContainer: function ($container) {
            var eventsList = [];

            $container.find('[data-type][data-date]').each(function(index, item) {
                var event = {};

                event.date = $(item).data('date');
                event.type = $(item).data('type');
                event.icon = $(item).data('icon');
                event.title = $(item).data('title');
                event.text = $(item).text();

                eventsList.push(event);
            });

            return eventsList;
        },

        drawRuler: function() {
            var $ruler = this._$ruler;
            for (var i = this.settings.start; i < this.settings.finish; i++) {
                var $rulerUnit = $('<div class="unit-hh" data-value="' + ruler24Labels[i] + '">' +
                    '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
                    '</div>');
                if (i === this.settings.start) {
                    var label = ('0' + i).slice(-2) + ':00';
                    $rulerUnit.attr('data-start-hour', '' + label);
                }
                $rulerUnit.css('width', 100 / (this.settings.finish - this.settings.start) + '%');
                $ruler.append($rulerUnit);
            }
            this._$timeLine.append($ruler);
        },

        groupEvents: function(){
            var plugin = this,
                settings = this.settings,
                $ruler = plugin._$ruler,
                $events = plugin._$events,
                $activeItems,
                eventWidth;

            this.ungroupEvents();

            eventWidth = $events.find('.events-item:not(.hidden)').width() || 40;

            $activeItems = $events.children(':not(.hidden)');

            for (var hour = settings.start; hour < settings.finish; hour++) {
                var $hourGroup = $activeItems.filter(function (index, event) {
                        var date = new Date($(event).data('date'));
                        return (date.getHours() === hour);
                    });

                if ($hourGroup.length > 1) {
                    groupNearest($hourGroup);
                }
            }

            // Перепроверяем получившиеся группировки: если есть соседние лейлблы, налезающие на
            // текущий, то объединяем:
            $events.children(':not(.hidden)').each(function (index, item) {
                var $item = $(item),
                    $next = $item.next(),
                    isOverlap = $next.offset() ?
                        $next.offset().left < ($item.offset().left + eventWidth * 0.666) :
                        false;
                if (isOverlap && $item.hasClass('group-by')) {
                    if ($next.hasClass('group-by')) {
                        $next.children().appendTo($item);
                        $next.remove();
                        $item.attr('data-count', $item.children().length);
                    } else {
                        $next.appendTo($item);
                        $item.attr('data-count', $item.children().length);
                    }
                } else if (isOverlap && !$item.hasClass('group-by')) {
                    if ($next.hasClass('group-by')) {
                        $item.prependTo($next);
                        $next.attr('data-count', $next.children().length);
                    } else {
                        var $newGroup = $([$item[0], $next[0]]);
                        groupNearest($newGroup);
                    }
                }
            });

            function groupNearest($collection) {
                var startGroupIdx = 0,
                    endGroupIdx = 0;

                // Группируем события в каждом часе
                for (var i = 1; i < $collection.length; i++) {
                    var $item = $($collection[i]),
                        $prevItem = $($collection[i - 1]),
                        isOverlap = $item.offset().left < ($prevItem.offset().left + eventWidth * 0.666);

                    if (isOverlap) {
                        endGroupIdx = i;
                    }

                    if (!isOverlap || (i === ($collection.length - 1))) {
                        if ((endGroupIdx - startGroupIdx) > 0) {
                            var $wrapper = $('<div class="group-by"></div>'),
                                $group = $collection.slice(startGroupIdx, endGroupIdx + 1),
                                offset,
                                leftOffsetFirst = $($group[0]).css('left'),
                                leftOffsetLast = $($group[$group.length - 1]).css('left');

                            leftOffsetFirst = +leftOffsetFirst.substring(0, leftOffsetFirst.length - 2);
                            leftOffsetLast = +leftOffsetLast.substring(0, leftOffsetLast.length - 2);

                            offset = 100 * ((leftOffsetLast + leftOffsetFirst) / 2) / $ruler.width();
                            $wrapper
                                .attr('data-count', $group.length)
                                .css('left', offset + '%');

                            $group.wrapAll($wrapper);
                        }
                        startGroupIdx = i;
                    }
                }
            }
        },

        ungroupEvents: function() {
            this._$events.find('.group-by').each(function(index, group) {
                $(group).children().unwrap('.group-by');
            })
        },

        redraw: function () {
            var startEvents = new Date(this._firstEventDate),
                finishEvents = new Date(this._lastEventDate),

                startHour = startEvents.getHours(),
                finishHour = finishEvents.getHours() === 23 ? 24 : finishEvents.getHours() + 1,

                minDateLimit = new Date(this._firstEventDate),
                maxDateLimit = new Date(this._firstEventDate);

            if (this.settings.start === 'auto') {
                this.settings.start = startHour;
            }
            if (this.settings.finish === 'auto') {
                this.settings.finish = finishHour;
            }

            minDateLimit.setHours(this.settings.start, 0, 0, 0);
            maxDateLimit.setHours(this.settings.finish, 0, 0, 0);

            this._totalDuration = finishEvents.getTime() - startEvents.getTime();

            this._$events.children().each(function(index, item) {
                var $item = $(item),
                    date = new Date($item.data('date')).getTime(),
                    isInRange = (date >= minDateLimit.getTime()) && (date <= maxDateLimit.getTime()),
                    rangeLength = maxDateLimit.getTime() - minDateLimit.getTime(),
                    position;

                if (isInRange) {
                    position = ((rangeLength - (maxDateLimit.getTime() - date)) / rangeLength)*100 + '%';
                    $item
                        .attr('data-text', $item.html())
                        .text('')
                        .addClass('events-item')
                        .addClass('icon-' + $item.data('icon'))
                        .css('left', position);
                } else {
                    $item.addClass('hidden');
                }
            });

        },

        redrawLegendCols: function() {
            var totalHeight = 0,
                listHeightLimit,
                listHeight = 0,
                start = 0,
                end = 0,
                cols = 0,
                $legend = this._$pluginContainer.find('.legend'),
                $eventsInView,
                $cols,
                colsHeight = [];

            // Убираем группировку по колонкам
            $legend.find('.col-3').each(function (index, col) {
                $(col).children().unwrap('.col-3');
            });

            $eventsInView = $legend.children('.in-view');
            $eventsInView.each(function (index, event) {
                totalHeight += $(event).height();
            });

            listHeightLimit = totalHeight / 3;

            for (var i = 0; i < $eventsInView.length; i ++) {
                var itemHeight = $($eventsInView[i]).height();
                listHeight += itemHeight;
                if (listHeight >= listHeightLimit) {
                    end = (listHeight === listHeightLimit) ? (i + 1) : i;
                    $eventsInView.slice(start, end).wrapAll('<div class="col-3"></div>');
                    start = end;
                    listHeight = 0;
                    cols += 1;
                }
                if (cols === 2) break;
            }
            if (cols < 3)
                $eventsInView.slice(start, $eventsInView.length).wrapAll('<div class="col-3"></div>');

        },

        zoom: function(zoomType) {
            var $timeLine = this._$timeLine,
                plugin = this,
                newZoomLevel,
                curZoomLevel = this._zoomLevel,
                curScroll;

            switch (zoomType) {
                case '+':
                    newZoomLevel = this._zoomLevel === 10 ? this._zoomLevel : this._zoomLevel + 1;
                    break;
                case '-':
                    newZoomLevel = this._zoomLevel === 1 ? 1 : this._zoomLevel - 1;
                    break;
                default:
                    newZoomLevel = this._zoomLevel;
                    break;
            }

            this._zoomLevel = newZoomLevel;

            curScroll = $timeLine.scrollLeft();

            $timeLine.animate({scrollLeft: Math.ceil((curScroll + $timeLine.width() / 2)*( zoomLevels[newZoomLevel] * newZoomLevel)/( zoomLevels[curZoomLevel] * curZoomLevel) - $timeLine.width()/2)}, 300);
            $timeLine.find('.ruler').animate({width: zoomLevels[newZoomLevel] * newZoomLevel + '%'}, 300);
            $timeLine.find('.events')
                .animate({width: zoomLevels[newZoomLevel] * newZoomLevel + '%'},
                    {duration: 300,
                        done: function(){
                            // перегруппируем события после анимации
                            plugin.groupEvents(newZoomLevel);
                            $timeLine.trigger('zoom');
                        }
                    });
        },

        initLegend: function () {
            var $legend = this._$pluginContainer.find('.legend'),
                $legendContent = $('<div></div>');
            this._$events.children().each(function(index, el) {
                var $eventData = $('<div class="legend-item" data-date="' + $(el).data('date') + '"></div>'),
                    date = new Date($(el).data('date')),
                    dateStr = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' +
                        ('0' + date.getSeconds()).slice(-2) + ' ' + ('0' + date.getDate()).slice(-2) +
                        '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();

                $eventData.append('<div class="header icon-' + $(el).data('icon') + '">' +
                    dateStr + '<h4>' + $(el).data('title') + '</h4>' +
                    '</div>' +
                    '<div class="description">' + $(el).data('text') + '</div>');
                $legendContent.append($eventData);
            });
            $legend.html($legendContent.html());
        },

        refreshEventsLegend: function () {
            var $timeLine = this._$timeLine,
                $events = this._$events,
                $legend = this._$legend,
                leftLimit = $timeLine.offset().left,
                rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2);

            $legend.find('.legend-item.in-view').each(function(index, item) {
                $(item).removeClass('in-view');
            });

            $events.children().each(function(index, el) {
                var leftBorder = $(el).offset().left;

                // Checking if event item or group is in time-line viewport:
                if ((leftBorder >= leftLimit) && (leftBorder <= rightLimit)) {
                    // Check if group or single event
                    if ($(el).hasClass('group-by')) {
                        // group:
                        $(el).children().each(function(index, item) {
                            var $item = $(item),
                                eventDate = $item.data('date');

                            $legend.find('.legend-item[data-date="' + eventDate + '"]').addClass('in-view');
                        });
                    } else if ($(el).hasClass('events-item')) {
                        // single:
                        var $item = $(el),
                            eventDate = $item.data('date');

                        $legend.find('[data-date="' + eventDate + '"]').addClass('in-view');
                    }
                }

            });
        },

        highlightLegendItem: function($item) {
            var $legend = this._$legend;
            if ($item.hasClass('group-by')) {
                $item.children().each(function (index, item) {
                    var legendSelector = '.legend-item[data-date="' + $(item).data('date') + '"]',
                        $legendItem = $legend.find(legendSelector);
                    $legendItem.addClass('highlight');
                })
            } else {
                var legendSelector = '.legend-item[data-date="' + $item.data('date') + '"]',
                    $legendItem = $legend.find(legendSelector);
                $legendItem.addClass('highlight');
            }
        },

        unhighlightLegendItem: function($item) {
            var $legend = this._$legend;
            if ($item.hasClass('group-by')) {
                $item.children().each(function (index, item) {
                    var legendSelector = '.legend-item[data-date="' + $(item).data('date') + '"]',
                        $legendItem = $legend.find(legendSelector);
                    $legendItem.removeClass('highlight');
                })
            } else {
                var legendSelector = '.legend-item[data-date="' + $item.data('date') + '"]',
                    $legendItem = this._$legend.find(legendSelector);
                $legendItem.removeClass('highlight');
            }
        },

        bind: function() {
            var plugin = this,
                $pluginContainer = this._$pluginContainer,
                $timeLine = this._$timeLine,
                $controls = this._$controls,
                $ruler = this._$ruler;

            $timeLine
                .on('scroll zoom', function() {
                    if (!$timeLine.is(':animated')) {
                        clearTimeout($.data(this, 'scrollTimer'));
                        $.data(this, 'scrollTimer', setTimeout(function() {
                            plugin.refreshEventsLegend();
                            plugin.redrawLegendCols();
                        }, 100));
                    }
                })
                .on('mouseenter', '.events-item, .group-by', function() {
                    plugin.highlightLegendItem($(this));
                })
                .on('mouseleave', '.events-item, .group-by', function() {
                    plugin.unhighlightLegendItem($(this));
                });

            $controls
                .on('click', '.zoom-in', function () {
                    var $btn = $(this);
                    plugin.zoom('+');
                    if (plugin._zoomLevel === 10) {
                        $btn.attr('disabled', true);
                    } else {
                        $btn.attr('disabled', false);
                    }
                    plugin._$controls.find('.zoom-out').attr('disabled', false);
                })
                .on('click', '.zoom-out', function () {
                    plugin.zoom('-');
                    if (plugin._zoomLevel === 1)
                        $(this).attr('disabled', true);
                    else
                        $(this).attr('disabled', false);
                    plugin._$controls.find('.zoom-in').attr('disabled', false);
                })
                .on('click', '.scroll-right', function () {
                    var step = $ruler.width() / (plugin.settings.finish - plugin.settings.start),
                        curScroll = $timeLine.scrollLeft() + 25;
                    $timeLine.animate({scrollLeft: Math.floor(curScroll / step) * step + step},
                        {duration: 300, done: function() {
                                $timeLine.trigger('scroll');
                        }});
                })
                .on('click', '.scroll-left', function () {
                    var step = $ruler.width() / (plugin.settings.finish - plugin.settings.start),
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step - step},
                        {duration: 300, done: function() {
                                $timeLine.trigger('scroll');
                            }});
                })
        }
    } );

    $.fn[ pluginName ] = function( dataArray, options ) {
        return this.each( function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" +
                    pluginName, new Plugin( this, dataArray, options ) );
            }
        } );
    };

} )( jQuery, window, document );