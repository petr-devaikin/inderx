var THRESHOLD = 100;
var SLIDER_THRESHOLD = 100;

var maxPhotos,
    currentPhoto;

var nextData,
    currentData;


var participantInfo = {
    name: '',
    preference: '',
    friends: [],
    interests: []
}

$(document).ready(function() {
    $('.m-startscreen__start').click(function() {
        participantInfo.preference = $(this).attr('val');
        startSession(start);
    });

    $.ajaxSetup({ cache: true });
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
        FB.init({
            appId: '909920825808716',
            version: 'v2.7' // or v2.1, v2.2, v2.3, ...
        });
        FB.getLoginStatus(updateStatusCallback);
    });

    $('.m-startscreen__name').change(function() {
        participantInfo.name = $('.m-startscreen__name').val();
        if (participantInfo.name != '')
            $('.m-startscreen__start').attr('disabled', null);
        else
            $('.m-startscreen__start').attr('disabled', 'disabled');
    });
});

function updateStatusCallback(status) {
    console.log(status);
    if (status.status == "connected") {
        console.log('logout');
        FB.logout();
    }

    $('.m-startscreen__fb').click(function() {
        FB.login(fbLoginCallback, { scope: 'public_profile,user_friends,user_likes'});
    });
}

function fbLoginCallback(user) {
    FB.api('/me?fields=id,name', function(response) {
        participantInfo.name = response.name;
        $('.m-startscreen__name').val(response.name);

        $('.m-startscreen__fb').attr('disabled', 'disabled');
        $('.m-startscreen__start').attr('disabled', null);
    });

    FB.api('/me/invitable_friends?limit=100', function(response) {
        participantInfo.friends = [];
        for (var i=0; i < response.data.length; i++)
            participantInfo.friends.push({
                name: response.data[i].name,
                picture: response.data[i].picture.data.url
            });

        console.log(participantInfo.friends);
    });

    FB.api('/me/likes?limit=100', function(response) {
        participantInfo.interests = [];
        for (var i=0; i < response.data.length; i++)
            participantInfo.interests.push({ name: response.data[i].name });

        console.log(participantInfo.interests);
    });
}


function start() {
    $('.m-mainview').show();
    $('.m-startscreen').hide();

    getNextCard(true);

    setSliderHandler();
    setScrollHandler();

    setButtonsHandler();
}


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

                reportEvent(currentData.id, 'go to next photo', currentPhoto+1, maxPhotos);
            }
            else if (ev.deltaX > SLIDER_THRESHOLD && currentPhoto > 0) {
                currentPhoto--;

                $('.m-slider__nav__item--active').removeClass('m-slider__nav__item--active');
                $('.m-slider__nav__item').eq(currentPhoto).addClass('m-slider__nav__item--active');

                left = -$(window).innerWidth() * currentPhoto;
                container.addClass('released').css('left', left + 'px');
                reportEvent(currentData.id, 'go to prev photo', currentPhoto+1, maxPhotos );
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
        reportEvent(currentData.id, 'scroll', 'photos', v);
    }

    v = checkVisibility(friends);
    if (friendsVisible === undefined || friendsVisible != v) {
        friendsVisible = v;
        reportEvent(currentData.id, 'scroll', 'friends', v);
    }

    v = checkVisibility(interests);
    if (interestsVisible === undefined || interestsVisible != v) {
        interestsVisible = v;
        reportEvent(currentData.id, 'scroll', 'interests', v);
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
    reportEvent(currentData.id, 'like', {});

    $('.m-card:last').animate({
            left: $(window).innerWidth()
        }, 100, function() {
            $(this).remove();
            if (updateCurrentCard()) {
                getNextCard();
                setPanHandler();
            }
        });
}

function dislikeCard() {
    reportEvent(currentData.id, 'dislike', {});

    $('.m-card:last').animate({
            left: -$(window).innerWidth()
        }, 100, function() {
            $(this).remove();
            if (updateCurrentCard()) {
                getNextCard();
                setPanHandler();
            }
        });
}

function superlikeCard() {
    reportEvent(currentData.id, 'superlike', {});

    $('.m-card:last').animate({
            top: -$(window).innerHeight()
        }, 100, function() {
            $(this).remove();
            if (updateCurrentCard()) {
                getNextCard();
                setPanHandler();
            }
        });
}

function clickCard() {
    showInfo();
}

function showInfo() {
    reportEvent(currentData.id, 'open details', {});

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
        reportEvent(currentData.id, 'close details');

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
                f.append($('<div class="m-profile__friends__friend__photo">').css('background-image', 'url(' + friend.picture + ')'));
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
                var f = $('<div class="m-profile__interests__item">').text(interest.name);
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

    if (currentData === undefined) {
        $('.m-mainview__footer').hide();
        $('.m-mainview__thankyou').show();
        return false;
    }
    else
        reportCurrentCard();
    return true;
}

function reportCurrentCard() {
    reportEvent(currentData.id, 'new profile');
}

//=========================
var counter = 0;
function getNextCard(setCurrent) {
    $.get('/next', { sessionId: participantInfo.id, gender: participantInfo.preference }, function(data) {
        if (data.end !== undefined)
            nextData = undefined;
        else {
            addNewCard(data, setCurrent);
            if (setCurrent !== undefined) {
                console.log('request second card');
                getNextCard();
            }
        }
    });
}


// Create new participant and start session
function startSession(callback) {
    $.post('/session', participantInfo, function(data) {
        participantInfo.id = data.participantId;
        callback();
    }, 'json');
}


// Record screen event
function reportEvent(targetId, type, param1, param2) {
    var sessionId = participantInfo.id;

    console.log(sessionId + '. ' + targetId + '. ' + type + ': ' + param1 + ', ' + param2);
    $.post('/action', {
        sessionId: sessionId,
        targetId: targetId,
        type: type,
        param1: param1,
        param2: param2
    });
}
