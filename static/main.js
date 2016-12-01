var THRESHOLD = 100;
var SLIDER_THRESHOLD = 100;

var sessionId = 13;
var gender = 'male';

var maxPhotos,
    currentPhoto;

var nextData,
    currentData;

$(function() {
    getNextCard(true);
    getNextCard();

    setSliderHandler();
    setScrollHandler();

    setButtonsHandler();
});


function setPanHandler() {
    var frontCard = $('.m-card:last');

    var mc = new Hammer(frontCard.get()[0]);
    mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    var currentStatus = undefined;

    mc.on("pan", function(ev) {
        frontCard.removeClass('released');

        frontCard
            .css('left', ev.deltaX)
            .css('top', ev.deltaY)
            .css('-webkit-transform', 'rotate(' + ev.deltaX * 0.05 + 'deg)')
            .css('transform', 'rotate(' + ev.deltaX * 0.05 + 'deg)');


        if (ev.deltaY < -2 * THRESHOLD) {
            if (currentStatus != 'superliked') {
                currentStatus = 'superliked';
                frontCard
                    .addClass('superliked')
                    .removeClass('liked disliked');
            }
        }
        else if (ev.deltaX < -THRESHOLD) {
            if (currentStatus != 'disliked') {
                currentStatus = 'disliked';
                frontCard
                    .addClass('disliked')
                    .removeClass('liked superliked');
            }
        }
        else if (ev.deltaX > THRESHOLD) {
            if (currentStatus != 'liked') {
                currentStatus = 'liked';
                frontCard
                    .addClass('liked')
                    .removeClass('disliked superliked');
            }
        }
        else if (currentStatus !== undefined) {
            currentStatus = undefined;
            frontCard
                .removeClass('superliked liked disliked');
        }

        if (ev.isFinal) {
            startY = undefined;
            if (currentStatus == 'liked')
                likeCard();
            else if (currentStatus == 'disliked')
                dislikeCard();
            else if (currentStatus == 'superliked')
                superlikeCard();
            else {
                frontCard
                    .addClass('released')
                    .css('top', 0)
                    .css('left', 0)
                    .css('-webkit-transform', 'rotate(0deg)')
                    .css('transform', 'rotate(0deg)');
            }
        }
    });

    frontCard.click(function() {
        clickCard();
    })
}

function setSliderHandler() {
    var container = $('.m-slider__container');
    var slider = new Hammer($('.m-slider').get()[0]);

    slider.on("pan", function(ev) {
        if (maxPhotos <= 1)
            return;

        container.removeClass('released');

        var left = -$(window).innerWidth() * currentPhoto;

        var shiftedLeft = left + ev.deltaX;

        if (shiftedLeft > 0)
            shiftedLeft = left;
        else if (shiftedLeft < -(maxPhotos - 1) * $(window).innerWidth())
            shiftedLeft = left;

        container.css('left', shiftedLeft);


        if (ev.isFinal) {
            if (ev.deltaX < -SLIDER_THRESHOLD && currentPhoto < maxPhotos - 1) {
                currentPhoto++;

                $('.m-slider__nav__item--active').removeClass('m-slider__nav__item--active');
                $('.m-slider__nav__item').eq(currentPhoto).addClass('m-slider__nav__item--active');

                left = -$(window).innerWidth() * currentPhoto;
                container.addClass('released').css('left', left + 'px');

                reportEvent(sessionId, currentData.id, 'go to next photo', { current: currentPhoto+1, total: maxPhotos });
            }
            else if (ev.deltaX > SLIDER_THRESHOLD && currentPhoto > 0) {
                currentPhoto--;

                $('.m-slider__nav__item--active').removeClass('m-slider__nav__item--active');
                $('.m-slider__nav__item').eq(currentPhoto).addClass('m-slider__nav__item--active');

                left = -$(window).innerWidth() * currentPhoto;
                container.addClass('released').css('left', left + 'px');
                reportEvent(sessionId, currentData.id, 'go to prev photo', { current: currentPhoto+1, total: maxPhotos });
            }
            else {
                container.addClass('released').css('left', left + 'px');
            }
        }
    });
}


var interestsVisible = undefined;
var friendsVisible = undefined;
var photosVisible = undefined;

