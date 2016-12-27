/**
 * xor
 * https://import-this.github.io/xor
 *
 * A small collection of simple logic puzzle games - #xor.
 *
 * Copyright (c) 2016, Vasilis Poulimenos
 * Released under the BSD 3-Clause License
 * https://github.com/import-this/xor/blob/master/LICENSE
 *
 * Supported browsers (as suggested by online references):
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

function getAllNeighbors(size, diagonal, circular) {
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

    function getNeighbors(i, j, size, diagonal, circular) {
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

    var neighbors = [], i, j;

    for (i = 0; i < size; ++i) {
        neighbors.push([]);
        for (j = 0; j < size; ++j) {
            neighbors[i].push(getNeighbors(i, j, size, diagonal, circular));
        }
    }

    return neighbors;
}

function newRandomGrid(size) {
    var grid = [], i, j;

    // Generate a random grid.
    for (i = 0; i < size; ++i) {
        grid.push([]);
        for (j = 0; j < size; ++j) {
            grid[i].push((Math.random() < 0.6) ? 0 : 1);
        }
    }
    return grid;
}

function newSolvableGrid(size, allNeighbors, operator, invertSelf) {
    var grid = [], moves = [], moveCount = 0, i, j, k, pos, valid, copy;

    // Generate a solved grid and a list of unique moves.
    for (i = 0; i < size; ++i) {
        grid.push([]);
        for (j = 0; j < size; ++j) {
            grid[i].push(1);
            moves.push(i*size + j);
        }
    }

    // From the solved grid, move some steps back.
    // This guarantees a solvable configuration.
    function undoMove(pos, index) {
        /*jshint bitwise: false */
        var oldVal = grid[pos.i][pos.j],
            newVal = operator(grid[i][j], oldVal);

        grid[pos.i][pos.j] = newVal;
        valid |= (newVal !== oldVal);
    }

    shuffle(moves);
    // Number of moves to roll back.
    k = 10 + 5*(size - 4);
    moves.length = k;
    for (k = k - 1; k >= 0; --k) {
        pos = moves[k];
        i = Math.floor(pos / size);
        j = pos % size;

        valid = false;
        allNeighbors[i][j].forEach(undoMove);
        if (invertSelf) {
            grid[i][j] = Number(!grid[i][j]);
            valid = true;
        }

        if (valid) {
            ++moveCount;
        }
    }


    if (DEBUG) {
        log(moves.length + ' moves');
        log(moves);
        log(moveCount);

        // Replay the moves to make sure the puzzle is sound.
        // NOTE: This only works for xor and not.
        copy = copy2d(grid);
        moves.forEach(function(move, index) {
            var i = Math.floor(move / size),
                j = move % size;

            allNeighbors[i][j].forEach(function move(pos, index) {
                copy[pos.i][pos.j] = operator(copy[i][j], copy[pos.i][pos.j]);
            });
            if (invertSelf) {
                copy[i][j] = Number(!copy[i][j]);
            }
        });
        for (i = 0; i < size; ++i)
            for (j = 0; j < size; ++j)
                if (copy[i][j] !== 1)
                    log('Invalid puzzle construction!');
    }

    return grid;
}

/****** jQuery ******/

function getNumber($cell) {
    return parseInt($cell.text(), 10);
}

