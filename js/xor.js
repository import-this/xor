/**
 * XOR
 * https://import-this.github.io/xor
 *
 * A small collection of simple logic puzzle games - #xor.
 *
 * Copyright (c) 2016, Vasilis Poulimenos
 * Released under the BSD 3-Clause License
 * https://github.com/import-this/xor/blob/master/LICENSE
 *
 * Supported browsers (as stated in online references):
 *     IE 9+, FF 3.5+, Chrome 4+, Opera 10.60+, SF 4+
 *
 * The code follows the conventions of Google JavaScript Style Guide,
 *     with some alterations. The style guide is described in depth here:
 *     https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
 * Comments follow the conventions of JSDoc. Documentation can be found here:
 *     http://usejsdoc.org/
 *
 * Date: 4/11/2016
 * @version: 1.0.0
 * @author Vasilis Poulimenos
 */

/*globals jQuery */
(function($, window, document) {

"use strict";

/**
 * Don't forget to set this to false in production!
 * @const
 */
var DEBUG = !true;

/******************************* Basic Logging ********************************/

/** @const */
var log = (function() {
    var console = window.console;

    if (console && console.log) {
        // Don't simply return console.log, because that messes up 'this'.
        return function log(msg) {console.log(msg); };
    }
    return function noop() {};
}());

/********************************* Polyfills **********************************/

if (String.prototype.startsWith === undefined) {
    log('Undefined "String.prototype.startsWith". Using really bad polyfill...');

    // http://stackoverflow.com/a/4579228/1751037
    String.prototype.startsWith = function startsWith(prefix) {
        return this.lastIndexOf(prefix, 0) === 0;
    };
}

/******************************* Local Storage ********************************/

// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
// http://dev.w3.org/html5/webstorage/

/**
 * The version number. Useful for marking changes in the storage format.
 * @const {string}
 */
var VERSION = '1.2.0';

/**
 * Storage keys.
 */
var keys = {
    VERSION: 'version',
    GRID_SIZE: 'grid_size',
    DIAGONAL: 'diagonal',
    CIRCULAR: 'circular',
    INVERT_SELF: 'invert_self',
    GRID: 'grid',
    GAME_SAVE: 'game_save',
    TIME: 'time',
    BEST_TIME: 'best_time',
    MOVE_COUNT: 'move_count',
    BEST_MOVE_COUNT: 'best_move_count',
    SCORE: 'score',
    HIGH_SCORE: 'high_score',
    HAS_SHARED: 'has_shared'
};


function StorageManager(prefix) {
    /**
     * Prefix used for keys, in order to separate the different puzzles in storage.
     * Note that local storage is per origin (per domain and protocol), so this
     * prefix avoids collisions with other games, too.
     */
    this.prefix = prefix + '_';

    // If the storage uses an old version, erase everything to avoid errors.
    if (this.load(keys.VERSION) !== VERSION) {
        if (DEBUG) log('Clearing storage...');
        this.clear();
        this.save(keys.VERSION, VERSION);
    }
}

/**
 * Returns a string that identifies which mutators are on and which are off.
 */
StorageManager.prototype._getMode = function getMode() {
    var m = this.loadMutators();

    if (m === null) return null;
    return '' + m.size + m.difficulty +
        ((m.diagonal) ? 'd' : '') +
        ((m.circular) ? 'c' : '') +
        ((m.invertSelf) ? 'i' : '') + '_';
};

StorageManager.prototype.clear = function clear() {
    var localStorage = window.localStorage, keys = [], i, key;

    // Iterate over the local storage keys and remove the ones with our prefix.
    // https://html.spec.whatwg.org/multipage/webstorage.html#dom-storage-key
    for (i = 0; i < localStorage.length; ++i) {
        key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
            keys.push(key);
        }
    }
    keys.forEach(function(key, i) {
        localStorage.removeItem(key);
    });
};

StorageManager.prototype.save = function save(key, value) {
    window.localStorage.setItem(this.prefix + key, value);
};
StorageManager.prototype.load = function load(key) {
    return window.localStorage.getItem(this.prefix + key);
};

StorageManager.prototype.saveTemp = function saveTemp(key, value) {
    window.sessionStorage.setItem(this.prefix + key, value);
};
StorageManager.prototype.loadTemp = function loadTemp(key) {
    return window.sessionStorage.getItem(this.prefix + key);
};

StorageManager.prototype.loadBest = function loadBest(key) {
    var best = this.load(key);

    if (best === null) {
        return null;
    }
    return Number(best);
};
/**
 * Saves the best (maximum) value for the key specified to storage.
 */
StorageManager.prototype.saveBest = function saveBest(key, value) {
    var best = this.loadBest(key);

    if (best === null || value > best) {
        this.save(key, value);
    }
};

StorageManager.prototype.saveMutators = function saveMutators(mutators) {
    this.save(keys.MUTATORS, JSON.stringify(mutators));
};
StorageManager.prototype.loadMutators = function loadMutators() {
    return JSON.parse(this.load(keys.MUTATORS));
};

StorageManager.prototype.saveTime = function saveTime(time) {
    this.save(keys.TIME, time);
};
StorageManager.prototype.loadTime = function loadTime() {
    return Number(this.load(keys.TIME));
};
StorageManager.prototype.saveMoveCount = function saveMoveCount(count) {
    this.save(keys.MOVE_COUNT, count);
};
StorageManager.prototype.loadMoveCount = function loadMoveCount() {
    return Number(this.load(keys.MOVE_COUNT));
};
StorageManager.prototype.saveScore = function saveScore(score) {
    this.save(keys.SCORE, score);
};
StorageManager.prototype.loadScore = function loadScore() {
    return Number(this.load(keys.SCORE));
};

StorageManager.prototype.saveBestTime = function saveBestTime(time) {
    this.saveBest(this._getMode() + keys.BEST_TIME, -time);
};
StorageManager.prototype.loadBestTime = function loadBestTime() {
    var best = this.loadBest(this._getMode() + keys.BEST_TIME);
    return (best !== null) ? -best : null;
};
StorageManager.prototype.saveBestMoveCount = function saveBestMoveCount(count) {
    this.saveBest(this._getMode() + keys.BEST_MOVE_COUNT, -count);
};
StorageManager.prototype.loadBestMoveCount = function loadBestMoveCount() {
    var best = this.loadBest(this._getMode() + keys.BEST_MOVE_COUNT);
    return (best !== null) ? -best : null;
};
StorageManager.prototype.saveHighScore = function saveHighScore(score) {
    this.saveBest(this._getMode() + keys.HIGH_SCORE, score);
};
StorageManager.prototype.loadHighScore = function loadHighScore() {
    return this.loadBest(this._getMode() + keys.HIGH_SCORE);
};

StorageManager.prototype.saveGrid = function saveGrid(grid) {
    this.save(keys.GRID, JSON.stringify(grid));
};
StorageManager.prototype.loadGrid = function loadGrid() {
    return JSON.parse(this.load(keys.GRID));
};

StorageManager.prototype.saveGame = function saveGame(game) {
    this.save(keys.GAME_SAVE, game);
};
StorageManager.prototype.loadGame = function loadGame() {
    return this.load(keys.GAME_SAVE);
};

StorageManager.prototype.hasSavedGame = function hasSavedGame() {
    return (this.load(keys.SCORE) !== null);
};

StorageManager.prototype.setHasShared = function setHasShared() {
    this.saveTemp(keys.HAS_SHARED, true);
};
StorageManager.prototype.hasShared = function hasShared() {
    return this.loadTemp(keys.HAS_SHARED) === 'true';
};

/************************************ Utils ***********************************/

/****** String ******/

function pad(str) {
    str = String(str);
    // http://stackoverflow.com/a/5366862/1751037
    return ('00' + str).substring(str.length);
}

function formatTime(elapsedTimeSecs) {
    return pad(Math.floor(elapsedTimeSecs / 60)) + ':' + pad(elapsedTimeSecs % 60);
}

/****** Arrays ******/

/**
 * Shallow-copies a 1D array.
 */
function copy1d(arr) {
    return arr.slice();
}
/**
 * Shallow-copies a 2D array.
 */
function copy2d(array) {
    return array.map(copy1d);
}

/**
 * Fisher-Yates-Durstenfeld shuffle.
 */
function shuffle(array) {
    var i, j, temp;

    for (i = array.length - 1; i > 0; --i) {
        j = Math.floor(Math.random() * (i + 1));

        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/****** Grid ******/

function addNeighbor(neighbors, size, circular, i, j) {
    if (circular) {
        // Wrap the values around. Note the behavior of the % operator.
        i = (i + size) % size;
        j = (j + size) % size;
    } else {
        if (i < 0 || j < 0 || i >= size || j >= size)
            return;
    }
    neighbors.push({i: i, j: j});
}

/**
 * Returns an array of neighbors for the cell located in (i, j).
 * @return {Array.<object>} - the neighbors of the cell specified.
 */
function getCellNeighbors(i, j, size, diagonal, circular) {
    var neighbors = [];

    // Up
    addNeighbor(neighbors, size, circular, i - 1, j);
    // Down
    addNeighbor(neighbors, size, circular, i + 1, j);
    // Left
    addNeighbor(neighbors, size, circular, i, j - 1);
    // Right
    addNeighbor(neighbors, size, circular, i, j + 1);
    if (diagonal) {
        // Up-left
        addNeighbor(neighbors, size, circular, i - 1, j - 1);
        // Up-right
        addNeighbor(neighbors, size, circular, i - 1, j + 1);
        // Down-left
        addNeighbor(neighbors, size, circular, i + 1, j - 1);
        // Down-right
        addNeighbor(neighbors, size, circular, i + 1, j + 1);
    }
    return neighbors;
}

/**
 * Returns a 2D array of neighbors for all the cells of the grid.
 * @return {Array.<Array.<object>>} - the neighbors for each cell of the grid.
 */
function getNeighbors(size, diagonal, circular) {
    var neighbors = [], i, j;

    for (i = 0; i < size; ++i) {
        neighbors.push([]);
        for (j = 0; j < size; ++j) {
            neighbors[i].push(getCellNeighbors(i, j, size, diagonal, circular));
        }
    }
    return neighbors;
}

/**
 * Returns a new grid with random 0/1 values.
 * @param {number} size - the size of the new grid
 * @param {number} difficulty - an integer in the range {0, 1, 2}
 * @return {{Array.<Array.<number>>}} - the new grid 
 */
function newRandomGrid(size, difficulty) {
    var grid = [], chance = 0.75 - difficulty*0.25, i, j;

    // Generate a random grid.
    for (i = 0; i < size; ++i) {
        grid.push([]);
        for (j = 0; j < size; ++j) {
            grid[i].push((Math.random() < chance) ? 1 : 0);
        }
    }
    return grid;
}

function newSolvableGrid(mutators, operator) {
    var grid = [], moves = [], moveCount = 0, neighbors, i, j, valid, copy;

    // Generate a solved grid and a list of unique moves.
    for (i = 0; i < mutators.size; ++i) {
        grid.push([]);
        for (j = 0; j < mutators.size; ++j) {
            grid[i].push(1);
            moves.push({ i: i, j: j });
        }
    }

    neighbors = getNeighbors(mutators.size, mutators.diagonal, mutators.circular);
    // From the solved grid, move some steps back.
    // This guarantees a solvable configuration.
    shuffle(moves);
    // Number of moves to roll back.
    moves.length = 5 + 5*mutators.difficulty + 4*(mutators.size - 4);
    moves.forEach(function(move, index) {
        valid = false;
        neighbors[move.i][move.j].forEach(function undoMove(npos, index) {
            /*jshint bitwise: false */
            var oldVal = grid[npos.i][npos.j],
                newVal = operator(grid[move.i][move.j], oldVal);

            grid[npos.i][npos.j] = newVal;
            valid |= (newVal !== oldVal);
        });
        if (mutators.invertSelf) {
            grid[move.i][move.j] = Number(!grid[move.i][move.j]);
            valid = true;
        }
        if (valid) {
            ++moveCount;
        }
    });

    if (DEBUG) {
        // Reverse the moves to print them in the correct order.
        moves.reverse();
        log(moves.length + ' moves, ' + moveCount + ' valid');
        log(moves);

        // Replay the moves to make sure the puzzle is sound.
        // NOTE: This only works for xor and not.
        copy = copy2d(grid);
        moves.forEach(function(move, index) {
            neighbors[move.i][move.j].forEach(function doMove(npos, index) {
                copy[npos.i][npos.j] = operator(copy[move.i][move.j], copy[npos.i][npos.j]);
            });
            if (mutators.invertSelf) {
                copy[move.i][move.j] = Number(!copy[move.i][move.j]);
            }
        });
        for (i = 0; i < mutators.size; ++i)
            for (j = 0; j < mutators.size; ++j)
                if (copy[i][j] !== 1)
                    log('Invalid puzzle construction!');
    }

    return grid;
}

/****** jQuery ******/

function shake($element, settings) {
    var times = settings.times,
        offset = settings.offset,
        duration = (settings.duration / times) / 3,
        animation0 = { left: '-=' + offset },
        animation1 = { left: '+=' + (offset * 2) },
        animation2 = { left: '-=' + (offset * 2) },
        easing = 'swing', i;

    // Take one step left <('-'<)
    // (and one step right (>'-')>, one to the front and one to the side)
    $element.animate(animation0, duration, easing);
    // Shake, shake, shake!
    for (i = 1; i < times; ++i) {
        $element
            // two to the right
            .animate(animation1, duration, easing)
            // two to the left
            .animate(animation2, duration, easing);
    }
    $element
        // two more to the right
        .animate(animation1, duration, easing)
        // and one to the left, to return to where we started.
        .animate(animation0, duration, easing);
}

var showScoreChange = (function() {
    var scoreModifierPool = (function newScoreModifierPool() {
        var pool = [], pos = -1, len = 10, i;

        for (i = 1; i <= len; ++i) {
            pool.push($('<div class="score-modifier"></div>'));
        }

        return {
            get: function() {
                pos = (pos + 1) % len;
                return pool[pos];
            }
        };
    }());

    function complete() {
        /*jshint validthis: true */
        $(this).remove();
    }

    return function showScoreChange(modifier) {
        var $scoreModifier = scoreModifierPool.get(),
            $scoreDiv = $('#score'),
            $scoreSpan = $scoreDiv.children(),
            scoreOffset = $scoreSpan.offset();

        $scoreModifier
            .text(modifier)
            .appendTo($scoreDiv.parent())
            .offset({
                top: scoreOffset.top +
                    // Randomize it a bit.
                    (0 + Math.floor(Math.random() * 9)),
                left: scoreOffset.left + ($scoreSpan.width() - $scoreModifier.width())/2 +
                    // Randomize it a bit.
                    (-5 + Math.floor(Math.random() * 11))
            })
            .animate({ top: '+=10'}, 500, complete);
    };
}());

/************************************* op *************************************/

/*
 * The following rely heavily on the HTML markup in order to work.
 */

function getNumber($cell) {
    return parseInt($cell.children('div').text(), 10);
}

function setNumber($cell, number) {
    $cell.children('div').text(number);
}

/**
 * Marks the specified cell, according to the value provided.
 */
function markCell($cell, val) {
    $cell.toggleClass('one', (val === 1));
}

/**
 * @return {boolean} - true, if the cell changed
 */
function updateCell($cell, val, operator) {
    var otherVal = getNumber($cell),
        res = operator(val, otherVal);

    setNumber($cell, res);
    markCell($cell, res);

    return (res !== otherVal);
}

function invertCell($cell) {
    var val = getNumber($cell),
        res = Number(!val);

    setNumber($cell, res);
    markCell($cell, res);
}


function fillCell($cell, val) {
    markCell($cell, val);
    $cell.children('div').text(val);
}

function fillHtmlGridFromArr(grid) {
    $('.cell:not(.hidden)').each(function(i) {
        fillCell($(this), grid[Math.floor(i / grid.length)][i % grid.length]);
    });
}

function fillHtmlGridFromStr(str) {
    $('.cell:not(.hidden)').each(function(index) {
        fillCell($(this), +str[index]);
    });
}


/**
 * Returns a dictionary of (string id, jQuery collection) pairs
 * for each neighbor of the grid with the properties specified.
 * @return {object} - the dictionary
 */
function getNeighborDict(size, diagonal, circular) {
    var neighborDict = {}, i, j, cellNeighbors;

    for (i = 0; i < size; ++i) {
        for (j = 0; j < size; ++j) {
            cellNeighbors = getCellNeighbors(i, j, size, diagonal, circular);
            neighborDict['p-' + i + '-' + j] =
                $(cellNeighbors.map(function makeSelector(pos) {
                    return '#p-' + pos.i + '-' + pos.j;
                }).join(','));
        }
    }
    return neighborDict;
}


function updateTime(elapsedTime) {
    $('#time span').text(formatTime(elapsedTime));
}

function updateCount(moveCount) {
    $('#move-count span').text(moveCount);
}

function updateScore(score) {
    $('#score span').text(score);
}

function updateStats(elapsedTime, moveCount, score) {
    updateTime(elapsedTime);
    updateCount(moveCount);
    updateScore(score);
}

function loadBestStats(storage) {
    var best;

    best = storage.loadBestTime();
    $('#best-time span').text((best !== null) ? formatTime(best) : 'N/A');
    best = storage.loadBestMoveCount();
    $('#best-move-count span').text((best !== null) ? best : 'N/A');
    best = storage.loadHighScore();
    $('#high-score span').text((best !== null) ? best : 'N/A');
}


function showAnnotation() {
    $('#annotation')
        .delay(1500)
        .slideDown('slow')
        .find('.close-button')
            .click(function() {
                $(this).parent().slideUp('slow');
            });
}

function setHiddenCells() {
    // Initially hide the fifth and sixth row/column
    // Use a class for quick visibility detection later on.
    $('.five, .six').addClass('hidden');
    // and then show as many as the user selected.
    switch ($('.options input[name="grid-size"]:checked').val()) {
        case '6':
            $('.six').removeClass('hidden');
            /* falls through */
        case '5':
            $('.five').removeClass('hidden');
            /* falls through */
        case '4':
            break;
        default:
            throw new Error('Invalid bot count!');
    }
}


/**
 * The op (operator) namespace.
 */
var op = {};

op.setup = function(options) {
    var opts = $.extend({}, {
            prefix: 'xor',
            operator: null,
            invertSelf: false,
            random: false
        }, options),
        mutators = {
            difficulty: 1,
            size: 5,
            diagonal: false,
            circular: true,
            invertSelf: false
        },
        storage = new StorageManager(opts.prefix),
        intervalId, grid, allNeighbors, elapsedTime, moveCount, score;

    function clearStats() {
        elapsedTime = 0;
        moveCount = 0;
        score = 10000;

        updateStats(elapsedTime, moveCount, score);
    }


    function startTimer() {
        intervalId = setInterval(function updateTimer() {
            var scoreModifier = -1;

            updateTime(++elapsedTime);
            storage.saveTime(elapsedTime);
            // Score decreases with each second passing by.
            updateScore(score += scoreModifier);
            storage.saveScore(score);
            showScoreChange(scoreModifier);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(intervalId);
    }

    function restartTimer() {
        stopTimer();
        startTimer();
    }


    function registerHandlers() {
        var $cells = $('.cell:not(.hidden)'),
            element = null;

        function onMouseEnter() {
            /*jshint validthis: true */
            allNeighbors[$(this).attr('id')].addClass('neighbor');
            return false;
        }

        function onMouseLeave() {
            /*jshint validthis: true */
            allNeighbors[$(this).attr('id')].removeClass('neighbor');
            return false;
        }

        function onClick(event) {
            /*jshint validthis: true, bitwise: false */
            var $cell = $(this), $neighbors = allNeighbors[$cell.attr('id')],
                val = getNumber($cell), valid = false,
                $msgs, i, scoreModifier;

            for (i = 0; i < $neighbors.length; ++i) {
                valid |= updateCell($neighbors.eq(i), val, opts.operator);
            }

            if (mutators.invertSelf) {
                invertCell($cell);
                valid = true;
            }

            if (valid) {
                updateCount(++moveCount);
                // Score decreases with each move.
                scoreModifier = -50;
                updateScore(score += scoreModifier);
                showScoreChange(scoreModifier);
                saveGame();
            } else {
                $('#note')
                    // Take care of clicks in quick succesion.
                    .finish()
                    .fadeIn('slow').delay(750).fadeOut('slow');
                // Shaky effect for invalid moves.
                shake($(event.delegateTarget), {
                    times: 12,
                    offset: 1,
                    duration: 600
                });
            }

            // If all (visible) cells contain '1'
            if ($cells.filter('.one').length === mutators.size * mutators.size) {
                stopTimer();
                $('#final-score').text(score);
                // Choose a random message to show.
                $('#win-msg-container > div').hide();
                if (storage.loadHighScore() < score) {      // New high score!
                    $msgs = $('#win-msg-container > .high-score-msg');
                    $msgs.eq(Math.floor(Math.random() * $msgs.length)).show();
                } else {
                    $msgs = $('#win-msg-container > .share-msg');
                    $msgs.eq(Math.floor(Math.random() * $msgs.length)).show();
                }
                // You Win!
                $('#win-screen').fadeIn(750, 'linear');
                // Update best time, move count and score, if necessary.
                storage.saveBestTime(elapsedTime);
                $('#best-time span').text(formatTime(storage.loadBestTime()));
                storage.saveBestMoveCount(moveCount);
                $('#best-move-count span').text(storage.loadBestMoveCount());
                storage.saveHighScore(score);
                $('#high-score span').text(storage.loadHighScore());
            }

            return false;
        }

        // Note that we remove any previous handlers.
        $('#grid').off().on({
            mouseenter: onMouseEnter,
            mouseleave: onMouseLeave,
            click: onClick,
            touchstart: function onTouchStart(event) {
                // Prevent the browser from firing simulated click events.
                event.preventDefault();

                // Only allow one-touch gestures.
                if (event.touches.length > 1) {
                    return;
                }

                element = this;
                onMouseEnter.call(this);
                $(this).addClass('active');
            },
            // touchmove/end events always refer to the same element as touchstart,
            // so simulate the mousemove event with clientX/Y and elementFromPoint.
            touchmove: function onTouchMove(event) {
                var touch, newElement;

                // Prevent the browser from scrolling the page.
                event.preventDefault();

                // Only allow one-touch gestures.
                if (event.touches.length > 1) {
                    return;
                }

                touch = event.changedTouches[0];
                newElement = document.elementFromPoint(touch.clientX, touch.clientY);
                // The player moved to a different cell.
                if (newElement !== element) {
                    if (element) {
                        onMouseLeave.call(element);
                        $(element).removeClass('active');
                    }
                    if ($(newElement).hasClass('cell')) {
                        onMouseEnter.call(newElement);
                        $(newElement).addClass('active');
                        element = newElement;
                    } else {
                        element = null;
                    }
                }
            },
            touchend: function onTouchEnd(event) {
                event.preventDefault();

                // Ignore if still touching the surface.
                if (event.touches.length > 0) {
                    return;
                }

                if (element) {
                    onClick.call(element, event);
                    onMouseLeave.call(element);
                    $(element).removeClass('active');
                    element = null;
                }

                // http://stackoverflow.com/a/27286193/1751037
                return true;
            }
        }, '.cell');
    }


    function saveGame() {
        storage.saveMoveCount(moveCount);
        storage.saveScore(score);
        storage.saveGame($('.cell:not(.hidden)').children('div').text());
    }

    function loadGame() {
        elapsedTime = storage.loadTime();
        moveCount = storage.loadMoveCount();
        score = storage.loadScore();
        updateStats(elapsedTime, moveCount, score);

        loadBestStats(storage);
        mutators = storage.loadMutators();
        $('.options input[name="difficulty"][value="' + mutators.difficulty + '"]')
            .prop('checked', true);
        $('.options input[name="grid-size"][value="' + mutators.size + '"]')
            .prop('checked', true);
        $('#diagonal').prop('checked', mutators.diagonal);
        $('#circular').prop('checked', mutators.circular);
        $('#invert-self').prop('checked', mutators.invertSelf);

        //
        setHiddenCells();
        registerHandlers();
        fillHtmlGridFromStr(storage.loadGame());

        allNeighbors = getNeighborDict(mutators.size, mutators.diagonal, mutators.circular);
        grid = storage.loadGrid();
    }

    function startGame() {
        // The winning screen may have been left showing.
        $('#win-screen').hide();
        clearStats();

        mutators.difficulty = parseInt($('.options input[name="difficulty"]:checked').val(), 10);
        mutators.size = parseInt($('.options input[name="grid-size"]:checked').val(), 10);
        mutators.diagonal = $('#diagonal').is(':checked');
        mutators.circular = $('#circular').is(':checked');
        mutators.invertSelf = opts.invertSelf || $('#invert-self').is(':checked');
        storage.saveMutators(mutators);
        loadBestStats(storage);

        if (opts.random) {
            grid = newRandomGrid(mutators.size, mutators.difficulty);
        } else {
            grid = newSolvableGrid(mutators, opts.operator);
        }
        allNeighbors = getNeighborDict(mutators.size, mutators.diagonal, mutators.circular);
        //
        setHiddenCells();
        fillHtmlGridFromArr(grid);
        registerHandlers();

        storage.saveGrid(grid);
        // Save now, in case the player does not do anything else.
        saveGame();
    }

    function restartGame() {
        // The winning screen may have been left showing.
        $('#win-screen').hide();
        clearStats();

        fillHtmlGridFromArr(grid);
        // Save now, in case the player does not do anything else.
        saveGame();
        restartTimer();
    }

    function newGame() {
        startGame();
        restartTimer();
    }


    // Show the annotation sometimes.
    if (Math.random() < 0.75) {
        showAnnotation();
    }

    // Prevent text selection on successive clicks.
    $('.cell').on('mousedown', function onMousedown(event) {
        event.preventDefault();     // but let the event propagate!
    });

    if (storage.hasSavedGame()) {
        loadGame();
    } else {
        startGame();
    }
    startTimer();

    $('.options input').change(newGame);
    $('.start-button').click(newGame);
    $('.restart-button').click(restartGame);
};


// Expose;
window.op = op;

}(jQuery, window, document));
