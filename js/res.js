var PIXEL_PER_SECOND = 40;

data = data.filter(function(a) { return a.finish; });

var shows = d3.select('.m-shows').selectAll('.m-show').data(data)
    .enter()
        .append('div')
            .classed('m-show', true);


shows
    .style('width', function(d) {
        var start = new Date(d.start);
        var finish = new Date(d.finish);
        return PIXEL_PER_SECOND * (finish - start) / 1000 + 'px';
    });

shows
    .append('div')
    .classed('result', true)
    .classed('like', function(d) { return d.result == 'like'; })
    .classed('dislike', function(d) { return d.result == 'dislike'; })
    .classed('superlike', function(d) { return d.result == 'superlike'; });

shows
    .append('div')
    .classed('overall', true)
    .text(function(d) {
        var start = new Date(d.start);
        var finish = new Date(d.finish);
        var res = (finish - start) / 1000;
        var s = Math.floor(res / 60) + ":";
        if (Math.round(res % 60) < 10)
            s += "0";
        return s + Math.round(res % 60);
    });

var actions = shows.selectAll('.action').data(function(d) {
        return d.actions.filter(function(a) {
            return a.type == 'open details' ||
                   a.type == 'close details' ||
                   a.type == 'go to next photo' ||
                   a.type == 'go to prev photo';
        });
    })
    .enter()
    .append('div')
    .classed('action', true)
    .classed('action--open', function(d) { return d.type == 'open details';})
    .classed('action--close', function(d) { return d.type == 'close details';})
    .classed('action--next', function(d) { return d.type == 'go to next photo';})
    .classed('action--prev', function(d) { return d.type == 'go to prev photo';})
    .style('left', function(d) {
        var start = new Date(d3.select(this.parentNode).datum().start);
        var t = new Date(d.time);
        return Math.round(PIXEL_PER_SECOND * (t - start) / 1000) + 'px';
    })
    .html(function(d) {
        var start = new Date(d3.select(this.parentNode).datum().start);
        var t = new Date(d.time);
        return '&nbsp;' + Math.round((t - start) / 100) / 10;
    });

var emotions = shows.selectAll('.emotion').data(function(d) { return d.emotions; })
    .enter()
    .append('div')
    .classed('emotion', true)
    .classed('emotion--up', function(d) { return d.type == 'emg_0';})
    .classed('emotion--down', function(d) { return d.type == 'emg_1';})
    .style('left', function(d) {
        var start = new Date(d3.select(this.parentNode).datum().start);
        var t = new Date(d.time);
        return Math.round(PIXEL_PER_SECOND * (t - start) / 1000) + 'px';
    })
    .html(function(d) {
        return '';
        var start = new Date(d3.select(this.parentNode).datum().start);
        var t = new Date(d.time);
        return '&nbsp;' + Math.round((t - start) / 100) / 10;
    });
