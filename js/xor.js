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
(function($, window) {

"use strict";

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

/******************************* Local Storage ********************************/

// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
// http://dev.w3.org/html5/webstorage/

/** @const {string} */
var FIVE_KEY = 'five',
/** @const {string} */
    DIAGONAL_KEY = 'diagonal',
/** @const {string} */
    CIRCULAR_KEY = 'circular',
/** @const {string} */
    GAME_SAVE_KEY = 'game_save',
/** @const {string} */
    TIME_KEY = 'time',
/** @const {string} */
    BEST_TIME_KEY = 'best_time',
/** @const {string} */
    MOVE_COUNT_KEY = 'move_count',
/** @const {string} */
    BEST_MOVE_COUNT_KEY = 'best_move_count';


/**
 * Prefix used for keys, in order to separate the different puzzles in storage.
 * Module-level global.
 */
var prefix = '';

function save(key, value) {
    window.localStorage.setItem(prefix + key, value);
}

function load(key) {
    return window.localStorage.getItem(prefix + key);
}

function loadBest(key) {
    var best = load(key);

    if (best === null) {
        return null;
    }
    return Number(best);
}

function saveBest(key, value) {
    var best = loadBest(key);

    if (best === null || value < best) {
        save(key, value);
    }
}


function saveTime(time) {
    save(TIME_KEY, time);
}
function loadTime() {
    return Number(load(TIME_KEY));
}
function saveMoveCount(count) {
    save(MOVE_COUNT_KEY, count);
}
function loadMoveCount() {
    return Number(load(MOVE_COUNT_KEY));
}
function saveBestTime(time) {
    saveBest(BEST_TIME_KEY, time);
}
function loadBestTime() {
    return loadBest(BEST_TIME_KEY);
}
function saveBestMoveCount(count) {
    saveBest(BEST_MOVE_COUNT_KEY, count);
}
function loadBestMoveCount() {
    return loadBest(BEST_MOVE_COUNT_KEY);
}


function saveGame() {
    // Options
    save(FIVE_KEY, $('#five').prop('checked'));
    save(DIAGONAL_KEY, $('#diagonal').prop('checked'));
    save(CIRCULAR_KEY, $('#circular').prop('checked'));
    // Actual game
    save(GAME_SAVE_KEY, $('#grid').html());
}

function loadGame() {
    // Options
    $('#five').prop('checked', load(FIVE_KEY) === 'true');
    $('#diagonal').prop('checked', load(DIAGONAL_KEY) === 'true');
    $('#circular').prop('checked', load(CIRCULAR_KEY) === 'true');
    // Actual game
    $('#grid').html(load(GAME_SAVE_KEY));
}

function hasSavedGame() {
    return (load(FIVE_KEY) !== null);
}

/************************************* op *************************************/

/**
 * Don't forget to set this to false in production!
 * @const
 */
var DEBUG = !true;

/**
 * The op namespace.
 */
var op = {};


function pad(str) {
    str = String(str);
    return ('00' + str).substring(str.length);
}

function formatTime(elapsedTimeSecs) {
    return pad(Math.floor(elapsedTimeSecs / 60)) + ':' + pad(elapsedTimeSecs % 60);
}


function getPos($cell) {
    var posStr = $cell.attr('id'),
        posArr = posStr.split('-');

    return {
        i: parseInt(posArr[1], 10),
        j: parseInt(posArr[2], 10)
    };
}

function getCellSelector(i, j) {
    return '#p-' + i + '-' + j;
}

function addNeighbor(neighbors, size, circular, i, j) {
    if (circular) {
        // Wrap the values around. Note the % operator behavior.
        i = (i + size) % size;
        j = (j + size) % size;
    } else if (i < 0 || j < 0 || i >= size || j >= size) {
        return;
    }
    neighbors.push(getCellSelector(i, j));
}

function getNeighbors(position, size, diagonal, circular) {
    var i = position.i, j = position.j, neighbors = [], multiSelector;

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
    multiSelector = neighbors.join(', ');
    if (DEBUG) log('Multiple selector: ' + multiSelector);
    return $(multiSelector);
}


function getNumber($cell) {
    return parseInt($cell.text(), 10);
}

function setNumber($cell, number) {
    $cell.text(number);
}

/**
 * @return {boolean} - true, if the cell changed
 */
function updateCell($cell, val, operator) {
    var otherVal = getNumber($cell),
        res = operator(val, otherVal);

    setNumber($cell, res);
    // Mark the cell as needed.
    $cell.toggleClass('one', (res === 1));

    return (res !== otherVal);
}


// The timer ID.
var intervalId;

op.start = function(newGame, opts) {
    var $cells,
        size, diagonal, circular,
        elapsedTime, moveCount, best;

    if (DEBUG) log(opts);
    if (newGame === undefined) newGame = true;

    prefix = opts.prefix;

    best = loadBestTime();
    if (best !== null) {
        $('#best-time span').text(formatTime(best));
    }
    best = loadBestMoveCount();
    if (best !== null) {
        $('#best-move-count span').text(best);
    }

    if (!newGame && hasSavedGame()) {
        elapsedTime = loadTime();
        $('#time span').text(formatTime(elapsedTime));
        moveCount = loadMoveCount();
        $('#move-count span').text(moveCount);

        loadGame();
        // Remove possible class remnants.
        $('.cell').removeClass('active neighbor');
    } else {
        elapsedTime = 0;
        moveCount = 0;

        // Generate a new grid.
        $('.cell').text(function(index, oldText) {
            var val = (Math.random() < 0.6) ? 0 : 1;

            // Mark the cell as needed.
            $(this).toggleClass('one', (val === 1));

            return val;
        });
        // Save it now, in case the player does not do anything else.
        saveMoveCount(moveCount);
        saveGame();
    }

    size = ($('#five').is(':checked')) ? 5 : 4;
    diagonal =  $('#diagonal').is(':checked');
    circular =  $('#circular').is(':checked');

    // Reset timer and move count.
    if (intervalId) {
        clearInterval(intervalId);
        $('#time span').text('00:00');
        $('#move-count span').text('0');
    }
    // Start timer.
    intervalId = setInterval(function updateTimer() {
        ++elapsedTime;
        $('#time span').text(formatTime(elapsedTime));
        saveTime(elapsedTime);
    }, 1000);

    // Cache the cells.
    $cells = $('.cell').filter(':visible');

    // The winning screen may have been left showing.
    $('#win-screen').hide();

    $('#grid')
        // Remove any previous handlers.
        .off()
        .on({
            mouseenter: function onMouseenter(event) {
                var $this = $(this);

                $this.addClass('active');
                getNeighbors(getPos($this), size, diagonal, circular)
                    .addClass('neighbor');
                return false;
            },
            mouseleave: function onMouseleave(event) {
                var $this = $(this);

                $this.removeClass('active');
                getNeighbors(getPos($this), size, diagonal, circular)
                    .removeClass('neighbor');
                return false;
            },
            click: function onClick(event) {
                var $cell = $(this), val = getNumber($cell), valid = false;

                getNeighbors(getPos($cell), size, diagonal, circular)
                    .each(function update(i, el) {
                        valid |= updateCell($(this), val, opts.operator);
                    });

                if (valid) {
                    $('#move-count span').text(++moveCount);
                }

                // If all (visible) cells contain '1'
                if ($cells.filter('.one').length === size * size) {
                    // Stop the timer.
                    clearInterval(intervalId);
                    // You Win!
                    $('#win-screen').fadeIn(750, 'linear');
                    // Update best time and move count, if necessary.
                    saveBestTime(elapsedTime);
                    $('#best-time span').text(formatTime(loadBestTime()));
                    saveBestMoveCount(moveCount);
                    $('#best-move-count span').text(loadBestMoveCount());
                }

                // Save each time the player makes a move,
                // so as not to lose any progress.
                saveMoveCount(moveCount);
                saveGame();

                // The mouseleave event does not fire after clicks on mobile.
                $cell.trigger('mouseleave');
                return false;
            }
        }, '.cell');
};

// Expose;
window.op = op;

}(jQuery, window));