function checkVisibility(block) {
    var scrollTop = $('.m-profile').scrollTop();
    var windowHeight = $(window).innerHeight();
    var blockTop = block.position().top + scrollTop;
    var blockBottom = blockTop + block.innerHeight();

    //console.log(blockBottom);
    //console.log(scrollTop);

    if (!block.is(':hidden')) {
        if (blockTop < scrollTop + windowHeight - 150 && blockBottom > scrollTop + 50) {
            return true;
        }
        else {
            return false;
        }
    }
    else
        return false;
}

function checkAllBlocks() {
    var friends = $('.m-profile__friends');
    var interests = $('.m-profile__interests');
    var photos = $('.m-profile__photos');

    var v = checkVisibility(photos);
    if (photosVisible === undefined || photosVisible != v) {
        photosVisible = v;
        reportEvent(sessionId, currentData.id, 'scroll', { type: 'photos', visible: v });
    }

    v = checkVisibility(friends);
    if (friendsVisible === undefined || friendsVisible != v) {
        friendsVisible = v;
        reportEvent(sessionId, currentData.id, 'scroll', { type: 'friends', visible: v });
    }

    v = checkVisibility(interests);
    if (interestsVisible === undefined || interestsVisible != v) {
        interestsVisible = v;
        reportEvent(sessionId, currentData.id, 'scroll', { type: 'interests', visible: v });
    }
}

function setScrollHandler() {
    var details = $('.m-profile');


    $(details).scroll(function() {
        checkAllBlocks();
    })
}

function setButtonsHandler() {
    $('.m-button--dislike').click(function() {
        closeInfo(true);
        $('.m-card:last').addClass('disliked');
        setTimeout(function() { dislikeCard(); }, 200);
    });

    $('.m-button--like').click(function() {
        closeInfo(true);
        $('.m-card:last').addClass('liked');
        setTimeout(function() { likeCard(); }, 200);
    });

    $('.m-button--superlike').click(function() {
        closeInfo(true);
        $('.m-card:last').addClass('superliked');
        setTimeout(function() { superlikeCard(); }, 200);
    });

    $('.m-profile__close').click(function() {
        closeInfo();
    });

    $('.m-profile__photos').click(function() {
        closeInfo();
    });
}


function likeCard() {
    reportEvent(sessionId, currentData.id, 'like', {});

    $('.m-card:last').animate({
            left: $(window).innerWidth()
        }, 100, function() {
            $(this).remove();
            updateCurrentCard();
            getNextCard();
            setPanHandler();
        });
}

function dislikeCard() {
    reportEvent(sessionId, currentData.id, 'dislike', {});

    $('.m-card:last').animate({
            left: -$(window).innerWidth()
        }, 100, function() {
            $(this).remove();
            updateCurrentCard();
            getNextCard();
            setPanHandler();
        });
}

function superlikeCard() {
    reportEvent(sessionId, currentData.id, 'superlike', {});

    $('.m-card:last').animate({
            top: -$(window).innerHeight()
        }, 100, function() {
            $(this).remove();
            updateCurrentCard();
            getNextCard();
            setPanHandler();
        });
}

function clickCard() {
    showInfo();
}

function showInfo() {
    reportEvent(sessionId, currentData.id, 'open details', {});

    $('.m-profile')
        .show()
        .scrollTop(0);

    interestsVisible = undefined;
    friendsVisible = undefined;
    photosVisible = undefined;

    checkAllBlocks();
}

function closeInfo(muteEvent) {
    if ($('.m-profile').is(':hidden'))
        return;

    if (!muteEvent)
        reportEvent(sessionId, currentData.id, 'close details', {});

    $('.m-profile').hide();
}

//======================