function setNumber($cell, number) {
    $cell.text(number);
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


function newScoreModifierPool() {
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
}

var scoreModifierPool = newScoreModifierPool();

function complete() {
    /*jshint validthis: true */
    $(this).remove();
}

function scoreEffect(modifier) {
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
}

/******************************* Local Storage ********************************/

// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
// http://dev.w3.org/html5/webstorage/

/**
 * The version number. Useful for marking changes in the storage format.
 * @const {string}
 */
var VERSION = '1.1.0';

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
 *
 */
StorageManager.prototype._getMode = function getMode() {
    return '' + this.loadGridSize() +
        ((this.loadDiagonal()) ? 'd' : '') +
        ((this.loadCircular()) ? 'c' : '') +
        ((this.loadInvertSelf()) ? 'i' : '') + '_';
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

StorageManager.prototype.saveGridSize = function saveGridSize(size) {
    this.save(keys.GRID_SIZE, size);
};
StorageManager.prototype.loadGridSize = function loadGridSize() {
    return Number(this.load(keys.GRID_SIZE));
};
StorageManager.prototype.saveDiagonal = function saveDiagonal(enabled) {
    this.save(keys.DIAGONAL, enabled);
};
StorageManager.prototype.loadDiagonal = function loadDiagonal() {
    return this.load(keys.DIAGONAL) === 'true';
};
StorageManager.prototype.saveCircular = function saveCircular(enabled) {
    this.save(keys.CIRCULAR, enabled);
};
StorageManager.prototype.loadCircular = function loadCircular() {
    return this.load(keys.CIRCULAR) === 'true';
};
StorageManager.prototype.saveInvertSelf = function saveInvertSelf(enabled) {
    this.save(keys.INVERT_SELF, enabled);
};
StorageManager.prototype.loadInvertSelf = function loadInvertSelf() {
    return this.load(keys.INVERT_SELF) === 'true';
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

/************************************* op *************************************/

/*
 * The following rely on the HTML markup in order to work.
 */

function fillHtmlGrid(grid) {
    $('.cell').filter(':visible').text(function(i, oldText) {
        var val = grid[Math.floor(i / grid.length)][i % grid.length];

        markCell($(this), val);
        return val;
    });
}

function makeCellSelector(i, j) {
    return '#p-' + i + '-' + j;
}

function getPos($cell) {
    var posStr = $cell.attr('id'),
        posArr = posStr.split('-');

    return {
        i: parseInt(posArr[1], 10),
        j: parseInt(posArr[2], 10)
    };
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


/**
 * The op (operator) namespace.
 */
var op = {};

/**
 * The timer ID.
 */
var intervalId;

op._start = function(newGame, opts) {
    var storage, grid, size, diagonal, circular, invertSelf, allNeighbors,
        elapsedTime, moveCount, score;

    if (newGame === undefined) newGame = true;

    function clearStats() {
        elapsedTime = 0;
        moveCount = 0;
        score = 10000;

        updateStats(elapsedTime, moveCount, score);
    }

    function resetTimer(storage) {
        // Reset timer and move count.
        if (intervalId) {
            clearInterval(intervalId);
        }
        // Start timer.
        intervalId = setInterval(function updateTimer() {
            var scoreModifier = -1;

            updateTime(++elapsedTime);
            storage.saveTime(elapsedTime);
            // Score decreases with each second passing by.
            updateScore(score += scoreModifier);
            storage.saveScore(score);
            scoreEffect(scoreModifier);
        }, 1000);
    }

    function save() {
        storage.saveMoveCount(moveCount);
        storage.saveScore(score);
        storage.saveGame($('#grid').html());
    }

    storage = new StorageManager(opts.prefix);

    if (!newGame && storage.hasSavedGame()) {
        elapsedTime = storage.loadTime();
        moveCount = storage.loadMoveCount();
        score = storage.loadScore();

        updateStats(elapsedTime, moveCount, score);

        size = storage.loadGridSize();
        diagonal = storage.loadDiagonal();
        circular = storage.loadCircular();
        invertSelf = storage.loadInvertSelf();

        $('#options input[name="grid-size"][value="' + size + '"]').prop('checked', true);
        $('#diagonal').prop('checked', diagonal);
        $('#circular').prop('checked', circular);
        $('#invert-self').prop('checked', invertSelf);

        $('#grid').html(storage.loadGame());
        // Remove possible class remnants.
        $('.cell').removeClass('neighbor');

        allNeighbors = getAllNeighbors(size, diagonal, circular);

        grid = storage.loadGrid();
    } else {
        clearStats();

        size = parseInt($('#options input[name="grid-size"]:checked').val(), 10);
        diagonal = $('#diagonal').is(':checked');
        circular = $('#circular').is(':checked');
        invertSelf = opts.invertSelf || $('#invert-self').is(':checked');

        storage.saveGridSize(size);
        storage.saveDiagonal(diagonal);
        storage.saveCircular(circular);
        storage.saveInvertSelf(invertSelf);

        allNeighbors = getAllNeighbors(size, diagonal, circular);

        if (opts.random) {
            grid = newRandomGrid(size);
        } else {
            grid = newSolvableGrid(size, allNeighbors, opts.operator, invertSelf);
        }
        fillHtmlGrid(grid);
        storage.saveGrid(grid);
        // Save now, in case the player does not do anything else.
        save();
    }

    $('.restart-button').off().click(function() {
        clearStats();
        resetTimer(storage);

        $('#win-screen').hide();

        fillHtmlGrid(grid);
        // Save now, in case the player does not do anything else.
        save();
    });

    (function loadStats(storage) {
        var best;

        best = storage.loadBestTime();
        $('#best-time span').text((best !== null) ? formatTime(best) : 'N/A');
        best = storage.loadBestMoveCount();
        $('#best-move-count span').text((best !== null) ? best : 'N/A');
        best = storage.loadHighScore();
        $('#high-score span').text((best !== null) ? best : 'N/A');
    }(storage));

    resetTimer(storage);

    // The winning screen may have been left showing.
    $('#win-screen').hide();

    (function registerHandlers(storage, size, diagonal, circular, invertSelf, allNeighbors) {
        function markNeighbor(pos, index) {
            $(makeCellSelector(pos.i, pos.j)).addClass('neighbor');
        }
        function unmarkNeighbor(pos, index) {
            $(makeCellSelector(pos.i, pos.j)).removeClass('neighbor');
        }

        // Cache the cells.
        var $cells = $('.cell').filter(':visible'),
            element = null;

        function onMouseEnter() {
            var thisPos = getPos($(this));

            allNeighbors[thisPos.i][thisPos.j].forEach(markNeighbor);
            return false;
        }

        function onMouseLeave() {
            var thisPos = getPos($(this));

            allNeighbors[thisPos.i][thisPos.j].forEach(unmarkNeighbor);
            return false;
        }

        function onClick(event) {
            /*jshint bitwise: false */
            var $cell = $(this), val = getNumber($cell), pos = getPos($cell),
                neighbors = allNeighbors[pos.i][pos.j], valid = false,
                i, scoreModifier, $msgs;

            for (i = 0; i < neighbors.length; ++i) {
                pos = neighbors[i];
                valid |= updateCell(
                    $(makeCellSelector(pos.i, pos.j)), val, opts.operator);
            }

            if (invertSelf) {
                invertCell($cell);
                valid = true;
            }

            if (valid) {
                updateCount(++moveCount);
                // Score decreases with each move.
                scoreModifier = -100;
                updateScore(score += scoreModifier);
                scoreEffect(scoreModifier);
                save();
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
            if ($cells.filter('.one').length === size * size) {
                // Stop the timer.
                clearInterval(intervalId);
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

                // Use jQuery's originalEvent property to get the touch event!
                touch = event.originalEvent.changedTouches[0];
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
    }(storage, size, diagonal, circular, invertSelf, allNeighbors));
};

op.start = function(options) {
    function startGame(newGame) {
        // Initially hide the fifth and sixth row/column
        $('.five, .six').hide();
        // and then show as many as the user selected.
        switch ($('#options input[name="grid-size"]:checked').val()) {
            case '6':
                $('.six').show();
                /* falls through */
            case '5':
                $('.five').show();
                /* falls through */
            case '4':
                break;
            default:
                throw new Error('Invalid bot count!');
        }

        op._start(newGame, options);

        // Make the cells square.
        square();
    }

    // Let the game begin (old or new).
    startGame(false);

    $('#options input').change(startGame);
    $('.start-button').click(startGame);
};


function square() {
    var $cells = $('.cell');
    $cells.height($cells.width());
}

// Keep the cells square.
$(window).resize(square);


// Expose;
window.op = op;

}(jQuery, window, document));
