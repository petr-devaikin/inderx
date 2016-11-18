var frontCard = document.getElementById("frontCard");

var mc = new Hammer(frontCard);

var THRESHOLD = 100;

mc.on("pan", function(ev) {
    $(frontCard)
        .removeClass('released')
        .css('left', ev.deltaX);

    if (ev.deltaX < -THRESHOLD)
        $(frontCard)
            .addClass('disliked')
            .removeClass('liked');
    else if (ev.deltaX > THRESHOLD)
        $(frontCard)
            .removeClass('disliked')
            .addClass('liked');

    if (ev.isFinal) {
        if (ev.deltaX > THRESHOLD)
            likeCard();
        else if (ev.deltaX < -THRESHOLD)
            dislikeCard();
        else {
            $(frontCard)
                .addClass('released')
                .css('left', 0);
        }
    }
});

function likeCard() {
    console.log('LIKE!');
}

function dislikeCard() {
    console.log('DISLIKE!');
}