function addNewCard(data, setCurrent) {
    var emptyCard = $('.m-card--empty');
    var newCard = emptyCard.clone();
    newCard.removeClass('m-card--empty');

    $('.m-card__photo', newCard).css('background-image', 'url(' + data.photos[0] + ')');
    $('.m-card__title__inner__name', newCard).text(data.name);
    $('.m-card__title__inner__age', newCard).text(data.age);
    if (data.desc == '')
        $('.m-card__title__inner__desc', newCard).remove();
    else
        $('.m-card__title__inner__desc', newCard).text(data.desc);
    if (data.interests.length == 0)
        $('.m-card__title__inner__interests', newCard).remove();
    else
        $('.m-card__title__inner__interests', newCard).text(data.interests.length);
    if (data.friends.length == 0)
        $('.m-card__title__inner__friends', newCard).remove();
    else
        $('.m-card__title__inner__friends', newCard).text(data.friends.length);

    // details
    if (currentData != undefined) {
        $('.m-profile__info__name').text(currentData.name);
        $('.m-profile__info__age').text(currentData.age);
        if (currentData.desc)
            $('#details_desc').show().text(currentData.desc);
        else
            $('#details_desc').hide();
        $('#details_dist').text(currentData.distance);
        if (currentData.info)
            $('.m-profile__profile').show().html(currentData.info.replace('\n', '<br/>'));
        else
            $('.m-profile__profile').hide();

        // friends
        $('.m-profile__friends__friend').remove();
        if (currentData.friends.length == 0)
            $('.m-profile__friends').hide();
        else {
            var c = currentData.friends.length;
            $('.m-profile__friends').show();
            $('.m-profile__friends__counter').text(c + ' common connection' + ((c > 1) ? 's' : ''));
            for (var i in currentData.friends) {
                var friend = currentData.friends[i];
                var f = $('<div class="m-profile__friends__friend">');
                f.append($('<div class="m-profile__friends__friend__photo">').css('background-image', 'url(' + friend.image + ')'));
                f.append(friend.name);
                $('.m-profile__friends__container').append(f);
            }
        }

        // interests
        $('.m-profile__interests__item').remove();
        if (currentData.interests.length == 0)
            $('.m-profile__interests').hide();
        else {
            var c = currentData.interests.length;
            $('.m-profile__interests').show();
            $('.m-profile__interests__counter').text(c + ' interest' + ((c > 1) ? 's' : ''));
            for (var i in currentData.interests) {
                var interest = currentData.interests[i];
                var f = $('<div class="m-profile__interests__item">').text(interest);
                $('.m-profile__interests__items').append(f);
            }
        }

        // photos
        $('.m-slider__nav__item').remove();
        $('.m-slider__slide').remove();
        $('.m-slider__container')
            .css('width', 100 * currentData.photos.length + '%')
            .css('left', 0);

        if (currentData.photos.length == 1)
            $('.m-slider__nav').hide();
        else
            $('.m-slider__nav').show();

        maxPhotos = currentData.photos.length;
        currentPhoto = 0;

        for (var i in currentData.photos) {
            var p = currentData.photos[i];
            $('.m-slider__nav').append(
                $('<div class="m-slider__nav__item ' + ((i == 0) ? 'm-slider__nav__item--active' : '') + '">')
            );
            $('.m-slider__container').append(
                $('<div class="m-slider__slide">')
                    .css('width', $(window).innerWidth())
                    .css('background-image', 'url("' + p + '")')
            );
        }
    }


    if (setCurrent) {
        currentData = data;
        $('.m-mainview__card').append(newCard);
        setPanHandler();
        reportCurrentCard();
    }
    else {
        nextData = data;
        emptyCard.after(newCard);
    }
}

function updateCurrentCard() {
    currentData = nextData;
    reportCurrentCard();
}

function reportCurrentCard() {
    reportEvent(sessionId, currentData.id, 'new profile', {
        id: currentData.id,
        age: currentData.age,
        photos: currentData.photos.length,
        friends: currentData.friends.length,
        interests: currentData.interests.length,
        hasInfo: currentData.info.length > 0
    });
}

//=========================
var counter = 0;
function getNextCard(setCurrent) {
    $.get('/next', { gender: gender }, function(data) {
        addNewCard(data, setCurrent);
    });
}


//=========================
function reportEvent(sessionId, targetId, type, params) {
    if (params === undefined)
        params = {};

    console.log(sessionId + '. ' + targetId + '. ' + type + ': ' + JSON.stringify(params));
    $.post('/event', {
        sessionId: sessionId,
        targetId: targetId,
        type: type,
        params: params
    });
}
