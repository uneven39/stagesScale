
;( function( $, window, document, undefined ) {

    "use strict";

    var pluginName = 'eventsTimeLine',
        seed = 0,
        defaults = {
            'start': 0,
            'finish': 24,
            'legendHeight': 'auto',
            'zoomLevel' : 1,
            'eventDescHeight': 200,
            'timeLabelWidth': 40
        },
        cols = {
            xs: 420, // max width for 1 column
            sm: 960, // max width for 2 column
            md: 1240 // max width for 3 column & min width for 4 columns
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
                // данные и опции:
                if ( Array.isArray(this.args[1]) && (this.args[2] === Object(this.args[2])) ) {
                    this.settings = $.extend( {}, this.settings, this.args[2] );
                    // сортируем данные по дате в аттрибуте
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
                    return;
                }
            } else if ((this.args[1] === Object(this.args[1])) && !Array.isArray(this.args[1])) {
                // только опции
                this.settings = $.extend( {}, this.settings, this.args[1] );
            } else if (Array.isArray(this.args[1])) {
                // только массив данных
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
            this.minimizeRulerLabels();
            this.initLegend();

            this.bind();
            this.groupEvents();
            this.refreshEventsLegend();

            // Сохраняем данные для пересчет скроллинга при ресайзе окна:
            this._scrollPos = this._$timeLine.scrollLeft();
            this._timeLineWidth = this._$timeLine.width();

            console.log(this);
        },

        sortEventNodes: function($container) {
            var $sortedData = $container.find('[data-date]').sort(function (itemA, itemB) {
                var dateA = new Date($(itemA).data('date')).getTime(),
                    dateB = new Date($(itemB).data('date')).getTime();
                return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
            });

            $container.html('').append($sortedData);

            console.dir($sortedData);

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

        /**
         * Скрываем лейблы часовых отметок, если ширина слишком маленькая:
         */
        minimizeRulerLabels: function () {
            var plugin = this,
                labelWidth = plugin.settings.timeLabelWidth,
                totalLabelsWidth = (plugin.settings.finish - plugin.settings.start + 1) * labelWidth,
                rulerWidth = plugin._$ruler.width();

            console.log(totalLabelsWidth, rulerWidth);

            if (totalLabelsWidth > rulerWidth && totalLabelsWidth < rulerWidth * 2) {
                plugin._$ruler.addClass('compact-even');
                plugin._$ruler.removeClass('compact-all');
            } else if (totalLabelsWidth > rulerWidth * 2) {
                plugin._$ruler.addClass('compact-all');
                plugin._$ruler.removeClass('compact-even');
            } else if (totalLabelsWidth < rulerWidth) {
                plugin._$ruler.removeClass('compact-all compact-even');
            }
        },

        /**
         * Группируем события в один бабл в таймлайне
         */
        groupEvents: function(){
            var plugin = this,
                settings = plugin.settings,
                $ruler = plugin._$ruler,
                $events = plugin._$events,
                $legend = plugin._$legend,
                $activeItems = $events.children(':not(.hidden)'),
                eventWidth = $events.find('.events-item:not(.hidden)').width() || 40;

            for (var hour = settings.start; hour < settings.finish; hour++) {
                var $hourGroup = $activeItems.filter(function (index, event) {
                        var date = new Date($(event).data('date'));
                        return (date.getHours() === hour);
                    });

                if ($hourGroup.length > 1) {
                    groupNearest($hourGroup);
                }
            }

            // Перепроверяем получившиеся группировки: если есть соседние лейблы,
            // налезающие на текущий, то объединяем:
            $events.children(':not(.hidden)').each(function (index, item) {
                var $item = $(item),
                    $next = $item.next(),
                    isOverlap = $next.offset() ?
                        $next.offset().left < ($item.offset().left + eventWidth * 0.666) :
                        false;

                if (isOverlap && $item.hasClass('group')) {
                    if ($next.hasClass('group')) {
                        $next.children().appendTo($item);
                        $next.remove();
                        $item.attr('data-count', $item.children().length);
                    } else {
                        $next.appendTo($item);
                        $item.attr('data-count', $item.children().length);
                    }
                } else if (isOverlap && !$item.hasClass('group')) {
                    if ($next.hasClass('group')) {
                        $item.prependTo($next);
                        $next.attr('data-count', $next.children().length);
                    } else {
                        var $newGroup = $([$item[0], $next[0]]);
                        groupNearest($newGroup);
                    }
                }
            });

            function groupNearest($collection) {
                // Инициализируем первый/последний индексы событий создаваемой группы
                var startGroupIdx = 0,
                    endGroupIdx = 0;

                // Просматриваем события в выборке $collection
                for (var i = 1; i < $collection.length; i++) {
                    var $item = $($collection[i]),
                        $prevItem = $($collection[i - 1]),
                        isOverlap = $item.offset().left < ($prevItem.offset().left + eventWidth * 0.666);

                    // Событие перекрывает предыдущее
                    if (isOverlap) {
                        endGroupIdx = i;
                        $events.trigger('eventsOverlapping');
                    }

                    // Событие не перекрывает предыдущее либо оно последнее в выборке:
                    // определяем крайнее событие в создаваемой группе событий
                    if (!isOverlap || (i === ($collection.length - 1))) {
                        if ((endGroupIdx - startGroupIdx) > 0) {
                            var $wrapper = $('<div class="group"></div>'),
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
            this._$events.find('.group').each(function(index, group) {
                $(group).children().unwrap('.group');
            })
        },

        refreshSelected: function () {
            var plugin = this,
                $events = plugin._$events,
                $legend = plugin._$legend;

            // Обновляем выбранные группы событий в легенде
            $events.children('.group').each(function() {
                var $group = $(this);

                if ($group.children().length === $group.children('.selected').length) {
                    var sameDate;

                    $group
                        .addClass('selected')
                        .children().each(function(){
                        $(this).addClass('selected');
                        if ($(this).data('date') !== sameDate) {
                            var $selected = $legend.find('.selected').length ?
                                $legend.find('.selected') :
                                $('<div class="selected"></div>'),
                                dateSelector = '.legend-item.in-view[data-date="' + $(this).data('date') + '"]',
                                $item = $legend.find('.cols ' + dateSelector).clone();

                            if ($legend.find('.selected ' + dateSelector).length === 0) {
                                $item.appendTo($selected);

                                if ($item.length > 1) {
                                    sameDate = $(this).data('date');
                                }

                                $selected.html(plugin.sortNodesByDate($selected.children()));

                                if (!$legend.find('.selected').length) {
                                    $selected.prependTo($legend);
                                }
                            }

                        }
                    });

                } else {
                    $group
                        .removeClass('selected')
                        .children().each(function(){
                        $legend.find('.selected .legend-item.in-view[data-date="' + $(this).data('date') + '"]').each(function() {
                            $(this).remove();
                        });
                        if ($legend.find('.selected').children().length === 0) {
                            $legend.find('.selected').remove();
                        }
                    });
                }
            });

            $events.children('.events-item.selected').each(function() {
                var $selected = $legend.find('.selected').length ?
                    $legend.find('.selected') :
                    $('<div class="selected"></div>'),
                    dateSelector = '.legend-item.in-view[data-date="' + $(this).data('date') + '"]',
                    $item = $legend.find('.cols ' + dateSelector).clone();

                if ($legend.find('.selected ' + dateSelector).length === 0) {
                    $item.appendTo($selected);

                    if ($item.length > 1) {
                        sameDate = $(this).data('date');
                    }

                    $selected.html(plugin.sortNodesByDate($selected.children()));

                    if (!$legend.find('.selected').length) {
                        $selected.prependTo($legend);
                    }
                }
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

        /**
         * Зум +/-
         * @param zoomType
         */
        zoom: function(zoomType) {
            var $timeLine = this._$timeLine,
                plugin = this,
                newZoomLevel,
                curZoomLevel = this._zoomLevel,
                curScroll,
                newScroll;

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
            newScroll = Math.ceil((curScroll + $timeLine.width() / 2)*( zoomLevels[newZoomLevel] * newZoomLevel)/( zoomLevels[curZoomLevel] * curZoomLevel) - $timeLine.width()/2);

            console.log(curScroll, newScroll, $timeLine.width(), plugin._$events.width());

            $timeLine.animate({scrollLeft: newScroll}, 300);
            $timeLine.find('.ruler').animate({width: zoomLevels[newZoomLevel] * newZoomLevel + '%'}, 300);
            $timeLine.find('.events')
                .animate({width: zoomLevels[newZoomLevel] * newZoomLevel + '%'},
                    {duration: 300,
                        done: function(){
                            // перегруппируем события после анимации
                            plugin.ungroupEvents();
                            plugin.groupEvents(newZoomLevel);
                            plugin._scrollPos = $timeLine.scrollLeft();
                            plugin._timeLineWidth = $timeLine.width();
                            $timeLine.trigger('zoom');
                        }
                    });
        },

        /**
         * Заполняем .legend описаниями событий
         */
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

        /**
         * Обновляем описания видимых событий в .legend
         */
        refreshEventsLegend: function () {
            var plugin = this,
                $timeLine = plugin._$timeLine,
                $events = plugin._$events,
                $legend = plugin._$legend,
                $cols = $legend.find('.cols'),
                $colsWrapper = $('<div class="cols"></div>'),
                legendWidth = $legend.width(),
                leftLimit = $timeLine.offset().left,
                rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2);

            if ($cols.length) {
                $cols.children()
                    .each(function(index, item) {
                        $(item).removeClass('in-view hidden extendable');
                    })
                    .unwrap('.cols');
            }

            // Устанавливаем колонки в зависимости от ширины .legend
            if (legendWidth <= cols.xs) {
                $legend.removeClass('lg md sm')
                    .addClass('xs');
            } else if (legendWidth > cols.xs && legendWidth <= cols.sm) {
                $legend.removeClass('lg md xs')
                    .addClass('sm');
            } else if (legendWidth > cols.sm && legendWidth <= cols.md) {
                $legend.removeClass('lg sm xs')
                    .addClass('md');
            } else if (legendWidth > cols.md) {
                $legend.removeClass('md sm xs')
                    .addClass('lg');
            }

            $events.children().each(function(index, el) {
                var leftBorder = $(el).offset().left,
                    rightBorder = leftBorder + $(el).width();

                // Проверяем, что событие/группа во "вьюпорте":
                if ((rightBorder > leftLimit) && (leftBorder < rightLimit)) {
                    // Проверяем, событие или группа
                    if ($(el).hasClass('group')) {
                        // группа:
                        $(el).children().each(function(index, item) {
                            var $item = $(item),
                                eventDate = $item.data('date'),
                                $legendItem = $legend.children('.legend-item[data-date="' + eventDate + '"]');

                            $legendItem.each(function(){
                                $(this).addClass('in-view');
                                if ($(this).height() > plugin.settings.eventDescHeight) {
                                    $(this).addClass('extendable');
                                }
                            })
                        });
                    } else if ($(el).hasClass('events-item')) {
                        // одиночное событие:
                        var $item = $(el),
                           eventDate = $item.data('date'),
                           $legendItem = $legend.children('.legend-item[data-date="' + eventDate + '"]');

                        $legendItem.each(function(){
                            $(this).addClass('in-view');
                            if ($(this).height() > plugin.settings.eventDescHeight) {
                                $(this).addClass('extendable');
                            }
                        })
                    }
                }

            });

            $legend.find('.legend-item.in-view:not(.selected .legend-item.in-view)').wrapAll($colsWrapper);
        },

       /**
        * Подсвечиваем $item в .legend
        * @param $item
        */
        highlightLegendItem: function($item) {
            var $legend = this._$legend;
            if ($item.hasClass('group')) {
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

       /**
        * Убираем подсветку $item в .legend
        * @param $item
        */
        unhighlightLegendItem: function($item) {
            var $legend = this._$legend;
            if ($item.hasClass('group')) {
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

        resetSelectedEvents: function() {
            this._$events.find('.selected').each(function() {
                $(this).removeClass('selected');

                if ($(this).hasClass('group')) {
                    $(this).children('.selected').each(function () {
                        $(this).removeClass('selected');
                    })
                }
            });
            this._$legend.find('.selected').remove();
        },

        /**
         * Получаем новое значение прокрутки для таймлайна при изменении размеров окна
         * (для сохранения позиции прокрутки)
         * @param newWidth
         * @returns {number}
         */
        rescroll: function(newWidth) {
            var curScroll = this._scrollPos,
                curWidth = this._timeLineWidth,
                ratio = curScroll / curWidth,
                newScroll = ratio * newWidth;

            return newScroll;
        },

        /**
         * Сортируем ноды по их data-date аттрибуту
         * @param $list
         * @returns {void|*}
         */
        sortNodesByDate: function($list) {
            var $sorted = $list.sort(function (a, b) {
                var dateA = new Date($(a).data('date')).getTime(),
                    dateB = new Date($(b).data('date')).getTime();

                if (dateA < dateB) {
                    return -1;
                }
                if (dateA > dateB) {
                    return 1;
                }
                return 0;
            });

            return $sorted;
        },

       /**
        * Привязываем обработчики к событиям
        */
        bind: function() {
            var plugin = this,
                $pluginContainer = this._$pluginContainer,
                $events = plugin._$events,
                $timeLine = this._$timeLine,
                $controls = this._$controls,
                $ruler = this._$ruler,
                $legend = this._$legend,
                resizeTimer,
                winWidth = $(window).width();

            $(window).on('resize', function() {

                if (resizeTimer) clearTimeout(resizeTimer);

                resizeTimer = setTimeout(function() {
                    $timeLine.scrollLeft(plugin.rescroll(plugin._$timeLine.width()));
                    // if (winWidth < $(window).width()) {
                    //     plugin.ungroupEvents();
                    // }
                    plugin.minimizeRulerLabels();
                    plugin.ungroupEvents();
                    plugin.groupEvents();
                    plugin.refreshSelected();
                    plugin.refreshEventsLegend();
                    winWidth = $(window).width();

                }, 300);

            });

            $timeLine
                .on('zoom', function() {
                    if (!$timeLine.is(':animated')) {
                        clearTimeout($.data(this, 'zoomTimer'));
                        $.data(this, 'zoomTimer', setTimeout(function() {
                            plugin.resetSelectedEvents();
                            plugin.refreshEventsLegend();
                        }, 100));
                    }
                })
                .on('scroll', function () {
                    if (!$timeLine.is(':animated')) {
                        clearTimeout($.data(this, 'scrollTimer'));
                        $.data(this, 'scrollTimer', setTimeout(function() {
                            plugin.refreshEventsLegend();
                            plugin._scrollPos = $timeLine.scrollLeft();
                            plugin._timeLineWidth = $timeLine.width();
                        }, 100));
                    }
                })
                .on('mouseenter', '.events-item, .group', function() {
                    plugin.highlightLegendItem($(this));
                })
                .on('mouseleave', '.events-item, .group', function() {
                    plugin.unhighlightLegendItem($(this));
                })
                .on('click', function (e) {
                    if (!$(e.target).hasClass('events-item') && !$(e.target).hasClass('group')) {
                        plugin.resetSelectedEvents();
                    }
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
               });

           $legend
               .on('click', '.legend-item.in-view.extendable .header', function () {
                   $(this).closest('.legend-item').toggleClass('in');
                });

           $events
               .on('click', '.events-item', function() {
                   if (!$(this).hasClass('selected')) {
                       var $selected = $legend.find('.selected').length ?
                                       $legend.find('.selected') :
                                       $('<div class="selected"></div>'),
                           selector = '.legend-item.in-view[data-date="' + $(this).data('date') + '"]',
                           $item = $legend.find(selector).clone();
                       $(this).addClass('selected');

                       $item.appendTo($selected);

                       $selected.html(plugin.sortNodesByDate($selected.children()));

                       if (!$legend.find('.selected').length) {
                           $selected.prependTo($legend);
                       }
                   } else {
                       $(this).removeClass('selected');
                       $legend.find('.selected').find('.legend-item.in-view[data-date="' + $(this).data('date') + '"]').remove();
                       if ($legend.find('.selected').children().length === 0) {
                           $legend.find('.selected').remove();
                       }
                   }

               })
               .on('click', '.group', function() {
                   if (!$(this).hasClass('selected')) {
                       var sameDate;

                       $(this)
                           .addClass('selected')
                           .children().each(function(){
                               $(this).addClass('selected');
                               if ($(this).data('date') !== sameDate) {
                                   var $selected =  $legend.find('.selected').length ? $legend.find('.selected') : $('<div class="selected"></div>'),
                                       selector = '.cols .legend-item.in-view[data-date="' + $(this).data('date') + '"]',
                                       $item = $legend.find(selector).clone();

                                   $item.appendTo($selected);

                                   if ($item.length > 1) {
                                       sameDate = $(this).data('date');
                                   }

                                   $selected.html(plugin.sortNodesByDate($selected.children()));

                                   if (!$legend.find('.selected').length) {
                                       $selected.prependTo($legend);
                                   }

                               }
                           });
                   } else {
                       $(this).removeClass('selected')
                           .children().each(function(){
                               $(this).removeClass('selected');
                               $legend.find('.selected .legend-item.in-view[data-date="' + $(this).data('date') + '"]').each(function() {
                                   $(this).remove();
                               });
                           if ($legend.find('.selected').children().length === 0) {
                               $legend.find('.selected').remove();
                           }
                       });
                   }
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